import { encodeQuery, Parsed, QueryDefinition } from "../../ex/query";
import { UrlObject } from "url";

export class PageUrl {
  readonly pathname: string;

  constructor(pathname: string) {
    this.pathname = pathname;
  }

  url(): UrlObject {
    return { pathname: this.pathname };
  }
}

export class PageQueryUrl<T extends QueryDefinition<{}>> {
  readonly pathname: string;
  readonly query: T;

  constructor(pathname: string, query: T) {
    this.pathname = pathname;
    this.query = query;
  }

  url(queryParams: Parsed<T>): UrlObject {
    return {
      pathname: this.pathname,
      query: encodeQuery(this.query, queryParams),
    };
  }
}