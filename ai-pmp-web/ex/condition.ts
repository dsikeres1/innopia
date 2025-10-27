import { isNil } from "lodash";

export function choice<T, R>(
  value: T | null | undefined,
  trueValue: R,
  falseValue: R,
): R | null | undefined {
  if (isNil(value)) {
    return value;
  }
  return value ? trueValue : falseValue;
}