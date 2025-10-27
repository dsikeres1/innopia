import Router, { NextRouter, useRouter } from "next/router";
import { compact, isArray, isNil, isString, toString } from "lodash";
import { parseIntSafe } from "./numberEx";
import { ParsedUrlQuery } from "querystring";
import moment, { Moment } from "moment";
import { ComponentType, ReactElement, useEffect, useState } from "react";
import ErrorPage from "next/error";

type Codec<T> = {
  encode: (value: T) => string | string[];
  decode: (param: string, params: string[]) => T | undefined;
};
type CodecDefinition<T> = {
  [PROPERTY in keyof Required<T>]: Codec<T[PROPERTY]>;
};

type Definition<T> = Codec<T> & { name: string };

export type QueryDefinition<T> = {
  [PROPERTY in keyof Required<T>]: Definition<T[PROPERTY]>;
};

export function defineQuery<T>(definition: CodecDefinition<T>): QueryDefinition<T> {
  const result: Partial<QueryDefinition<T>> = {};
  for (const key in definition) {
    result[key] = { ...definition[key], name: key };
  }
  return result as QueryDefinition<T>;
}

export type Parsed<T> = Partial<T extends QueryDefinition<infer U> ? U : never>;

export const cString: Codec<string> = {
  decode: (param) => param,
  encode: (value) => value,
};

export const cType: Codec<string> = {
  decode: (param) => param,
  encode: (value) => value,
};

export const cInt: Codec<number> = {
  decode: parseIntSafe,
  encode: toString,
};

export const cNat: Codec<number> = {
  decode: (param, params) => {
    const decode = cInt.decode(param, params);
    if (isNil(decode) || decode < 1) {
      return;
    }
    return decode;
  },
  encode: cInt.encode,
};

export const cBool: Codec<boolean> = {
  decode: (param) => {
    switch (param) {
      case "true":
        return true;
      case "false":
        return false;
    }
  },
  encode: toString,
};

export type Pk = number | "new";
export const newPk: Pk = "new";

export const cPk: Codec<Pk> = {
  decode: (param, params) => {
    if (param === "new") {
      return "new";
    }

    return cInt.decode(param, params);
  },
  encode: (value) => {
    if (value === "new") {
      return value;
    }
    return cInt.encode(value);
  },
};

export function cPkIsNew(pk: Pk): pk is "new" {
  switch (pk) {
    case "new":
      return true;
    default:
      return false;
  }
}

export function cPkNullify(pk: Pk): number | null {
  switch (pk) {
    case "new":
      return null;
    default:
      return pk;
  }
}

export const cMoment: Codec<Moment> = {
  encode: (value) => value.toISOString(true),
  decode: (param) => {
    const m = moment(param, true);
    if (m.isValid()) {
      return m;
    }
  },
};

export function cStringUnion<T>(decode: (param: string) => T | undefined): Codec<T> {
  return { encode: toString, decode };
}

export function cArray<T>(codec: Codec<T>): Codec<T[]> {
  return {
    encode: (values) =>
      values.flatMap((value) => {
        const raw = codec.encode(value);
        return isArray(raw) ? raw : [raw];
      }),
    decode: (param: string, params: string[]) => {
      return compact(params.map((x) => codec.decode(x, [x])));
    },
  };
}

export function narrowQueryString(param: string | string[] | undefined): string | undefined {
  if (isString(param)) {
    return param;
  }
  if (isArray(param)) {
    return narrowQueryString(param[0]);
  }
}

export function narrowQueryStrings(param: string | string[] | undefined): string[] {
  if (isString(param)) {
    return [param];
  }

  if (!isArray(param)) {
    return [];
  }

  return compact(param.map(narrowQueryString));
}

export function parseQuery<T>(def: QueryDefinition<T>, router?: NextRouter): Partial<T> {
  const parsed: Partial<T> = {};
  for (const key in def) {
    const element = (router ?? Router).query[key];
    const param = narrowQueryString(element);
    const params = narrowQueryStrings(element);
    if (isString(param)) {
      parsed[key] = def[key].decode(param, params);
    }
  }
  return parsed;
}

