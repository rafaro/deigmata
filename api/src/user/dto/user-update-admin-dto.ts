import { Type } from 'class-transformer';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, MaxLength } from 'class-validator';

export class UserUpdateAdminDto {

  @IsIn(['A', 'I'], { message: 'STATUS: É preciso selecionar um tipo de status' })
  status: string; //varchar(2) DEFAULT NULL,

  @IsNotEmpty({ message: 'EMAIL: É obrigatório' })
  email: string;

  @IsIn(['USER', 'PSI', 'SUPER'], { message: 'PAPEL: É preciso selecionar um tipo de papel' })
  role: string; //varchar(255) NOT NULL,

  @IsOptional()
  crpregion: string; //varchar(4) DEFAULT NULL,

  @IsOptional()
  crpnumber: string; //varchar(10) DEFAULT NULL,

  @IsOptional()
  slug: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty({ message: 'ESTADO: É obrigatório' })
  estadoId: number;


  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty({ message: 'CIDADE: É obrigatório' })
  cidadeId: number;
}