import { IsNotEmpty } from 'class-validator';
import { Match } from '../../utils/decorator/match.decorator';
import { UserUpdatePwdDto } from './user-update-pwd-dto';
export class UserChangePwdDto extends UserUpdatePwdDto {
  @IsNotEmpty()
  newpassword: string;

  @IsNotEmpty()
  @Match('newpassword', { message: 'A nova senha e sua confirmação devem ser iguais' })
  newconfirmpassword: string;
}