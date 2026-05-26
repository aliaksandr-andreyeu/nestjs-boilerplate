import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  Inject,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  CreateEventDto,
  UpdateEventDto,
  EventQueryDto,
  CreateEventRpcDto,
  UpdateEventRpcDto,
  DeleteEventRpcDto,
  JwtAuthGuard,
  AuthFastifyRequest,
  EventPayload,
  EventsListResponse
} from '@shared';

@Controller('events')
export class EventsController {
  constructor(@Inject('EVENTS_SERVICE') private readonly eventsClient: ClientProxy) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateEventDto, @Req() req: AuthFastifyRequest): Promise<EventPayload> {
    const payload: CreateEventRpcDto = {
      ...dto,
      createdBy: req.user.sub
    };
    return firstValueFrom(this.eventsClient.send<EventPayload>('events.create', payload));
  }

  @Get()
  async findAll(@Query() query: EventQueryDto): Promise<EventsListResponse> {
    return firstValueFrom(this.eventsClient.send<EventsListResponse>('events.findAll', query));
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<EventPayload> {
    return firstValueFrom(this.eventsClient.send<EventPayload>('events.findOne', id));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @Req() req: AuthFastifyRequest
  ): Promise<EventPayload> {
    const payload: UpdateEventRpcDto = {
      id,
      ...dto,
      userId: req.user.sub
    };
    return firstValueFrom(this.eventsClient.send<EventPayload>('events.update', payload));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: AuthFastifyRequest): Promise<void> {
    const payload: DeleteEventRpcDto = {
      id,
      userId: req.user.sub
    };
    await firstValueFrom(this.eventsClient.send<EventPayload>('events.delete', payload));
  }
}
