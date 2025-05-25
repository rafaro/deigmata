import { IsOptional } from 'class-validator';
import { PaginationOptions } from '../../utils/paginate';

export class UserFilterDto extends PaginationOptions {
  // @Column({
  //   length: 50,
  // })
  @IsOptional()
  name: string;
 

}