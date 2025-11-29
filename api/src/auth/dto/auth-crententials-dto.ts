import { MaxLength, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class AuthCredentialsDto {
  @MinLength(4, { message: i18nValidationMessage('validation.auth.email.minLength') })
  @MaxLength(100, { message: i18nValidationMessage('validation.auth.email.maxLength') })
  email: string;

  @MinLength(4, { message: i18nValidationMessage('validation.auth.password.minLength') })
  @MaxLength(100, { message: i18nValidationMessage('validation.auth.password.maxLength') })
  // @Matches()
  password: string;
}
