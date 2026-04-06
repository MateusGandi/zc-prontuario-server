import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookSubscription, WebhookDelivery } from './webhook.entity';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WebhookSubscription, WebhookDelivery])],
  providers: [WebhookService],
  controllers: [WebhookController],
  exports: [WebhookService],
})
export class WebhookModule {}
