import { DurationFormatter } from "@sapphire/duration";

const durationFormatter = new DurationFormatter();

export function dus1(durationInSeconds: number): string {
  return durationFormatter.format(durationInSeconds * 1000);
}

export function dus2(durationInSeconds: number): string {
  return dus1(durationInSeconds)
    .replaceAll("days", "일")
    .replaceAll("day", "일")
    .replaceAll("hours", "시간")
    .replaceAll("hour", "시간")
    .replaceAll("minutes", "분")
    .replaceAll("minute", "분")
    .replaceAll("seconds", "초")
    .replaceAll("second", "초");
}