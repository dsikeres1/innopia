'use client';

import { PropsWithChildren, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/router';
import { frontModel } from '@/model/model';
import { Header } from '@/components/layout/Header';

function Replace({ url }: { url: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(url);
  }, [url, router]);

  return null;
}

export const AppSelector = observer((props: PropsWithChildren) => {
  const router = useRouter();
  const pathname = router.pathname;

  useEffect(() => {

    if (pathname === '/sign/signIn') {
      return;
    }

    if (!frontModel.initialized) {
      const init = async () => {
        await frontModel.updateAccessToken();
      };
      void init();
    }
  }, [pathname]);

  if (pathname === '/sign/signIn') {
    return <>{props.children}</>;
  }

  if (!frontModel.initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (frontModel.accessToken === null) {
    return <Replace url={`/sign/signIn?returnTo=${pathname}`} />;
  }

  return (
    <>
      <Header />
      {props.children}
    </>
  );
});