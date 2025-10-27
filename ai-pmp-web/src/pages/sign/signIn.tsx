import { observer } from "mobx-react-lite";
import { action, makeAutoObservable, runInAction } from "mobx";
import { isNil } from "lodash";
import { frontModel } from "../../model/model";
import Router from "next/router";
import { cString, defineQuery, parseQuery } from "../../../ex/query";
import { useModel } from "../../../ex/mobx";
import { preventDefaulted } from "../../../ex/ex";
import { Urls } from "../../url/url.g";
import { isNotNil } from "../../../ex/lodashEx";
import { api } from "../../api/api";
import { useEffect } from "react";
import { userName } from "../../../ex/formatter";
import { UserInfo } from "../../api/schema.g";

const Query = defineQuery({ returnTo: cString });

const SignInPage = observer(() => {
  const model = useModel(SignInModel);

  useEffect(() => {
    model.fetchUserList();
  }, [model]);

  return (
    <div style={{ position: "relative", minHeight: "100vh", width: "100%", color: "white" }}>

      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "url('/pub-hyper/images/bg-cinema.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.8
        }} />
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.3), rgba(0,0,0,0.6))"
        }} />
      </div>

      <div style={{
        position: "relative",
        zIndex: 10,
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem"
      }}>
        <div style={{
          width: "100%",
          maxWidth: "28rem",
          borderRadius: "1rem",
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(12px)",
          padding: "2rem",
          boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.2)"
        }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
            <img src="/pub-hyper/images/logo.png" alt="logo" style={{ width: "60px", height: "60px" }} />
          </div>
          <h1 style={{
            marginBottom: "1.5rem",
            textAlign: "center",
            fontSize: "1.5rem",
            fontWeight: "bold",
            textShadow: "2px 2px 4px rgba(0,0,0,0.3)"
          }}>
            로그인
          </h1>
          <form onSubmit={preventDefaulted(() => model.signIn())}>
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#e5e5e5", marginBottom: "0.25rem" }}>
                사용자 선택
              </label>
              <select
                value={model.selectedUser.value ?? ""}
                onChange={action((e) => (model.selectedUser.value = e.target.value))}
                style={{
                  width: "100%",
                  borderRadius: "0.5rem",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  padding: "0.75rem",
                  fontSize: "0.875rem",
                  color: "white",
                  outline: "none",
                  cursor: "pointer"
                }}
                disabled={model.isLoading}
              >
                <option value="" style={{ background: "#374151", color: "white" }}>사용자를 선택하세요</option>
                {model.userList.map((user: UserInfo) => (
                  <option key={user.pk} value={String(user.pk)} style={{ background: "#374151", color: "white" }}>
                    {userName(user.pk)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              style={{
                width: "100%",
                borderRadius: "0.5rem",
                background: "#6366f1",
                padding: "0.75rem",
                color: "white",
                fontWeight: "600",
                opacity: model.isLoading || !model.selectedUser.value ? 0.5 : 1,
                cursor: model.isLoading || !model.selectedUser.value ? "not-allowed" : "pointer",
                border: "none",
                transition: "background 0.3s"
              }}
              onMouseEnter={(e) => {
                if (!model.isLoading && model.selectedUser.value) {
                  e.currentTarget.style.background = "#5558e0";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#6366f1";
              }}
              disabled={model.isLoading || !model.selectedUser.value}
            >
              {model.isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
});

export default SignInPage;

class SignInModel {
  selectedUser = { value: "" };
  userList: UserInfo[] = [];
  isLoading = false;

  constructor() {
    makeAutoObservable(this);
  }

  async fetchUserList() {
    try {
      const res = await api.userList({});
      if (res && res.users) {
        this.userList = res.users;
      }
    } catch (error) {
      console.error('Failed to fetch user list:', error);
    }
  }

  async signIn() {
    if (!this.selectedUser.value) {
      alert('사용자를 선택해주세요.');
      return;
    }

    this.isLoading = true;
    try {
      const res = await api.signIn({ pk: this.selectedUser.value });
      if (res && res.accessToken) {
        frontModel.setAccessToken(res.accessToken);

        runInAction(() => {
          frontModel.pk = Number(this.selectedUser.value);

          frontModel.initialized = true; 
        });

        sessionStorage.setItem("ai-pmp.front.pk", this.selectedUser.value);

        const returnTo = parseQuery(Query).returnTo;
        const ignore = Router.replace(isNotNil(returnTo) ? returnTo : Urls.ott.pathname);
      } else {
        alert('로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('로그인에 실패했습니다.');
    } finally {
      this.isLoading = false;
    }
  }
}