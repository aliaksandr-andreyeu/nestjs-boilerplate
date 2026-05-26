import { IsString, IsOptional, IsDateString, IsUUID, IsInt, Min, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEventRpcDto {
  @IsString()
  @Length(3, 100)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  date!: string;

  @IsUUID()
  createdBy!: string;
}

export class UpdateEventRpcDto {
  @IsUUID()
  id!: string;

  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsString()
  @Length(3, 100)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}

export class EventQueryRpcDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class DeleteEventRpcDto {
  @IsUUID()
  id!: string;

  @IsUUID()
  userId!: string;
}
