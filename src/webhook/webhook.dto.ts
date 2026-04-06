import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WebhookEvent } from './webhook.entity';

export class CreateWebhookDto {
  @ApiProperty({
    example: 'https://meu-sistema.com/webhook',
    maxLength: 500,
    description: 'URL que receberá os eventos via POST',
  })
  @IsUrl()
  @MaxLength(500)
  url!: string;

  @ApiProperty({
    isArray: true,
    enum: WebhookEvent,
    example: [WebhookEvent.APPOINTMENT_CREATED, WebhookEvent.PATIENT_CREATED],
    description: `Eventos a assinar. Valores possíveis: ${Object.values(WebhookEvent).join(', ')}`,
  })
  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  events!: WebhookEvent[];

  @ApiPropertyOptional({
    example: 'meu-segredo-hmac',
    maxLength: 100,
    description:
      'Segredo para verificação HMAC-SHA256. O header X-Webhook-Signature será enviado como sha256=<hex>.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  secret?: string;

  @ApiPropertyOptional({
    example: 'uuid-do-tenant',
    description:
      'UUID do tenant. Se omitido, a subscription recebe eventos de todos os tenants.',
  })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
