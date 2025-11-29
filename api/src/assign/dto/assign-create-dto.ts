import { IsOptional, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class AssignCreateDto {
  @MaxLength(100, { message: i18nValidationMessage('validation.assign.name.maxLength') })
  name: string;

  @IsOptional()
  projectid: number;

}
