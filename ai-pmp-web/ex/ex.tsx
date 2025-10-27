import { BaseSyntheticEvent } from "react";
import { isArray, isEmpty, isNull, isUndefined } from "lodash";
import { NotNil } from "./lodashEx";

export function preventDefault(e: BaseSyntheticEvent) {
  e.preventDefault();
}

export function preventDefaulted<T extends BaseSyntheticEvent>(
  block: (event: T) => any,
): (event: T) => void {
  return (e) => {
    e.preventDefault();
    block(e);
  };
}

export function isBlank(value: any): value is null | undefined {
  if (value === "") {
    return true;
  }

  if (isNull(value)) {
    return true;
  }

  if (isUndefined(value)) {
    return true;
  }

  if (isArray(value) && isEmpty(value)) {
    return true;
  }

  return false;
}

export function isNotBlank(value: any): value is NotNil<any> {
  return !isBlank(value);
}

export function nullify<T>(s: T | null | undefined): T | null {
  if (isBlank(s)) {
    return null;
  }
  return s;
}

export function removeSuffix(str: string, suffix: string) {
  if (str.endsWith(suffix)) {
    return str.substring(0, str.length - suffix.length);
  }
  return str;
}