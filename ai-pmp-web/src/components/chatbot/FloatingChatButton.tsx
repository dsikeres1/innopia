'use client';

interface Props {
  onClick: () => void;
}

export function FloatingChatButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-full shadow-xl transition-all duration-300"
    >
      💬
    </button>
  );
}