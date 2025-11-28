import { IsNotEmpty } from 'class-validator';
import { BadRequestException } from '@nestjs/common';

import { Transform } from 'class-transformer';

export class ProjectPatchKgDto {
  @IsNotEmpty({ message: 'KG: campo obrigatório' })
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
  kg: any;
}