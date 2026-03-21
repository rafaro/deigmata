import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { I18nContext, i18nValidationMessage } from 'nestjs-i18n';

const parseJsonObject = (value: unknown, messageKey: string) => {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    const i18n = I18nContext.current();
    const message = i18n?.t(messageKey) ?? 'Invalid JSON payload.';
    throw new BadRequestException(message);
  }
};

export class ProjectTransformCsvDto {
  @IsNotEmpty({ message: i18nValidationMessage('validation.project.csvContent.required') })
  @IsString({ message: i18nValidationMessage('validation.project.csvContent.required') })
  csvContent: string;

  @IsOptional()
  @Transform(({ value }) => parseJsonObject(value, 'validation.project.csvMapping.json'))
  @IsObject({ message: i18nValidationMessage('validation.project.csvMapping.object') })
  mapping?: object;

  @IsOptional()
  @IsString()
  @MaxLength(1)
  delimiter?: string;
}
