import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { PatientService } from './patient.service';
import { TenantDataSourceService } from '../database/tenant-data-source.service';
import { Patient, PatientSex } from './patient.entity';
import { CreatePatientDto, UpdatePatientDto } from './patient.dto';

const SCHEMA = 'tenant_test';
const USER_ID = 'user-123';

function makePatient(partial: Partial<Patient> = {}): Patient {
  return {
    id: 'pat-1',
    fullName: 'João da Silva',
    birthDate: '1990-01-15',
    cpf: '123.456.789-00',
    cns: null,
    sex: PatientSex.MASCULINO,
    phonePrimary: '11999990000',
    phoneSecondary: null,
    email: null,
    cep: null,
    street: null,
    streetNumber: null,
    neighborhood: null,
    city: null,
    uf: null,
    insurance: null,
    clinicalNotes: null,
    isActive: true,
    deletedAt: null,
    createdBy: USER_ID,
    updatedBy: USER_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  };
}

describe('PatientService', () => {
  let service: PatientService;
  let mockRepo: {
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let mockDs: { getRepository: jest.Mock };
  let mockTenantDs: { getDataSource: jest.Mock };

  beforeEach(async () => {
    mockRepo = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockDs = { getRepository: jest.fn(() => mockRepo) };
    mockTenantDs = { getDataSource: jest.fn(() => Promise.resolve(mockDs)) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientService,
        { provide: TenantDataSourceService, useValue: mockTenantDs },
      ],
    }).compile();

    service = module.get<PatientService>(PatientService);
  });

  describe('findAll', () => {
    it('returns paginated patients', async () => {
      const patients = [makePatient()];
      mockRepo.findAndCount.mockResolvedValue([patients, 1]);

      const result = await service.findAll(SCHEMA, { page: '1', limit: '20' });

      expect(result.data).toEqual(patients);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(mockTenantDs.getDataSource).toHaveBeenCalledWith(SCHEMA);
    });

    it('defaults to page 1 when params are omitted', async () => {
      mockRepo.findAndCount.mockResolvedValue([[], 0]);
      const result = await service.findAll(SCHEMA, {});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('findById', () => {
    it('returns patient when found', async () => {
      const patient = makePatient();
      mockRepo.findOne.mockResolvedValue(patient);

      const result = await service.findById(SCHEMA, 'pat-1');

      expect(result).toEqual(patient);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'pat-1', deletedAt: IsNull() },
      });
    });

    it('throws NotFoundException when patient does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findById(SCHEMA, 'not-found')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const dto: CreatePatientDto = {
      fullName: 'Maria Souza',
      birthDate: '1985-06-20',
      cpf: '987.654.321-00',
      phonePrimary: '11988880000',
    };

    it('creates and returns a new patient', async () => {
      mockRepo.findOne.mockResolvedValue(null); // CPF not taken
      const patient = makePatient({ fullName: dto.fullName, cpf: dto.cpf });
      mockRepo.create.mockReturnValue(patient);
      mockRepo.save.mockResolvedValue(patient);

      const result = await service.create(SCHEMA, USER_ID, dto);

      expect(result).toEqual(patient);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { cpf: dto.cpf, deletedAt: IsNull() },
      });
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('throws ConflictException when CPF already exists', async () => {
      mockRepo.findOne.mockResolvedValue(makePatient({ cpf: dto.cpf }));

      await expect(service.create(SCHEMA, USER_ID, dto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('softDelete', () => {
    it('soft-deletes a patient', async () => {
      const patient = makePatient();
      mockRepo.findOne.mockResolvedValue(patient);
      mockRepo.save.mockResolvedValue({ ...patient, deletedAt: new Date() });

      await service.softDelete(SCHEMA, 'pat-1', USER_ID);

      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ deletedAt: expect.any(Date) }),
      );
    });

    it('throws NotFoundException when patient does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.softDelete(SCHEMA, 'not-found', USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
