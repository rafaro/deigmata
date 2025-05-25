import { IsNotEmpty, IsIn } from 'class-validator';
import { AuthRoles } from '../../auth/auth-roles.enum';

export class UserEmailInfoDto {
  @IsNotEmpty({ message: 'ASSUNTO: É obrigatório' })
  subject: string;
  @IsNotEmpty({ message: 'CORPO: É obrigatório' })
  body: string;

  @IsIn([AuthRoles.USER, AuthRoles.JUNIOR, AuthRoles.PLENO, AuthRoles.SENIOR, AuthRoles.MANAGER, AuthRoles.SUPER], { message: 'Os destinatários devem estar registrados' })
  to: string;

}