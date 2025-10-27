import { isEmpty, isNil } from "lodash";

export function alertErrors(errors: string[]): boolean {
  if (isEmpty(errors)) {
    return false;
  }
  alert(errors[0]);
  return true;
}

export function sizeToMB(size: number): string {
  const mbSize: number = size / (1024 * 1024);
  return `${mbSize.toFixed(2)} MB`;
}

export function timeFormat(totalSeconds: number | null): string {
  if (isNil(totalSeconds)) {
    return "";
  }

  const hours: number = Math.floor(totalSeconds / 3600);
  const minutes: number = Math.floor((totalSeconds % 3600) / 60);
  const seconds: number = totalSeconds % 60;

  if (hours === 0) {
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}