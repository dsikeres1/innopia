import { AppProps } from "next/app";
import { PropsWithChildren, useEffect } from "react";
import Router, { useRouter } from "next/router";
import { some } from "lodash";
import { observer } from "mobx-react-lite";
import { UrlObject } from "url";
import { frontModel } from "./model/model";
import Head from "next/head";
import Favicon from "../public/favicon.ico";
import { Header } from "@/components/layout/Header";

function DefaultLayoutView({ children }: PropsWithChildren) {
  return <div className="min-h-screen bg-black text-white">{children}</div>;
}

function LayoutView({ children }: PropsWithChildren) {
  return <div className="min-h-screen bg-black text-white">{children}</div>;
}

export function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="shortcut icon" type="image/x-icon" href={Favicon.src} />
      </Head>

      <LayoutSelector>
        <Component {...pageProps} />
      </LayoutSelector>
    </>
  );
}

function LayoutSelector(props: PropsWithChildren) {
  const router = useRouter();

  const isSpecialUrl = some(["/_"], (prefix) => router.pathname.startsWith(prefix));

  if (isSpecialUrl) {
    return <>{props.children}</>;
  }

  if (router.pathname.startsWith("/sign/")) {
    return <DefaultLayoutView>{props.children}</DefaultLayoutView>;
  }

  return <FrontApp>{props.children}</FrontApp>;
}

const FrontApp = observer((props: PropsWithChildren<Record<never, any>>) => {
  const router = useRouter();

  useEffect(() => {
    if (frontModel.initialized) {
      return;
    }

    const _ignore = frontModel.updateAccessToken();
  }, []);

  if (!frontModel.initialized) {
    return <DefaultLayoutView />;
  }

  if (frontModel.accessToken === null) {
    return (
      <Replace
        url={{
          pathname: "/sign/signIn",
          query: {
            returnTo: router.asPath,
          },
        }}
      />
    );
  }

  return (
    <>
      <Header />
      {props.children}
    </>
  );
});

export function Replace(props: { url: UrlObject | string }) {
  useEffect(() => {
    const ignore = Router.replace(props.url);
  }, [props.url]);
  return <></>;
}