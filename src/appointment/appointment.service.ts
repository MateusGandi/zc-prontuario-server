import { Injectable, NotFoundException } from '@nestjs/common';
import { Between } from 'typeorm';
import { TenantDataSourceService } from '../database/tenant-data-source.service';
import { Appointment, AppointmentStatus } from './appointment.entity';
import {
  CreateAppointmentDto,
  RescheduleDto,
  UpdateAppointmentDto,
  UpdateStatusDto,
} from './appointment.dto';
import { WebhookEvent } from '../webhook/webhook.entity';
import { WebhookService } from '../webhook/webhook.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly tenantDs: TenantDataSourceService,
    private readonly webhooks: WebhookService,
    private readonly audit: AuditService,
  ) {}

  async findAll(tenantSchema: string): Promise<Appointment[]> {
    const ds = await this.tenantDs.getDataSource(tenantSchema);
    return ds
      .getRepository(Appointment)
      .find({ order: { scheduledAt: 'ASC' } });
  }

  async findByRange(
    tenantSchema: string,
    start: Date,
    end: Date,
    filters: {
      professional?: string;
      status?: AppointmentStatus;
      procedureType?: string;
    } = {},
  ): Promise<Appointment[]> {
    const ds = await this.tenantDs.getDataSource(tenantSchema);
    const qb = ds
      .getRepository(Appointment)
      .createQueryBuilder('a')
      .where('a.scheduledAt >= :start AND a.scheduledAt <= :end', {
        start,
        end,
      });

    if (filters.professional) {
      qb.andWhere('a.professional = :professional', {
        professional: filters.professional,
      });
    }
    if (filters.status) {
      qb.andWhere('a.status = :status', { status: filters.status });
    }
    if (filters.procedureType) {
      qb.andWhere('a.procedureType = :procedureType', {
        procedureType: filters.procedureType,
      });
    }

    return qb.orderBy('a.scheduledAt', 'ASC').getMany();
  }

  async findById(tenantSchema: string, id: string): Promise<Appointment> {
    const ds = await this.tenantDs.getDataSource(tenantSchema);
    const appointment = await ds.getRepository(Appointment).findOneBy({ id });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');
    return appointment;
  }

  async create(
    tenantSchema: string,
    userId: string,
    dto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const ds = await this.tenantDs.getDataSource(tenantSchema);
    const repo = ds.getRepository(Appointment);
    const appointment = repo.create({
      patientName: dto.patientName,
      professional: dto.professional ?? null,
      procedureType: dto.procedureType ?? null,
      scheduledAt: new Date(dto.scheduledAt),
      endAt: dto.endAt ? new Date(dto.endAt) : null,
      origin: dto.origin ?? null,
      notes: dto.notes ?? null,
      createdBy: userId,
    });
    const saved = await repo.save(appointment);
    this.webhooks
      .dispatch(WebhookEvent.APPOINTMENT_CREATED, saved, tenantSchema)
      .catch(() => {});
    this.audit.log(ds, {
      tableName: 'agendamentos',
      recordId: saved.id,
      action: 'INSERT',
      newData: saved,
      userId,
    });
    return saved;
  }

  async update(
    tenantSchema: string,
    id: string,
    userId: string,
    dto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.findById(tenantSchema, id);
    const ds = await this.tenantDs.getDataSource(tenantSchema);
    const repo = ds.getRepository(Appointment);

    if (dto.patientName !== undefined)
      appointment.patientName = dto.patientName;
    if (dto.professional !== undefined)
      appointment.professional = dto.professional;
    if (dto.procedureType !== undefined)
      appointment.procedureType = dto.procedureType;
    if (dto.scheduledAt !== undefined)
      appointment.scheduledAt = new Date(dto.scheduledAt);
    if (dto.endAt !== undefined) appointment.endAt = new Date(dto.endAt);
    if (dto.origin !== undefined) appointment.origin = dto.origin;
    if (dto.notes !== undefined) appointment.notes = dto.notes;
    appointment.updatedBy = userId;

    const saved = await repo.save(appointment);
    this.webhooks
      .dispatch(WebhookEvent.APPOINTMENT_UPDATED, saved, tenantSchema)
      .catch(() => {});
    this.audit.log(ds, {
      tableName: 'agendamentos',
      recordId: saved.id,
      action: 'UPDATE',
      oldData: appointment,
      newData: saved,
      userId,
    });
    return saved;
  }

  async updateStatus(
    tenantSchema: string,
    id: string,
    userId: string,
    dto: UpdateStatusDto,
  ): Promise<Appointment> {
    const appointment = await this.findById(tenantSchema, id);
    const ds = await this.tenantDs.getDataSource(tenantSchema);
    const repo = ds.getRepository(Appointment);

    const oldStatus = appointment.status;
    appointment.status = dto.status;
    appointment.updatedBy = userId;

    const saved = await repo.save(appointment);
    const event =
      dto.status === AppointmentStatus.CANCELADO
        ? WebhookEvent.APPOINTMENT_CANCELLED
        : WebhookEvent.APPOINTMENT_UPDATED;
    this.webhooks.dispatch(event, saved, tenantSchema).catch(() => {});
    this.audit.log(ds, {
      tableName: 'agendamentos',
      recordId: saved.id,
      action: 'UPDATE',
      oldData: { status: oldStatus },
      newData: { status: saved.status },
      userId,
    });
    return saved;
  }

  async reschedule(
    tenantSchema: string,
    id: string,
    userId: string,
    dto: RescheduleDto,
  ): Promise<Appointment> {
    const appointment = await this.findById(tenantSchema, id);
    const ds = await this.tenantDs.getDataSource(tenantSchema);
    const repo = ds.getRepository(Appointment);

    appointment.scheduledAt = new Date(dto.scheduledAt);
    appointment.endAt = dto.endAt ? new Date(dto.endAt) : appointment.endAt;
    appointment.updatedBy = userId;

    const saved = await repo.save(appointment);
    this.webhooks
      .dispatch(WebhookEvent.APPOINTMENT_UPDATED, saved, tenantSchema)
      .catch(() => {});
    this.audit.log(ds, {
      tableName: 'agendamentos',
      recordId: saved.id,
      action: 'UPDATE',
      oldData: { scheduledAt: appointment.scheduledAt },
      newData: { scheduledAt: saved.scheduledAt },
      userId,
    });
    return saved;
  }

  /**
   * Retorna slots disponíveis para uma data específica.
   * Intervalos de 30 min entre startHour e endHour.
   * Slots já ocupados (status != cancelado) são excluídos.
   */
  async getAvailability(
    tenantSchema: string,
    date: string,
    professional: string | undefined,
    slotMinutes = 30,
    startHour = 8,
    endHour = 18,
  ): Promise<{ time: string; available: boolean }[]> {
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const ds = await this.tenantDs.getDataSource(tenantSchema);
    const qb = ds
      .getRepository(Appointment)
      .createQueryBuilder('a')
      .where('a.scheduledAt >= :start AND a.scheduledAt <= :end', {
        start: dayStart,
        end: dayEnd,
      })
      .andWhere("a.status != 'cancelado'");

    if (professional) {
      qb.andWhere('a.professional = :professional', { professional });
    }

    const booked = await qb.select(['a.scheduledAt']).getMany();
    const bookedMinutes = new Set(
      booked.map((a) => {
        const d = new Date(a.scheduledAt);
        return d.getUTCHours() * 60 + d.getUTCMinutes();
      }),
    );

    const slots: { time: string; available: boolean }[] = [];
    for (let min = startHour * 60; min < endHour * 60; min += slotMinutes) {
      const h = String(Math.floor(min / 60)).padStart(2, '0');
      const m = String(min % 60).padStart(2, '0');
      slots.push({ time: `${h}:${m}`, available: !bookedMinutes.has(min) });
    }

    return slots;
  }
}
