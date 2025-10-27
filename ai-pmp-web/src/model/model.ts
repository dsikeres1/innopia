import { makeAutoObservable, runInAction } from "mobx";
import { isNil } from "lodash";
import Router from "next/router";
import { Urls } from "../url/url.g";
import { api } from "../api/api";
import { AccessTokenRes, UserInfo } from "../api/schema.g";

class FrontModel {
  accessToken: string | null = null;
  pk: number | null = null;
  initialized = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.accessToken = sessionStorage.getItem("ai-pmp.front.AccessToken") ?? null;
      const storedPk = sessionStorage.getItem("ai-pmp.front.pk");
      if (storedPk) {
        this.pk = Number(storedPk);
      }
    }
    makeAutoObservable(this);
  }

  get currentUser(): UserInfo | null {
    if (!this.pk) return null;
    return { pk: this.pk };
  }

  async updateAccessToken() {
    this.initialized = false;

    try {

      if (this.accessToken) {
        const res = await api.accessTokenGet({});

        if (isNil(res)) {
          this.dataInitialize();
          return;
        }

        this.setAccount(res);
        runInAction(() => {
          this.initialized = true;
        });
        return;
      }

      const res = await api.accessTokenGet({});

      if (isNil(res)) {
        this.dataInitialize();
        return;
      }

      this.setAccount(res);
    } finally {
      runInAction(() => {
        this.initialized = true;
      });
    }
  }

  async switchUser(pk: string) {
    try {
      const res = await api.signIn({ pk });

      if (res && res.accessToken) {
        this.setAccessToken(String(res.accessToken));

        const accountRes = await api.accessTokenGet({});
        if (accountRes) {
          this.setAccount(accountRes);
        }
      }
    } catch (error: any) {
      console.error('User switch failed:', error);
      alert(`사용자 전환 실패: ${error?.message || '알 수 없는 오류'}`);
    }
  }

  setAccessToken(accessToken: string) {
    this.accessToken = accessToken;
    sessionStorage.setItem("ai-pmp.front.AccessToken", accessToken);
  }

  async signOut() {
    const res = await api.signOut({});

    if (isNil(res)) {
      return;
    }

    this.dataInitialize();

    const _ignore = Router.replace(Urls.sign.signIn.pathname);
  }

  dataInitialize() {
    this.accessToken = null;
    this.pk = null;
    this.initialized = false;
    sessionStorage.removeItem("ai-pmp.front.AccessToken");
    sessionStorage.removeItem("ai-pmp.front.pk");
  }

  private setAccount(data: AccessTokenRes) {
    runInAction(() => {
      if (data.accessToken) {
        this.accessToken = data.accessToken;
        sessionStorage.setItem("ai-pmp.front.AccessToken", data.accessToken);
      }
      this.pk = data.pk;
      if (this.pk) {
        sessionStorage.setItem("ai-pmp.front.pk", String(this.pk));
      }
    });
  }
}

export const frontModel = new FrontModel();