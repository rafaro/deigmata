import { IsIn, IsNotEmpty } from 'class-validator';
import { AuthRoles } from '../../auth/auth-roles.enum';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UserEmailInfoDto {
  @IsNotEmpty({ message: i18nValidationMessage('validation.user.subject.required') })
  subject: string;
  @IsNotEmpty({ message: i18nValidationMessage('validation.user.body.required') })
  body: string;

  @IsIn([AuthRoles.USER, AuthRoles.JUNIOR, AuthRoles.PLENO, AuthRoles.SENIOR, AuthRoles.MANAGER, AuthRoles.SUPER], { message: i18nValidationMessage('validation.user.recipients.invalid') })
  to: string;

}
