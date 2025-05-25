import { IsNotEmpty } from 'class-validator';
import { Match } from '../../utils/decorator/match.decorator';
export class UserUpdatePwdDto {
  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  @Match('password', { message: 'A senha e a confirmação devem ser iguais' })
  confirmpassword: string;
}