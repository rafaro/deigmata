import { IsNotEmpty } from 'class-validator';
import { Match } from '../../utils/decorator/match.decorator';
import { i18nValidationMessage } from 'nestjs-i18n';
export class UserUpdatePwdDto {
  @IsNotEmpty({ message: i18nValidationMessage('validation.user.password.required') })
  password: string;

  @IsNotEmpty({ message: i18nValidationMessage('validation.user.password.confirmRequired') })
  @Match('password', { message: i18nValidationMessage('validation.user.password.mismatch') })
  confirmpassword: string;
}
