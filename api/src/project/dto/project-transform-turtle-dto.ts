import { IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ProjectTransformTurtleDto {
  @IsNotEmpty({ message: i18nValidationMessage('validation.project.turtleContent.required') })
  @IsString({ message: i18nValidationMessage('validation.project.turtleContent.required') })
  turtleContent: string;
}
