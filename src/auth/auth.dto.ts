import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'medico@clinica.com',
    description: 'E-mail de acesso',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'senha123', description: 'Senha de acesso' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RegisterDto {
  @ApiProperty({
    example: 'Dr. Ana Lima',
    description: 'Nome completo do usuário',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'ana@clinica.com', description: 'E-mail de acesso' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'senha123',
    minLength: 6,
    description: 'Senha (mín. 6 caracteres)',
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({
    example: '(11) 99999-0000',
    description: 'Telefone (opcional)',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'Clínica Saúde Total',
    description: 'Nome da clínica — será criado um novo tenant',
  })
  @IsString()
  @IsNotEmpty()
  tenantName!: string;
}
