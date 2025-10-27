'use client';

import {PropsWithChildren} from 'react';
import {Header} from './Header';
import {TabBar} from './TabBar';
import {Footer} from './Footer';

export function MainLayout({children}: PropsWithChildren) {
  return (
    <div className="text-white">

      <div className="fixed inset-0 z-0 w-screen h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-80"
          style={{backgroundImage: "url('/bg-cinema.png')"}}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60"/>
      </div>

      <div className="z-10 h-screen overflow-y-scroll scrollbar-hide bg-transparent backdrop-blur-sm">
        <Header />
        <TabBar/>

        {children}

        <Footer/>
      </div>
    </div>
  );
}