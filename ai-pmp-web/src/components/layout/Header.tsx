'use client';

import Image from 'next/image';
import {useRouter} from 'next/router';
import {LogOut} from 'lucide-react';
import {observer} from 'mobx-react-lite';
import {frontModel} from '@/model/model';
import {UserSelector} from '@/components/common/UserSelector';

export const Header = observer(() => {
  const router = useRouter();

  const handleLogout = () => {
    void frontModel.signOut();
  };

  const handleLogoClick = () => {
    router.push('/');
  };

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-black/90 border-b border-gray-700 backdrop-blur-md h-16">
      <div className="flex items-center gap-3 cursor-pointer" onClick={handleLogoClick}>
        <Image src="/logo.png" alt="logo" width={90} height={28}/>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-300">
        {frontModel.currentUser && (
          <UserSelector currentUser={frontModel.currentUser}/>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 px-3 py-1 rounded-full border border-white/20 text-gray-300 hover:text-white hover:border-white transition text-xs"
        >
          <LogOut size={14}/>
          로그아웃
        </button>
      </div>
    </header>
  );
});