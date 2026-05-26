import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from '@events/events.service';
import { PrismaService } from '@events/prisma/prisma.service';

const mockPrisma = {
  event: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn()
  }
};

describe('EventsService', () => {
  let service: EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsService, { provide: PrismaService, useValue: mockPrisma }]
    }).compile();

    service = module.get<EventsService>(EventsService);
    vi.clearAllMocks();
  });

  it('should create an event', async () => {
    const dto = { title: 'Test', date: new Date().toISOString(), createdBy: 'user1' };
    const expected = { id: 'ev1', ...dto };
    mockPrisma.event.create.mockResolvedValue(expected);

    const result = await service.create(dto);
    expect(result).toEqual(expected);
  });

  it('should return paginated events', async () => {
    const events = [{ id: '1' }, { id: '2' }];
    mockPrisma.event.findMany.mockResolvedValue(events);
    mockPrisma.event.count.mockResolvedValue(2);

    const result = await service.findAll({ page: 1, limit: 10 });
    expect(result.data).toEqual(events);
    expect(result.meta).toEqual({ page: 1, limit: 10, total: 2 });
  });
});
