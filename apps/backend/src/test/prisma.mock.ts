import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

export type PrismaMock = DeepMockProxy<PrismaService>;

export const createPrismaMock = (): PrismaMock => mockDeep<PrismaService>();
