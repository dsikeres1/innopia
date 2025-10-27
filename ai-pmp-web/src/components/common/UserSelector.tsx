'use client';

import {useState, useEffect} from 'react';
import {ChevronDown} from 'lucide-react';
import {observer} from 'mobx-react-lite';
import {frontModel} from '@/model/model';
import {UserInfo} from '@/api/schema.g';
import {api} from '@/api/api';

function userName(pk: number): string {
  return `#User ${String(pk).padStart(3, '0')}`;
}

interface UserSelectorProps {
  currentUser: UserInfo;
  showIcon?: boolean;
  className?: string;
}

export const UserSelector = observer(({
  currentUser,
  showIcon = true,
  className = ''
}: UserSelectorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [userList, setUserList] = useState<UserInfo[]>([]);

  useEffect(() => {
    const fetchUserList = async () => {
      try {
        const res = await api.userList({});
        if (res && res.users) {
          setUserList(res.users);
        }
      } catch (error) {
        console.error('Failed to fetch user list:', error);
      }
    };

    fetchUserList();
  }, []);

  const handleUserSwitch = async (newUserPk: string) => {
    if (String(currentUser.pk) === newUserPk) {
      return;
    }

    setIsLoading(true);
    try {
      await frontModel.switchUser(newUserPk);

      if (window.location.pathname.startsWith('/pattern')) {
        window.location.href = '/pattern';
      } else {

        window.location.reload();
      }
    } catch (error) {
      console.error('User switch failed:', error);
      alert('사용자 전환에 실패했습니다.');
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative flex items-center gap-1 ${className}`}>
      {showIcon && <span>👤</span>}
      <select
        value={String(currentUser.pk)}
        onChange={(e) => handleUserSwitch(e.target.value)}
        disabled={isLoading}
        className="appearance-none bg-gray-800/80 text-white px-3 py-1.5 pr-8 rounded-lg border border-gray-600 hover:border-gray-500 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {userList.length > 0 ? (
          userList.map((u) => (
            <option key={u.pk} value={String(u.pk)}>
              {userName(u.pk)}
            </option>
          ))
        ) : (
          <option value={String(currentUser.pk)}>{userName(currentUser.pk)}</option>
        )}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" size={16} />
    </div>
  );
});