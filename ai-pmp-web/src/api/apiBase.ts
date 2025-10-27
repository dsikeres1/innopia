import { sleep } from "sleepjs";
import { Res, ResStatus } from "./schema.g";
import { nullify } from "../../ex/ex";

export abstract class ApiBase {
  protected readonly baseUrl: string;
  private readonly handler: ApiHandler;
  private readonly delay;

  constructor(baseUrl: string, errorHandler: ApiHandler, delay: number = 0) {
    this.baseUrl = baseUrl;
    this.handler = errorHandler;
    this.delay = delay;
  }

  protected c<T, U>(url: string): (req: T) => Promise<U | null> {
    return async (req) => this.fetch(url, req);
  }

  async fetch<U>(url: string, req: any): Promise<U | null> {
    return this.handler.with(async () => {
      try {
        if (this.delay) {
          await sleep(this.delay);
        }

        const headers: Record<string, string> = {};
        this.handler.beforeRequest(headers);
        let body = req;
        if (!(body instanceof FormData)) {
          headers["Content-Type"] = "application/json";
          body = JSON.stringify(req);
        }
        const response = await fetch(this.baseUrl + url, {
          method: "POST",
          mode: "cors",
          credentials: "include",
          headers,
          body,
        });

        const res: Res<U> = await response.json();
        return this.handleResponse(res);
      } catch (e) {
        this.handler.catch(e);
        return null;
      }
    });
  }

  private handleResponse<U>(res: Res<U>) {
    if (res.status !== "OK") {
      this.handler.handleStatus(res.status);
      return null;
    }
    if (res.validationErrors.length) {
      this.handler.handleValidationErrors(res.validationErrors);
      return null;
    }
    if (res.errors.length) {
      this.handler.handlerErrors(res.errors);
      return null;
    }
    return res.data;
  }

  upload<U>(
    url: string,
    formData: FormData,
    onProgress: (n: number) => void,
  ): { promise: Promise<U | null>; abort: () => void } {
    let aborted = false;
    const headers: Record<string, string> = {};
    this.handler.beforeRequest(headers);

    const req = new XMLHttpRequest();
    const promise = new Promise<Res<U>>((resolve, reject) => {
      req.open("POST", this.baseUrl + url);
      Object.entries(headers).forEach(([name, value]) => req.setRequestHeader(name, value));

      req.onreadystatechange = () => {
        if (req.readyState === XMLHttpRequest.DONE) {
          if (req.status === 200) {
            resolve(JSON.parse(req.responseText));
          } else {
            reject(req.responseText);
          }
        }
      };
      req.upload.onprogress = (ev) => {
        onProgress(ev.loaded / ev.total);
      };
      req.onerror = () => {
        reject(new Error("업로드중 오류가 발생하였습니다."));

        console.error(req.status);
      };
      req.send(formData);
    })
      .then((res: Res<U>) => this.handleResponse(res))
      .catch((e) => {
        if (!aborted) {
          this.handler.catch(
            nullify(e) ?? "업로드 오류가 발생하였습니다.\n잠시후 다시 시도 하여 주십시오.",
          );
        }
        return null;
      });
    return {
      promise,
      abort: () => {
        if (!aborted) {
          aborted = true;
          req.abort();
        }
      },
    };
  }
}

export interface ApiHandler {
  catch(e: any): void;

  handleValidationErrors(errors: { [p: string]: any }[]): void;

  handlerErrors(errors: string[]): void;

  with<T>(block: () => Promise<T>): Promise<T>;

  handleStatus(status: ResStatus): void;

  beforeRequest(headers: Record<string, string>): void;
}