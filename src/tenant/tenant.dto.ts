import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({
    example: 'Clínica Saúde Total',
    minLength: 2,
    maxLength: 150,
    description:
      'Nome da clínica/tenant. Será usado para gerar o schema do banco.',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;
}

export class TenantResponseDto {
  @ApiProperty({ example: 'uuid-v4' })
  id: string;

  @ApiProperty({ example: 'Clínica Saúde Total' })
  name: string;

  @ApiProperty({ example: 'clinica_saude_total_1abc' })
  schemaName: string;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: '2026-04-06T12:00:00Z' })
  createdAt: Date;
}
