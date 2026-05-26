import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CreateEventRpcDto, UpdateEventRpcDto, EventQueryRpcDto, EventsListResponse, EventPayload } from '@shared';
import { PrismaService } from '@events/prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateEventRpcDto): Promise<EventPayload> {
    return this.prisma.event.create({ data });
  }

  async findAll(query: EventQueryRpcDto): Promise<EventsListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.event.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.event.count()
    ]);
    return { data, meta: { page, limit, total } };
  }

  async findOne(id: string): Promise<EventPayload> {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new RpcException('Event not found');
    return event;
  }

  async update(id: string, data: UpdateEventRpcDto): Promise<EventPayload> {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new RpcException('Event not found');
    if (event.createdBy !== data.userId) throw new RpcException('Forbidden');
    return this.prisma.event.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.date !== undefined && { date: data.date })
      }
    });
  }

  async delete(id: string, userId: string): Promise<EventPayload> {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new RpcException('Event not found');
    if (event.createdBy !== userId) throw new RpcException('Forbidden');
    return this.prisma.event.delete({ where: { id } });
  }
}
