import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsSuperAdmin } from '../auth/auth.guard';
import { WebhookService } from './webhook.service';
import { CreateWebhookDto } from './webhook.dto';

@ApiTags('webhooks')
@IsSuperAdmin()
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Get()
  findAll(@Query('tenantId') tenantId?: string) {
    return this.webhookService.findAll(tenantId);
  }

  @Post()
  subscribe(@Body() dto: CreateWebhookDto) {
    return this.webhookService.subscribe(dto);
  }

  @Delete(':id')
  unsubscribe(@Param('id', ParseUUIDPipe) id: string) {
    return this.webhookService.unsubscribe(id);
  }

  @Get(':id/deliveries')
  deliveries(@Param('id', ParseUUIDPipe) id: string) {
    return this.webhookService.getDeliveries(id);
  }

  @Post('deliveries/:id/retry')
  retry(@Param('id', ParseUUIDPipe) id: string) {
    return this.webhookService.retryDelivery(id);
  }
}
