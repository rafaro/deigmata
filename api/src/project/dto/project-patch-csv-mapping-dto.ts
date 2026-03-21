import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsObject } from 'class-validator';
import { I18nContext, i18nValidationMessage } from 'nestjs-i18n';

export class ProjectPatchCsvMappingDto {
  @IsNotEmpty({
    message: i18nValidationMessage('validation.project.csvMapping.required')
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        const i18n = I18nContext.current();
        const message =
          i18n?.t('validation.project.csvMapping.json') ??
          'csvMapping must be valid JSON.';
        throw new BadRequestException(message);
      }
    }

    return value;
  })
  @IsObject({ message: i18nValidationMessage('validation.project.csvMapping.object') })
  csvMapping: object;
}
