export interface EventPayload {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
