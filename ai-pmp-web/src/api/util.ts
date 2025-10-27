import { Variant } from "react-bootstrap/types";

export function createToStringEnum<T extends string>(values: T[]): (str: string) => T | undefined {
  return (str: string) => {
    for (const value of values) {
      if (value === str) {
        return value;
      }
    }
  };
}

export function createEnumLabels<T>(values: T[], mapper: (value: T) => string): Array<[T, string]> {
  return values.map((value) => [value, mapper(value)]);
}

export function createEnumOptions<T>(
  values: T[],
  mapper: (value: T) => string,
): Array<{ value: T; label: string }> {
  return values.map((value) => ({ value: value, label: mapper(value) }));
}

export function createEnumLabelsOptions<T>(
  values: T[],
  mapper: (value: T) => string,
): {
  label: Array<[T, string]>;
  options: Array<{ value: T; label: string }>;
  toLabel: (value: T) => string;
} {
  return {
    label: createEnumLabels<T>(values, mapper),
    options: createEnumOptions<T>(values, mapper),
    toLabel: mapper,
  };
}

export function createEnumChoices<T>(
  values: T[],
  mapper: (value: T) => string,
): Array<[T, string]> {
  return values.map((value) => [value, mapper(value)]);
}

export function createEnumVariants<T>(
  values: T[],
  mapper: (value: T) => Variant,
): Array<[T, Variant]> {
  return values.map((value) => [value, mapper(value)]);
}