'use client';

import type { ActionChip } from '@/lib/types/counselor';
import { DEFAULT_ACTION_CHIPS, ICON_MAP } from './ActionChips';

interface WelcomeScreenProps {
  onChipClick: (chip: ActionChip) => void;
  disabled?: boolean;
}

/**
 * 상담 채팅 환영 화면 — ChatGPT 스타일
 *
 * 대화 시작 전 표시: 심플 인사말 + 가로 pill 액션 칩
 */
export default function WelcomeScreen({ onChipClick, disabled }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-end h-full px-6 pb-8 text-center">
      {/* 인사말 */}
      <h2 className="text-2xl font-bold text-foreground mb-2">
        무엇을 도와드릴까요?
      </h2>

      {/* 액션 칩 — 가로 pill */}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {DEFAULT_ACTION_CHIPS.map((chip) => {
          const IconComp = ICON_MAP[chip.icon];
          return (
            <button
              key={chip.id}
              onClick={() => onChipClick(chip)}
              disabled={disabled}
              className="flex items-center gap-2 rounded-full border border-edge-subtle bg-card px-4 py-2.5 transition-colors active:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {IconComp && (
                <IconComp size={18} weight="fill" className="text-primary" />
              )}
              <span className="text-sm font-medium text-foreground">{chip.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
