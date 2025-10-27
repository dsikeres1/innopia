'use client';

import { useRouter } from 'next/router';
import clsx from 'clsx';

const tabs = ['ott', 'scene', 'pattern'];

export function TabBar() {
  const router = useRouter();
  const pathname = router.pathname;

  return (
    <div className="sticky top-0 z-30 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
      <nav className="relative flex justify-center px-4 py-3">

        <div className="absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-black via-black/70 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-black via-black/70 to-transparent pointer-events-none" />

        <div className="flex gap-4 px-6 py-2 rounded-full bg-zinc-900/70 shadow-md ring-1 ring-zinc-700 backdrop-blur-sm">
          {tabs.map((tab) => {
            const selected = pathname.startsWith(`/${tab}`);
            return (
              <button
                key={tab}
                onClick={() => router.push(`/${tab}`)}
                className={clsx(
                  'uppercase text-sm sm:text-base px-4 py-1 rounded-full font-medium transition-all',
                  selected
                    ? 'bg-white text-black shadow'
                    : 'text-gray-300 hover:text-white hover:bg-zinc-800/50'
                )}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}