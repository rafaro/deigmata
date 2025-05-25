//https://github.com/bashleigh/nestjs-blog/blob/master/src/paginate/pagination.ts
import { PaginationResultInterface } from './pagination.results.interface';

export class Pagination<PaginationEntity> {
  public results: PaginationEntity[];
  public page_total: number;
  public total: number;
  public page: number;
  public totalperpage: number;
  //public previous: number;

  constructor(paginationResults: PaginationResultInterface<PaginationEntity>) {
    this.results = paginationResults.results;
    this.page_total = paginationResults.results.length;
    this.total = paginationResults.total;
    this.page = paginationResults.page;
    this.totalperpage = paginationResults.totalperpage;
    //this.previous = paginationResults.previous;

  }
}