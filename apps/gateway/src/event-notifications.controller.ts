import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EventPayload } from '@shared';
import { EventsGateway } from '@gateway/events.gateway';

@Controller()
export class EventNotificationsController {
  constructor(private eventsGateway: EventsGateway) {}

  @EventPattern('event.created')
  handleEventCreated(@Payload() event: EventPayload): void {
    this.eventsGateway.notifyAll(event);
  }
}
