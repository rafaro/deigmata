import { IsNotEmpty } from 'class-validator';
import { Match } from '../../utils/decorator/match.decorator';
import { UserUpdatePwdDto } from './user-update-pwd-dto';
import { i18nValidationMessage } from 'nestjs-i18n';
export class UserChangePwdDto extends UserUpdatePwdDto {
  @IsNotEmpty({ message: i18nValidationMessage('validation.user.password.newRequired') })
  newpassword: string;

  @IsNotEmpty({ message: i18nValidationMessage('validation.user.password.newConfirmRequired') })
  @Match('newpassword', { message: i18nValidationMessage('validation.user.password.newMismatch') })
  newconfirmpassword: string;
}
