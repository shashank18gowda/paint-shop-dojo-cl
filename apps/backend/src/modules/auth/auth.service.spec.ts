import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { faker } from '@faker-js/faker';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createPrismaMock, PrismaMock } from '../../test/prisma.mock';

const makeParticipant = (overrides = {}) => ({
  id: faker.string.uuid(),
  code: faker.string.alphanumeric(6).toUpperCase(),
  name: faker.person.fullName(),
  role: 'USER' as const,
  imageUrl: null,
  isActive: true,
  designationId: faker.string.uuid(),
  lineId: faker.string.uuid(),
  participantTypeId: faker.string.uuid(),
  plantId: null,
  enteredAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  designation: { id: faker.string.uuid(), name: 'Paint Shop', code: 'PS', description: null, isActive: true, sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
  line: { id: faker.string.uuid(), name: 'Line A', code: 'LA', isActive: true, sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
  participantType: { id: faker.string.uuid(), name: 'Operator', code: 'OP', isActive: true, sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
  plant: { id: faker.string.uuid(), name: 'Plant X', location: 'Factory A', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaMock;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') } as unknown as jest.Mocked<JwtService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('login', () => {
    it('returns a token and participant profile for a valid employee code', async () => {
      const participant = makeParticipant();
      prisma.participant.findUnique.mockResolvedValue(participant);

      const result = await service.login({ employeeCode: participant.code });

      expect(result.token).toBe('signed.jwt.token');
      expect(result.participant.id).toBe(participant.id);
      expect(result.participant.code).toBe(participant.code);
      expect(result.participant.name).toBe(participant.name);
      expect(result.participant.designation).toBe(participant.designation.name);
      expect(result.participant.line).toBe(participant.line.name);
      expect(result.participant.type).toBe(participant.participantType.name);
    });

    it('signs JWT with correct sub, code, and designationId', async () => {
      const participant = makeParticipant();
      prisma.participant.findUnique.mockResolvedValue(participant);

      await service.login({ employeeCode: participant.code });

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: participant.id,
        code: participant.code,
        designationId: participant.designationId,
      });
    });

    it('throws NotFoundException when employee code does not exist', async () => {
      prisma.participant.findUnique.mockResolvedValue(null);

      await expect(service.login({ employeeCode: 'UNKNOWN' })).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException with the employee code in the message', async () => {
      prisma.participant.findUnique.mockResolvedValue(null);

      await expect(service.login({ employeeCode: 'EMP999' })).rejects.toThrow(
        'Employee code "EMP999" not found',
      );
    });
  });

  describe('getMe', () => {
    it('returns the participant from prisma', async () => {
      const participant = makeParticipant();
      prisma.participant.findUnique.mockResolvedValue(participant);

      const result = await service.getMe(participant.id);

      expect(result).toEqual({
        id: participant.id,
        name: participant.name,
        code: participant.code,
        designation: participant.designation.name,
        designationId: participant.designationId,
        line: participant.line.name,
        lineId: participant.lineId,
        type: participant.participantType.name,
        plant: participant.plant?.name,
        imageUrl: participant.imageUrl,
      });
      expect(prisma.participant.findUnique).toHaveBeenCalledWith({
        where: { id: participant.id },
        include: { designation: true, line: true, participantType: true, plant: true },
      });
    });
  });
});
