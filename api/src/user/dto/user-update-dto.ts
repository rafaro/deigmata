import { MaxLength, IsNotEmpty, IsEmail } from 'class-validator';

export class UserUpdateDto {

  @MaxLength(50, { message: 'NOME: precisa ser menor que 50 caracteres' })
  name: string;


  // @Column({
  //   length: 100,
  // })
  @IsNotEmpty({ message: 'EMAIL: É obrigatório' })
  @MaxLength(100, { message: 'EMAIL: precisa ser menor que 100 caracteres' })
  @IsEmail({}, { message: 'EMAIL: É preciso fornecer um email válido' })
  email: string; //varchar(255) NOT NULL,
}