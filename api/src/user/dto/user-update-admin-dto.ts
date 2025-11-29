import { Type } from 'class-transformer';
import { IsIn, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UserUpdateAdminDto {

  @IsIn(['A', 'I'], { message: i18nValidationMessage('validation.user.status.invalid') })
  status: string; //varchar(2) DEFAULT NULL,

  @IsNotEmpty({ message: i18nValidationMessage('validation.user.email.required') })
  email: string;

  @IsIn(['USER', 'PSI', 'SUPER'], { message: i18nValidationMessage('validation.user.role.invalid') })
  role: string; //varchar(255) NOT NULL,

  @IsOptional()
  crpregion: string; //varchar(4) DEFAULT NULL,

  @IsOptional()
  crpnumber: string; //varchar(10) DEFAULT NULL,

  @IsOptional()
  slug: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty({ message: i18nValidationMessage('validation.user.state.required') })
  estadoId: number;


  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty({ message: i18nValidationMessage('validation.user.city.required') })
  cidadeId: number;
}
