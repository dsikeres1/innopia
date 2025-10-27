import { parseIntSafe } from "../ex/numberEx";

class Config {
  apiBaseUrl: string = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  apiDelay: number = parseIntSafe(process.env.NEXT_PUBLIC_API_DELAY ?? "") ?? 0;
  awsBaseUrl: string = process.env.NEXT_PUBLIC_S3_BASE_URL ?? "";
  fileUploadMaxSize = 1000 * 1024 * 1024;
}

export const config = new Config();