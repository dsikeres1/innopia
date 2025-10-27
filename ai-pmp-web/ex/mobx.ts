import { useEffect, useState } from "react";
import {
  cPkIsNew,
  createPusher,
  Parsed,
  parseQuery,
  Pk,
  QueryDefinition,
  QueryValues,
} from "./query";
import Router, { useRouter } from "next/router";
import { isNil } from "lodash";

export function useModel<T>(ModelClass: new () => T): T {
  return useState(() => new ModelClass())[0];
}

export type InitModel = {
  init: () => void;
};

export function useInitModel<T extends InitModel>(ModelClass: new () => T): T {
  const model = useModel(ModelClass);
  useEffect(() => {
    model.init();
  }, [model]);
  return model;
}

export type QueryInitModel<T extends QueryDefinition<{}>> = {
  init: (parsed: Parsed<T>) => void;
};

export function useQueryInitModel<T extends QueryInitModel<U>, U extends QueryDefinition<{}>>(
  ModelClass: new () => T,
  queryDefinition: U,
): T {
  const model = useModel(ModelClass);
  const router = useRouter();

  useEffect(() => {
    const parsed = parseQuery(queryDefinition, router);
    model.init(parsed);
  }, [queryDefinition, model, router]);

  return model;
}

export function usePusher<T extends {}>(
  query: QueryDefinition<T>,
): (values: Partial<QueryValues<T>>) => void {
  const router = useRouter();
  return createPusher(router, query);
}

export type PkQueryInitModel<W> = {
  init: (res: W | null) => void;
};

export function usePkInitModel<
  W,
  T extends PkQueryInitModel<W>,
  U extends QueryDefinition<{ pk: Pk }>,
  V extends (req: { pk: number }) => Promise<W | null>,
>(ModelClass: new () => T, queryDefinition: U, fetcher: V) {
  const model = useModel(ModelClass);
  const router = useRouter();

  useEffect(() => {
    const parsed = parseQuery(queryDefinition, router);
    if (isNil(parsed.pk)) {
      alert("요청하신 자료를 찾을 수 없습니다.");
      Router.back();
      return;
    }

    if (cPkIsNew(parsed.pk)) {
      model.init(null);
      return;
    }

    fetcher({ pk: parsed.pk }).then((value) => {
      if (isNil(value)) {
        Router.back();
        return;
      }
      model.init(value);
    });
  }, [queryDefinition, model, router, fetcher]);

  return model;
}