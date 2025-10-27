import { isNil } from "lodash";

export type NotNil<T> = T extends null | undefined | void ? never : T;

export function isNotNil<T>(value: T): value is NotNil<T> {
  return !isNil(value);
}

export function identity<T>(x: T): T {
  return x;
}

export function takeWhileInclusive<T>(array: T[], predicate: (value: T) => boolean): T[] {

  const ret: T[] = [];
  for (const value of array) {
    ret.push(value);
    if (!predicate(value)) {
      break;
    }
  }
  return ret;
}