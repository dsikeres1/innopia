import Router from "next/router";

export function reloadRouter() {
  const ignore = Router.replace({
    pathname: Router.pathname,
    query: Router.query,
  });
}