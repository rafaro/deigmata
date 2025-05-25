import { IsOptional, MaxLength } from 'class-validator';

export class ProjectCreateDto {

  @IsOptional()
  @MaxLength(100, { message: 'NOME: precisa ser menor que 100 caracteres' })
  name: string;

  @IsOptional()
  @MaxLength(50, { message: 'LAYOUT: precisa ser menor que 50 caracteres' })
  layout: string;
}