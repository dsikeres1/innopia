export type PageRow<T> = {
  no: number;
  item: T;
};

export type Pagination<T> = {
  page: number;
  pages: Array<number>;
  prevPage: number;
  nextPage: number;
  hasPrev: boolean;
  hasNext: boolean;
  total: number;
  rows: Array<PageRow<T>>;
};