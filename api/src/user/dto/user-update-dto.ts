import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UserUpdateDto {

  @MaxLength(50, { message: i18nValidationMessage('validation.user.name.maxLength') })
  name: string;


  // @Column({
  //   length: 100,
  // })
  @IsNotEmpty({ message: i18nValidationMessage('validation.user.email.required') })
  @MaxLength(100, { message: i18nValidationMessage('validation.user.email.maxLength') })
  @IsEmail({}, { message: i18nValidationMessage('validation.user.email.format') })
  email: string; //varchar(255) NOT NULL,
}
