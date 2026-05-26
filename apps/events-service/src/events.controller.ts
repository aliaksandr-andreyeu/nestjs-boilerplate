import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload, ClientProxy } from '@nestjs/microservices';
import { CreateEventRpcDto, UpdateEventRpcDto, EventQueryRpcDto, DeleteEventRpcDto } from '@shared';
import { EventsService } from '@events/events.service';

@Controller()
export class EventsController {
  constructor(
    private eventsService: EventsService,
    @Inject('NATS_CLIENT') private natsClient: ClientProxy
  ) {}

  @MessagePattern('events.create')
  async create(@Payload() data: CreateEventRpcDto) {
    const event = await this.eventsService.create(data);
    this.natsClient.emit('event.created', event);
    return event;
  }

  @MessagePattern('events.findAll')
  findAll(@Payload() query: EventQueryRpcDto) {
    return this.eventsService.findAll(query);
  }

  @MessagePattern('events.findOne')
  findOne(@Payload() id: string) {
    return this.eventsService.findOne(id);
  }

  @MessagePattern('events.update')
  update(@Payload() data: UpdateEventRpcDto) {
    return this.eventsService.update(data.id, data);
  }

  @MessagePattern('events.delete')
  delete(@Payload() data: DeleteEventRpcDto) {
    return this.eventsService.delete(data.id, data.userId);
  }
}
