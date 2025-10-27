import { Api } from "./api.g";
import { ApiHandler } from "./apiBase";
import { isNil, isString, map } from "lodash";
import { config } from "../config";
import { ResStatus } from "./schema.g";
import Router from "next/router";
import { blockModel } from "../../ex/block";
import { frontModel } from "../model/model";
import { Urls } from "../url/url.g";

interface PydanticValidationError {
  loc: string[];
  msg: string;
}

class Handler implements ApiHandler {
  handleStatus(status: ResStatus): void {
    switch (status) {
      case "OK": {
        return;
      }
      case "NO_PERMISSION": {
        alert("해당 기능의 권한이 없습니다.");
        return;
      }
      case "INVALID_ACCESS_TOKEN": {

        if (frontModel.accessToken === null) {
          const _ignore = Router.replace(Urls.sign.signIn.url({ returnTo: Router.asPath }));
          return;
        }
        if (confirm("사용자 정보가 만료되었습니다.\n재시작하시겠습니까?")) {
          window.location.replace(Urls.sign.signIn.pathname);
        }
        return;
      }
      case "LOGIN_REQUIRED": {
        alert("로그인 페이지로 이동합니다.");
        const ignore = Router.replace(Urls.sign.signIn.url({}));
        return;
      }
      case "NOT_FOUND":
      default: {
        alert("존재하지 않는 페이지 또는 데이터입니다.");
        return;
      }
    }
  }

  catch(e: any): void {
    console.error(e);

    if (e.message) {
      alert(e);
      return;
    }

    if (isString(e)) {
      alert(e);
      return;
    }

    alert(JSON.stringify(e));
  }

  handleValidationErrors(errors: PydanticValidationError[]): void {
    console.error(...errors);

    try {
      const messages = map(errors, (err) => `${err.loc} : ${err.msg}`).join("\n");
      if (messages) {
        alert(messages);
      } else {
        alert(JSON.stringify(errors, null, 2));
      }
    } catch (e) {

      console.error(e);
      alert(`${e}`);
    }
  }

  handlerErrors(errors: string[]): void {
    alert(errors.join("\n"));
  }

  with<T>(block: () => Promise<T>): Promise<T> {
    return blockModel.with(block);
  }

  beforeRequest(headers: Record<string, string>) {
    const token = sessionStorage.getItem("ai-pmp.front.AccessToken");
    if (!isNil(token)) {
      headers["X-User-Access-Token"] = token;
    }
  }
}

export const handler = new Handler();
export const api = new Api(config.apiBaseUrl, handler, config.apiDelay);