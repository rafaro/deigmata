import { IsNotEmpty, IsOptional, MaxLength, ValidateIf } from 'class-validator';
import { Match } from '../../utils/decorator/match.decorator';
import { UserUpdateDto } from './user-update-dto';

export class UserCreateDto extends UserUpdateDto {
  // @Column({
  //   length: 100,
  //   select: false
  // })
  @IsNotEmpty({ message: 'É obrigatório' })
  password: string; //varchar(128) NOT NULL,

  @IsNotEmpty({ message: 'É obrigatório' })
  @Match('password', { message: 'A senha e a confirmação não são iguais' })
  confirmpassword: string; //varchar(128) NOT NULL,


}