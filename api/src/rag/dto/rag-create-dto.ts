import { Type, Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class RagCreateDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: i18nValidationMessage('validation.rag.projectId.required') })
  projectId: number;

}
