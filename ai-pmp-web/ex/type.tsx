import { UrlObject } from "url";

export type Empty = Record<never, any>;

export type NumberWithType<T> = {
  value: number;
  type: T;
};

export type Url = UrlObject | string;

export type MonthPagingType = "NEXT_MONTH" | "PREVIOUS_MONTH" | "THIS_MONTH";