import { IsOptional, MaxLength } from 'class-validator';

export class AssignCreateDto {
  @MaxLength(100, { message: 'NOME: precisa ser menor que 100 caracteres' })
  name: string;

  @IsOptional()
  projectid: number;

}