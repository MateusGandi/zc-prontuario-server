import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PatientSex } from './patient.entity';

export class CreatePatientDto {
  @ApiProperty({
    example: 'Maria Aparecida Souza',
    maxLength: 200,
    description: 'Nome completo',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  fullName!: string;

  @ApiProperty({
    example: '1985-06-15',
    description: 'Data de nascimento (YYYY-MM-DD)',
  })
  @IsDateString()
  birthDate!: string;

  @ApiProperty({
    example: '123.456.789-00',
    description: 'CPF no formato 000.000.000-00',
  })
  @IsNotEmpty()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
    message: 'CPF inválido (use formato 000.000.000-00)',
  })
  cpf!: string;

  @ApiPropertyOptional({
    example: '123456789012345',
    maxLength: 15,
    description: 'Cartão Nacional de Saúde (CNS)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  cns?: string;

  @ApiPropertyOptional({
    enum: PatientSex,
    example: PatientSex.FEMININO,
    description: 'Sexo biológico',
  })
  @IsOptional()
  @IsEnum(PatientSex)
  sex?: PatientSex;

  @ApiProperty({
    example: '(11) 99999-0000',
    maxLength: 20,
    description: 'Telefone principal',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  phonePrimary!: string;

  @ApiPropertyOptional({
    example: '(11) 88888-0000',
    maxLength: 20,
    description: 'Telefone secundário',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneSecondary?: string;

  @ApiPropertyOptional({
    example: 'maria@email.com',
    maxLength: 200,
    description: 'E-mail',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @ApiPropertyOptional({
    example: '01310-100',
    maxLength: 9,
    description: 'CEP (somente dígitos ou com hífen)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(9)
  cep?: string;

  @ApiPropertyOptional({
    example: 'Av. Paulista',
    maxLength: 200,
    description: 'Logradouro',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  street?: string;

  @ApiPropertyOptional({
    example: '1000',
    maxLength: 20,
    description: 'Número',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  streetNumber?: string;

  @ApiPropertyOptional({
    example: 'Bela Vista',
    maxLength: 100,
    description: 'Bairro',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  neighborhood?: string;

  @ApiPropertyOptional({
    example: 'São Paulo',
    maxLength: 100,
    description: 'Cidade',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    example: 'SP',
    maxLength: 2,
    description: 'UF (2 letras)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  uf?: string;

  @ApiPropertyOptional({
    example: 'Unimed',
    maxLength: 200,
    description: 'Convênio/plano de saúde',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  insurance?: string;

  @ApiPropertyOptional({
    example: 'Paciente hipertenso, uso contínuo de losartana.',
    description: 'Anotações clínicas livres',
  })
  @IsOptional()
  @IsString()
  clinicalNotes?: string;
}

export class UpdatePatientDto {
  @ApiPropertyOptional({ example: 'Maria Aparecida Souza', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;

  @ApiPropertyOptional({ example: '1985-06-15', description: 'YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({
    example: '123.456.789-00',
    description: 'Formato 000.000.000-00',
  })
  @IsOptional()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
    message: 'CPF inválido (use formato 000.000.000-00)',
  })
  cpf?: string;

  @ApiPropertyOptional({ example: '123456789012345', maxLength: 15 })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  cns?: string;

  @ApiPropertyOptional({ enum: PatientSex, example: PatientSex.FEMININO })
  @IsOptional()
  @IsEnum(PatientSex)
  sex?: PatientSex;

  @ApiPropertyOptional({ example: '(11) 99999-0000', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phonePrimary?: string;

  @ApiPropertyOptional({ example: '(11) 88888-0000', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneSecondary?: string;

  @ApiPropertyOptional({ example: 'maria@email.com', maxLength: 200 })
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @ApiPropertyOptional({ example: '01310-100', maxLength: 9 })
  @IsOptional()
  @IsString()
  @MaxLength(9)
  cep?: string;

  @ApiPropertyOptional({ example: 'Av. Paulista', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  street?: string;

  @ApiPropertyOptional({ example: '1000', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  streetNumber?: string;

  @ApiPropertyOptional({ example: 'Bela Vista', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  neighborhood?: string;

  @ApiPropertyOptional({ example: 'São Paulo', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'SP', maxLength: 2 })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  uf?: string;

  @ApiPropertyOptional({ example: 'Unimed', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  insurance?: string;

  @ApiPropertyOptional({
    example: 'Paciente hipertenso, uso contínuo de losartana.',
  })
  @IsOptional()
  @IsString()
  clinicalNotes?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'false para desativar o paciente',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PatientQueryDto {
  @ApiPropertyOptional({
    example: 'Maria',
    description: 'Busca por nome, CPF ou CNS',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: '1',
    description: 'Número da página (padrão: 1)',
  })
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({
    example: '20',
    description: 'Itens por página (padrão: 20, máx: 100)',
  })
  @IsOptional()
  limit?: string;
}
