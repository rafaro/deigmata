import { BadRequestException } from '@nestjs/common';
import { IsObject, IsOptional, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class ProjectCreateDto {

  @IsOptional()
  @MaxLength(100, { message: 'NOME: precisa ser menor que 100 caracteres' })
  name: string;

  @IsOptional()
  @MaxLength(50, { message: 'LAYOUT: precisa ser menor que 50 caracteres' })
  layout: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        throw new BadRequestException('kg deve ser um JSON válido');
      }
    }
    return value;
  })
  @IsObject()
  kg: object;
}