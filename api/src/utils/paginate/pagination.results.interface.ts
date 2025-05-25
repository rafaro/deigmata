export interface PaginationResultInterface<PaginationEntity> {
  results: PaginationEntity[];
  total: number;
  totalperpage: number;
  page: number;
}
