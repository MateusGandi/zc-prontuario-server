import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import {
  WebhookSubscription,
  WebhookDelivery,
  WebhookEvent,
  DeliveryStatus,
} from './webhook.entity';
import { CreateWebhookDto } from './webhook.dto';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';

const MAX_RETRIES = 4;
const RETRY_DELAYS_MS = [30000, 300000, 1800000, 7200000]; // 30s, 5m, 30m, 2h

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(WebhookSubscription)
    private readonly subscriptions: Repository<WebhookSubscription>,
    @InjectRepository(WebhookDelivery)
    private readonly deliveries: Repository<WebhookDelivery>,
    private readonly cb: CircuitBreakerService,
  ) {}

  findAll(tenantId?: string): Promise<WebhookSubscription[]> {
    const where = tenantId ? { tenantId, active: true } : { active: true };
    return this.subscriptions.find({ where });
  }

  async subscribe(dto: CreateWebhookDto): Promise<WebhookSubscription> {
    const sub = this.subscriptions.create({
      url: dto.url,
      events: dto.events,
      secret: dto.secret ?? null,
      tenantId: dto.tenantId ?? null,
    });
    return this.subscriptions.save(sub);
  }

  async unsubscribe(id: string): Promise<void> {
    const sub = await this.subscriptions.findOne({ where: { id } });
    if (!sub) throw new NotFoundException('Webhook not found');
    sub.active = false;
    await this.subscriptions.save(sub);
  }

  getDeliveries(subscriptionId: string): Promise<WebhookDelivery[]> {
    return this.deliveries.find({
      where: { subscriptionId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  /**
   * Dispatches an event to all matching active subscriptions.
   */
  async dispatch(
    event: WebhookEvent,
    payload: object,
    tenantId?: string,
  ): Promise<void> {
    const subs = await this.subscriptions.find({ where: { active: true } });
    const matching = subs.filter(
      (s) =>
        s.events.includes(event) &&
        (s.tenantId === null || s.tenantId === (tenantId ?? null)),
    );

    for (const sub of matching) {
      const delivery = this.deliveries.create({
        subscriptionId: sub.id,
        event,
        payload,
        status: DeliveryStatus.PENDING,
        attempts: 0,
        nextRetryAt: null,
      });
      const saved = await this.deliveries.save(delivery);
      this.send(sub, saved).catch(() => {});
    }
  }

  /**
   * Retry a previously failed delivery.
   */
  async retryDelivery(deliveryId: string): Promise<WebhookDelivery> {
    const delivery = await this.deliveries.findOne({
      where: { id: deliveryId },
      relations: ['subscription'],
    });
    if (!delivery) throw new NotFoundException('Delivery not found');
    await this.send(delivery.subscription, delivery);
    return this.deliveries.findOne({
      where: { id: deliveryId },
    }) as Promise<WebhookDelivery>;
  }

  private async send(
    sub: WebhookSubscription,
    delivery: WebhookDelivery,
  ): Promise<void> {
    delivery.attempts += 1;

    const body = JSON.stringify({
      event: delivery.event,
      data: delivery.payload,
    });
    const timestamp = Date.now().toString();
    const signature = sub.secret
      ? 'sha256=' +
        crypto
          .createHmac('sha256', sub.secret)
          .update(timestamp + '.' + body)
          .digest('hex')
      : undefined;

    const doFetch = async (url: string) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Event': delivery.event,
        'X-Webhook-Timestamp': timestamp,
      };
      if (signature) headers['X-Webhook-Signature'] = signature;

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(10000),
      });

      return res;
    };

    try {
      const res = await this.cb.fire(`webhook:${sub.id}`, doFetch, sub.url);

      delivery.httpStatus = res.status;
      delivery.responseBody = (await res.text()).slice(0, 1000);
      delivery.status = res.ok ? DeliveryStatus.SUCCESS : DeliveryStatus.FAILED;

      if (!res.ok && delivery.attempts < MAX_RETRIES) {
        delivery.nextRetryAt = new Date(
          Date.now() + RETRY_DELAYS_MS[delivery.attempts - 1],
        );
        this.logger.warn(
          `[Webhook ${sub.id}] HTTP ${res.status} — retry in ${RETRY_DELAYS_MS[delivery.attempts - 1]}ms`,
        );
      }
    } catch (err: any) {
      delivery.status = DeliveryStatus.FAILED;
      delivery.responseBody = err?.message ?? 'Unknown error';

      if (delivery.attempts < MAX_RETRIES) {
        delivery.nextRetryAt = new Date(
          Date.now() + RETRY_DELAYS_MS[delivery.attempts - 1],
        );
        this.logger.warn(
          `[Webhook ${sub.id}] Error: ${err?.message} — retry scheduled`,
        );
      } else {
        this.logger.error(
          `[Webhook ${sub.id}] Max retries reached. Giving up.`,
        );
      }
    }

    await this.deliveries.save(delivery);
  }
}
