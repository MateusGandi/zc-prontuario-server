import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { TenantDataSourceService } from '../database/tenant-data-source.service';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { CreateAppointmentDto } from './appointment.dto';

const SCHEMA = 'tenant_test';
const USER_ID = 'user-456';

function makeAppointment(partial: Partial<Appointment> = {}): Appointment {
  return {
    id: 'appt-1',
    patientName: 'Ana Lima',
    professional: 'Dr. Carlos',
    procedureType: 'Consulta',
    scheduledAt: new Date('2026-04-10T09:00:00Z'),
    endAt: new Date('2026-04-10T10:00:00Z'),
    status: AppointmentStatus.AGENDADO,
    origin: null,
    notes: null,
    createdBy: USER_ID,
    updatedBy: USER_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  } as Appointment;
}

describe('AppointmentService', () => {
  let service: AppointmentService;
  let mockRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let mockDs: { getRepository: jest.Mock; query: jest.Mock };
  let mockTenantDs: { getDataSource: jest.Mock };

  beforeEach(async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(() => qb),
    };

    mockDs = {
      getRepository: jest.fn(() => mockRepo),
      query: jest.fn(),
    };
    mockTenantDs = { getDataSource: jest.fn(() => Promise.resolve(mockDs)) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        { provide: TenantDataSourceService, useValue: mockTenantDs },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
  });

  describe('findAll', () => {
    it('returns all appointments ordered by scheduledAt', async () => {
      const appointments = [makeAppointment()];
      mockRepo.find.mockResolvedValue(appointments);

      const result = await service.findAll(SCHEMA);

      expect(result).toEqual(appointments);
      expect(mockRepo.find).toHaveBeenCalledWith({
        order: { scheduledAt: 'ASC' },
      });
    });
  });

  describe('findById', () => {
    it('returns appointment when found', async () => {
      const appt = makeAppointment();
      mockRepo.findOne.mockResolvedValue(appt);

      const result = await service.findById(SCHEMA, 'appt-1');

      expect(result).toEqual(appt);
    });

    it('throws NotFoundException when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findById(SCHEMA, 'not-found')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const dto: CreateAppointmentDto = {
      patientName: 'Paulo Salave',
      professional: 'Dr. Ana',
      scheduledAt: '2026-04-15T14:00:00Z',
      endAt: '2026-04-15T15:00:00Z',
    };

    it('creates and returns a new appointment', async () => {
      const appt = makeAppointment({ patientName: dto.patientName });
      mockRepo.create.mockReturnValue(appt);
      mockRepo.save.mockResolvedValue(appt);

      const result = await service.create(SCHEMA, USER_ID, dto);

      expect(result).toEqual(appt);
      expect(mockRepo.save).toHaveBeenCalled();
    });
  });

  describe('reschedule', () => {
    it('updates scheduledAt and endAt', async () => {
      const original = makeAppointment();
      mockRepo.findOne.mockResolvedValue(original);
      const updated = {
        ...original,
        scheduledAt: new Date('2026-04-20T08:00:00Z'),
        endAt: new Date('2026-04-20T09:00:00Z'),
      };
      mockRepo.save.mockResolvedValue(updated);

      const result = await service.reschedule(SCHEMA, 'appt-1', USER_ID, {
        scheduledAt: '2026-04-20T08:00:00Z',
        endAt: '2026-04-20T09:00:00Z',
      });

      expect(result.scheduledAt).toEqual(updated.scheduledAt);
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when appointment does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.reschedule(SCHEMA, 'not-found', USER_ID, {
          scheduledAt: '2026-04-20T08:00:00Z',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('updates status of appointment', async () => {
      const original = makeAppointment();
      mockRepo.findOne.mockResolvedValue(original);
      const updated = { ...original, status: AppointmentStatus.CONFIRMADO };
      mockRepo.save.mockResolvedValue(updated);

      const result = await service.updateStatus(SCHEMA, 'appt-1', USER_ID, {
        status: AppointmentStatus.CONFIRMADO,
      });

      expect(result.status).toBe(AppointmentStatus.CONFIRMADO);
    });
  });
});
