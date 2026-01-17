'use client';

import { ChatCircleIcon } from '@phosphor-icons/react';

interface FloatingChatButtonProps {
  onClick?: () => void;
}

export default function FloatingChatButton({ onClick }: FloatingChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-[52px] h-[52px] rounded-[26px] bg-primary/10 hover:bg-primary/20 shadow-[0px_0px_2px_0px_rgba(29,215,91,0.2),0px_4px_9px_0px_rgba(29,215,91,0.19)] transition-colors border border-primary/20"
      aria-label="채팅하기"
    >
      <ChatCircleIcon size={24} className="text-primary" />
    </button>
  );
}
