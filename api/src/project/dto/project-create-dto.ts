import { IsObject, IsOptional, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';
import { I18nContext, i18nValidationMessage } from 'nestjs-i18n';

export class ProjectCreateDto {

  @IsOptional()
  @MaxLength(100, { message: i18nValidationMessage('validation.project.name.maxLength') })
  name: string;

  @IsOptional()
  @MaxLength(50, { message: i18nValidationMessage('validation.project.layout.maxLength') })
  layout: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        const i18n = I18nContext.current();
        const message = i18n?.t('validation.project.kg.json') ?? 'kg must be valid JSON.';
        throw new BadRequestException(message);
      }
    }
    return value;
  })
  @IsObject()
  kg: object;
}
