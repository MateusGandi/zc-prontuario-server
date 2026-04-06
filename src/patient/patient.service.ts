import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ILike, IsNull } from 'typeorm';
import { TenantDataSourceService } from '../database/tenant-data-source.service';
import { Patient } from './patient.entity';
import {
  CreatePatientDto,
  PatientQueryDto,
  UpdatePatientDto,
} from './patient.dto';
import { WebhookEvent } from '../webhook/webhook.entity';
import { WebhookService } from '../webhook/webhook.service';

@Injectable()
export class PatientService {
  constructor(
    private readonly tenantDs: TenantDataSourceService,
    private readonly webhooks: WebhookService,
  ) {}

  async findAll(
    tenantSchema: string,
    query: PatientQueryDto,
  ): Promise<{ data: Patient[]; total: number; page: number; limit: number }> {
    const ds = await this.tenantDs.getDataSource(tenantSchema);
    const repo = ds.getRepository(Patient);

    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
    const skip = (page - 1) * limit;

    const where: object[] = [{ deletedAt: IsNull(), isActive: true }];

    if (query.search) {
      const term = query.search.trim();
      where.splice(
        0,
        1,
        { fullName: ILike(`%${term}%`), deletedAt: IsNull() },
        { cpf: ILike(`%${term}%`), deletedAt: IsNull() },
        { cns: ILike(`%${term}%`), deletedAt: IsNull() },
      );
    }

    const [data, total] = await repo.findAndCount({
      where: where as any,
      order: { fullName: 'ASC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findById(tenantSchema: string, id: string): Promise<Patient> {
    const ds = await this.tenantDs.getDataSource(tenantSchema);
    const patient = await ds.getRepository(Patient).findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!patient) throw new NotFoundException('Paciente não encontrado');
    return patient;
  }

  async create(
    tenantSchema: string,
    userId: string,
    dto: CreatePatientDto,
  ): Promise<Patient> {
    const ds = await this.tenantDs.getDataSource(tenantSchema);
    const repo = ds.getRepository(Patient);

    const existing = await repo.findOne({
      where: { cpf: dto.cpf, deletedAt: IsNull() },
    });
    if (existing) throw new ConflictException('CPF já cadastrado neste tenant');

    const patient = repo.create({
      ...dto,
      cns: dto.cns ?? null,
      sex: dto.sex ?? null,
      phoneSecondary: dto.phoneSecondary ?? null,
      email: dto.email ?? null,
      cep: dto.cep ?? null,
      street: dto.street ?? null,
      streetNumber: dto.streetNumber ?? null,
      neighborhood: dto.neighborhood ?? null,
      city: dto.city ?? null,
      uf: dto.uf ?? null,
      insurance: dto.insurance ?? null,
      clinicalNotes: dto.clinicalNotes ?? null,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await repo.save(patient);
    this.webhooks
      .dispatch(WebhookEvent.PATIENT_CREATED, saved, tenantSchema)
      .catch(() => {});
    return saved;
  }

  async update(
    tenantSchema: string,
    userId: string,
    id: string,
    dto: UpdatePatientDto,
  ): Promise<Patient> {
    const patient = await this.findById(tenantSchema, id);
    const ds = await this.tenantDs.getDataSource(tenantSchema);
    const repo = ds.getRepository(Patient);

    if (dto.cpf && dto.cpf !== patient.cpf) {
      const conflict = await repo.findOne({
        where: { cpf: dto.cpf, deletedAt: IsNull() },
      });
      if (conflict)
        throw new ConflictException('CPF já cadastrado neste tenant');
    }

    Object.assign(patient, dto, { updatedBy: userId });
    const saved = await repo.save(patient);
    this.webhooks
      .dispatch(WebhookEvent.PATIENT_UPDATED, saved, tenantSchema)
      .catch(() => {});
    return saved;
  }

  async softDelete(
    tenantSchema: string,
    userId: string,
    id: string,
  ): Promise<void> {
    const patient = await this.findById(tenantSchema, id);
    const ds = await this.tenantDs.getDataSource(tenantSchema);
    await ds.getRepository(Patient).save({
      ...patient,
      isActive: false,
      deletedAt: new Date(),
      updatedBy: userId,
    });
  }
}
