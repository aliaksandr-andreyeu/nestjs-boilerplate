import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RpcException } from '@nestjs/microservices';
import { CreateEventRpcDto, UpdateEventRpcDto, EventQueryRpcDto, EventsListResponse, EventPayload } from '@shared';
import { PrismaService } from '@events/prisma/prisma.service';

const LIST_CACHE_TTL_MS = 30_000;
const ONE_CACHE_TTL_MS = 300_000;

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache
  ) {}

  async create(data: CreateEventRpcDto): Promise<EventPayload> {
    const event = await this.prisma.event.create({ data });
    await this.cache.del(this.listCacheKey());
    return event;
  }

  async findAll(query: EventQueryRpcDto): Promise<EventsListResponse> {
    const cacheKey = this.listCacheKey(query);
    const cached = await this.cache.get<EventsListResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.event.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.event.count()
    ]);
    const result: EventsListResponse = { data, meta: { page, limit, total } };
    await this.cache.set(cacheKey, result, LIST_CACHE_TTL_MS);
    return result;
  }

  async findOne(id: string): Promise<EventPayload> {
    const cacheKey = this.oneCacheKey(id);
    const cached = await this.cache.get<EventPayload>(cacheKey);
    if (cached) {
      return cached;
    }

    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new RpcException('Event not found');
    await this.cache.set(cacheKey, event, ONE_CACHE_TTL_MS);
    return event;
  }

  async update(id: string, data: UpdateEventRpcDto): Promise<EventPayload> {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new RpcException('Event not found');
    if (event.createdBy !== data.userId) throw new RpcException('Forbidden');
    const updated = await this.prisma.event.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.date !== undefined && { date: data.date })
      }
    });
    await this.invalidateEventCache(id);
    return updated;
  }

  async delete(id: string, userId: string): Promise<EventPayload> {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new RpcException('Event not found');
    if (event.createdBy !== userId) throw new RpcException('Forbidden');
    const deleted = await this.prisma.event.delete({ where: { id } });
    await this.invalidateEventCache(id);
    return deleted;
  }

  private listCacheKey(query?: EventQueryRpcDto): string {
    if (!query || Object.keys(query).length === 0) {
      return 'events:list:default';
    }
    return `events:list:${JSON.stringify(query)}`;
  }

  private oneCacheKey(id: string): string {
    return `events:one:${id}`;
  }

  private async invalidateEventCache(id: string): Promise<void> {
    await Promise.all([this.cache.del(this.oneCacheKey(id)), this.cache.del(this.listCacheKey())]);
  }
}
