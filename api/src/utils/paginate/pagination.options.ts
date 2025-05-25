import { IsOptional } from 'class-validator';

export class PaginationOptions {
  @IsOptional()
  limit?: number;
  @IsOptional()
  page?: number;
}