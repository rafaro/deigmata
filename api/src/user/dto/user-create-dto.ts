import { IsNotEmpty } from 'class-validator';
import { Match } from '../../utils/decorator/match.decorator';
import { UserUpdateDto } from './user-update-dto';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UserCreateDto extends UserUpdateDto {
  // @Column({
  //   length: 100,
  //   select: false
  // })
  @IsNotEmpty({ message: i18nValidationMessage('validation.user.password.required') })
  password: string; //varchar(128) NOT NULL,

  @IsNotEmpty({ message: i18nValidationMessage('validation.user.password.confirmRequired') })
  @Match('password', { message: i18nValidationMessage('validation.user.password.mismatch') })
  confirmpassword: string; //varchar(128) NOT NULL,


}
