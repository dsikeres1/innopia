'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { api } from '@/api/api';
import { SceneCategoryInfo } from '@/api/schema.g';

interface Props {
  onClose: () => void;
  onFilter: (category: string | null, actorName: string | null) => void;
}

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  buttons?: ButtonOption[];
  buttonsDisabled?: boolean;
}

interface ButtonOption {
  label: string;
  value: string;
}

type ChatState =
  | 'WELCOME'
  | 'MENU'
  | 'CATEGORY_ONLY'
  | 'ACTOR_ONLY'
  | 'COMBO_CATEGORY'
  | 'COMBO_ACTOR'
  | 'RESULT'
  | 'NEW_SEARCH';

export function ChatbotInterface({ onClose, onFilter }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [state, setState] = useState<ChatState>('WELCOME');
  const [isMobile, setIsMobile] = useState(false);
  const [categories, setCategories] = useState<SceneCategoryInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedActorName, setSelectedActorName] = useState<string | null>(null);
  const [actorSearchInput, setActorSearchInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    api.sceneCategoryList({}).then((res) => {
      if (res) {
        setCategories(res.categories);
      }
    });
  }, []);

  const addBotMessage = (text: string, buttons?: ButtonOption[]) => {
    setMessages((prev) => [...prev, { sender: 'bot', text, buttons }]);
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [...prev, { sender: 'user', text }]);
  };

  const showCategorySelection = useCallback(
    (introText: string) => {
      const categoryButtons: ButtonOption[] = categories.map((cat, idx) => ({
        label: `${idx + 1}. ${cat.name}`,
        value: cat.name,
      }));
      categoryButtons.push({ label: '📋 전체보기', value: 'ALL' });

      addBotMessage(`${introText}\n\n번호를 선택해주세요.`, categoryButtons);
    },
    [categories]
  );

  const showResult = useCallback(() => {

    api.sceneChatbotFilter({ category: selectedCategory, actorName: selectedActorName }).then((res) => {
      if (res) {
        const count = res.scenes.length;

        let resultText = '🎬 검색 결과\n\n';
        if (selectedCategory && selectedActorName) {
          resultText += `총 ${count}개의 콘텐츠를 찾았습니다!\n\n장면: ${selectedCategory}\n배우: ${selectedActorName}`;
        } else if (selectedCategory) {
          resultText += `총 ${count}개의 콘텐츠를 찾았습니다!\n\n장면: ${selectedCategory}`;
        } else if (selectedActorName) {
          resultText += `총 ${count}개의 콘텐츠를 찾았습니다!\n\n배우: ${selectedActorName}`;
        }

        addBotMessage(resultText);

        onFilter(selectedCategory, selectedActorName);

        if (isMobile) {
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          setState('NEW_SEARCH');
        }
      }
    });
  }, [selectedCategory, selectedActorName, isMobile, onClose, onFilter]);

  const prevStateRef = useRef<ChatState | null>(null);

  useEffect(() => {

    if (prevStateRef.current === state) return;
    prevStateRef.current = state;

    if (state === 'WELCOME') {
      addBotMessage('안녕하세요! 👋 장면 필터링 도우미입니다.\n원하시는 콘텐츠를 쉽게 찾아드릴게요!');
      setTimeout(() => {
        setState('MENU');
      }, 800);
    } else if (state === 'MENU') {
      addBotMessage('어떤 방식으로 필터링하시겠어요? 🎬', [
        { label: '장면만', value: '1' },
        { label: '배우만', value: '2' },
        { label: '장면+배우', value: '3' },
      ]);
    } else if (state === 'CATEGORY_ONLY') {
      showCategorySelection('장면 선택 메뉴:\n원하시는 장면을 선택해주세요.');
    } else if (state === 'ACTOR_ONLY') {
      addBotMessage('배우 이름을 입력해주세요.\n\n예시: "현빈", "손예진"');
    } else if (state === 'COMBO_CATEGORY') {
      showCategorySelection('장면+배우 조합:\n먼저 장면을 선택해 주세요.');
    } else if (state === 'COMBO_ACTOR') {
      addBotMessage('배우 이름을 입력해주세요.\n\n예시: "현빈", "손예진"');
    } else if (state === 'RESULT') {
      showResult();
    } else if (state === 'NEW_SEARCH') {
      addBotMessage('추가 조작으로 다시 검색하시겠어요?', [
        { label: '🔍 새로운 검색', value: 'new' },
        { label: '👋 종료', value: 'exit' },
      ]);
    }

  }, [state, categories, showCategorySelection, showResult]);

  const handleButtonClick = (value: string) => {
    addUserMessage(String(value));

    setMessages((prev) => prev.map((msg) => (msg.buttons ? { ...msg, buttonsDisabled: true } : msg)));

    if (state === 'MENU') {
      if (value === '1') {
        setState('CATEGORY_ONLY');
      } else if (value === '2') {
        setState('ACTOR_ONLY');
      } else if (value === '3') {
        setState('COMBO_CATEGORY');
      } else {
        addBotMessage('❌ 잘못된 입력입니다!\n옵바른 번호를 입력해주세요!');
      }
    } else if (state === 'CATEGORY_ONLY') {
      if (value === 'ALL') {
        setSelectedCategory(null);
        setState('RESULT');
      } else {
        setSelectedCategory(value);
        setState('RESULT');
      }
    } else if (state === 'COMBO_CATEGORY') {
      if (value === 'ALL') {
        addBotMessage('❌ 잘못된 입력입니다!\n올바른 장면을 선택해 주세요!');
        setState('MENU');
      } else {
        setSelectedCategory(value);
        addBotMessage(`1단계: 장면 선택 완료\n${value}`);
        setState('COMBO_ACTOR');
      }
    } else if (state === 'NEW_SEARCH') {
      if (value === 'new') {

        prevStateRef.current = null; 
        setSelectedCategory(null);
        setSelectedActorName(null);
        setMessages([]);
        setState('WELCOME');
      } else if (value === 'exit') {
        addBotMessage('이용해 주셔서 감사합니다!\n또 필요하시면 언제든 말씀해주세요!');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    }
  };

  const searchingRef = useRef(false);

  const handleActorSearch = () => {
    const query = actorSearchInput.trim();
    if (!query || searchingRef.current) return;

    searchingRef.current = true;
    addUserMessage(query);

    setMessages((prev) => prev.map((msg) => (msg.buttons ? { ...msg, buttonsDisabled: true } : msg)));

    api.sceneChatbotFilter({ category: selectedCategory, actorName: query }).then((res) => {
      searchingRef.current = false;
      setActorSearchInput('');

      if (res && res.scenes.length > 0) {
        setSelectedActorName(query);
        setState('RESULT');
      } else {
        addBotMessage(`❌ "${query}" 배우가 출연한 ${selectedCategory ? '해당 장면의 ' : ''}콘텐츠를 찾지 못했습니다.\n다른 이름을 시도해주세요.`);
      }
    });
  };

  const containerClass = isMobile
    ? 'fixed inset-0 z-50 bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-black flex flex-col'
    : 'absolute bottom-[80px] right-6 z-50 w-96 bg-white text-black rounded-2xl shadow-xl flex flex-col max-h-[80vh] overflow-hidden border border-gray-200';

  return (
    <div className={containerClass}>

      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-300 bg-gradient-to-r from-blue-100 to-indigo-100">
        <h2 className="text-sm font-semibold text-gray-700">🎬 Scene 필터링 챗봇</h2>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
          <X size={18} />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-white text-sm min-h-[200px]"
      >
        {messages.map((msg, i) => (
          <div key={i}>
            <div
              className={clsx('flex transition-all', {
                'justify-end': msg.sender === 'user',
                'justify-start': msg.sender === 'bot',
              })}
            >
              <div
                className={clsx(
                  'px-4 py-2 rounded-xl max-w-[85%] whitespace-pre-line shadow-sm',
                  msg.sender === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                )}
              >
                {msg.text}
              </div>
            </div>

            {msg.buttons && msg.buttons.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {msg.buttons.map((btn, btnIdx) => (
                  <button
                    key={btnIdx}
                    disabled={msg.buttonsDisabled}
                    onClick={() => {
                      if (msg.buttonsDisabled) return;
                      handleButtonClick(btn.value);
                    }}
                    className={clsx(
                      'px-3 py-2 text-xs rounded-lg transition shadow-sm text-center font-medium',
                      msg.buttonsDisabled
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    )}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {(state === 'ACTOR_ONLY' || state === 'COMBO_ACTOR') && (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 bg-white">
          <input
            value={actorSearchInput}
            onChange={(e) => setActorSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleActorSearch();
              }
            }}
            placeholder="배우 이름 입력"
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleActorSearch}
            className="text-sm px-4 py-2 rounded-full transition bg-blue-500 text-white hover:bg-blue-600"
          >
            검색
          </button>
        </div>
      )}
    </div>
  );
}