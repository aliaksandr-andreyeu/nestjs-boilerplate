import { EventPayload } from './event-payload.interface';

export interface EventsListMeta {
  page: number;
  limit: number;
  total: number;
}

export interface EventsListResponse {
  data: EventPayload[];
  meta: EventsListMeta;
}
