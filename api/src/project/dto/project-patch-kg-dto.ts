import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { I18nContext, i18nValidationMessage } from 'nestjs-i18n';

export class ProjectPatchKgDto {
  @IsNotEmpty({ message: i18nValidationMessage('validation.project.kg.required') })
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
  kg: any;
}
