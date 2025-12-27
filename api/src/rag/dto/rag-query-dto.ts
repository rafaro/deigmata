import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class RagQueryDto {
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty({ message: i18nValidationMessage('validation.rag.projectId.required') })
  projectId: number;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty({ message: i18nValidationMessage('validation.ragMessage.ragId.required') })
  ragId: number;

  @IsString()
  @IsNotEmpty({ message: i18nValidationMessage('validation.ragMessage.question.required') })
  @MaxLength(300, { message: i18nValidationMessage('validation.ragMessage.question.maxLength') })
  question: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: i18nValidationMessage('validation.ragMessage.temperature.number') })
  @Min(0, { message: i18nValidationMessage('validation.ragMessage.temperature.min') })
  temperature?: number;

  @IsOptional()
  @Transform(({ value, obj }) => value ?? obj.max_tokens)
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.ragMessage.maxTokens.number') })
  @Min(1, { message: i18nValidationMessage('validation.ragMessage.maxTokens.min') })
  maxTokens?: number;

  @IsOptional()
  @Transform(({ value, obj }) => value ?? obj.top_p)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 }, { message: i18nValidationMessage('validation.ragMessage.nucleusSampling.number') })
  @Min(0.1, { message: i18nValidationMessage('validation.ragMessage.nucleusSampling.min') })
  @Max(1, { message: i18nValidationMessage('validation.ragMessage.nucleusSampling.max') })
  topP?: number;

  @IsOptional()
  answer?: string;

  @IsOptional()
  model?: string;
}