export type QueryValues<T> = {
  [PROPERTY in keyof Required<T>]: T[PROPERTY] | null;
};

export function mergedUrl<T extends {}>(
  def: QueryDefinition<T>,
  values: Partial<QueryValues<T>>,
): { pathname: string; query: ParsedUrlQuery } {

  const currentQuery = { ...Router.query };
  const query: ParsedUrlQuery = {};
  for (const key in values) {
    const value = values[key];
    if (value === null) {
      delete currentQuery[key];
    } else {

      query[key] = def[key].encode(value!);
    }
  }
  return { pathname: Router.pathname, query: { ...currentQuery, ...query } };
}

export function createPusher<T>(
  router: NextRouter,
  def: QueryDefinition<T>,
): (values: Partial<QueryValues<T>>) => void {
  return (values) => {
    const ignore = router.push(mergedUrl(def, values));
  };
}

export function pushMerged<T>(def: QueryDefinition<T>, values: Partial<QueryValues<T>>) {
  const ignore = Router.push(mergedUrl(def, values));
}

export function encodeQuery<T>(
  queryDef: QueryDefinition<T>,
  values: Partial<QueryValues<T>>,
): ParsedUrlQuery {
  const query: ParsedUrlQuery = {};
  for (const key in values) {
    const value = values[key];
    if (isNil(value)) {
      continue;
    }
    const def = queryDef[key];

    if (isNil(def)) {
      console.error(`잘못된 데이터, 쿼리 정의에 존재하지 않는다.: ${key}=${value}`);
      continue;
    }

    query[key] = def.encode(value!);
  }
  return query;
}

export function encode<T>(def: QueryDefinition<T>, values: Partial<QueryValues<T>>) {
  const query: ParsedUrlQuery = {};
  for (const key in values) {

    query[key] = def[key].encode(values[key]!);
  }
  return query;
}

export function pkContent<T>(
  fetcher: (req: { pk: number }) => Promise<T | null>,
  Component: ComponentType<{ init: T | null }>,
): () => JSX.Element {
  return function PkContentView() {
    const router = useRouter();
    const [child, setChild] = useState<ReactElement>(() => <></>);

    useEffect(() => {
      if (!router.isReady) {
        return;
      }

      const pkString = narrowQueryString(router.query.pk);
      if (pkString === "new") {
        setChild(<Component init={null} />);
        return;
      }

      const pk = parseIntSafe(pkString ?? "");
      if (!pk) {
        setChild(<ErrorPage statusCode={404} />);
        return;
      }

      fetcher({ pk }).then((value) => {
        if (value === null) {
          setChild(<ErrorPage statusCode={404} />);
          return;
        }
        setChild(<Component init={value} />);
      });
    }, [router]);

    return child;
  };
}

export function pkAccountFashionModelContent<T>(
  fetcher: (req: { fashionModelPk: number; pk?: number }) => Promise<T | null>,
  Component: ComponentType<{ init: T | null }>,
): () => JSX.Element {
  return function PkAccountFashionModelContentView() {
    const router = useRouter();
    const [child, setChild] = useState<ReactElement>(() => <></>);

    useEffect(() => {
      if (!router.isReady) {
        return;
      }

      const fashionModelPkString = narrowQueryString(router.query.fashionModelPk);
      const fashionModelPk = parseIntSafe(fashionModelPkString ?? "");
      if (!fashionModelPk) {
        setChild(<ErrorPage statusCode={404} />);
        return;
      }

      const pkString = narrowQueryString(router.query.pk);
      const pk = parseIntSafe(pkString ?? "");
      if (pkString !== "new" && !pk) {
        setChild(<ErrorPage statusCode={404} />);
        return;
      }

      fetcher({ fashionModelPk, pk: pk ?? undefined }).then((value) => {
        if (value === null) {
          setChild(<ErrorPage statusCode={404} />);
          return;
        }
        setChild(<Component init={value} />);
      });
    }, [router]);

    return child;
  };
}