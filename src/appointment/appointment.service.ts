import { Injectable } from '@nestjs/common';
import { TenantDataSourceService } from '../database/tenant-data-source.service';
import { Appointment } from './appointment.entity';
import { CreateAppointmentDto } from './appointment.dto';

@Injectable()
export class AppointmentService {
  constructor(private readonly tenantDs: TenantDataSourceService) {}

  async findAll(tenantSchema: string): Promise<Appointment[]> {
    const ds = await this.tenantDs.getDataSource(tenantSchema);
    return ds
      .getRepository(Appointment)
      .find({ order: { scheduledAt: 'ASC' } });
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
      scheduledAt: new Date(dto.scheduledAt),
      notes: dto.notes ?? null,
      createdBy: userId,
    });
    return repo.save(appointment);
  }
}
