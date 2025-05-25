import { MinLength, MaxLength } from 'class-validator';

export class AuthCredentialsDto {
  @MinLength(4, { message: 'EMAIL: precisa ser maior que 4 caracteres' })
  @MaxLength(100, { message: 'EMAIL: precisa ser menor que 100 caracteres' })
  email: string;

  @MinLength(4)
  @MaxLength(100)
  //@Matches()
  password: string;
}
