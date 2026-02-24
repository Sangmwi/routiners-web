'use client';

import { RobotIcon } from '@phosphor-icons/react';
import type { ActionChip } from '@/lib/types/counselor';
import { DEFAULT_ACTION_CHIPS, ICON_MAP } from './ActionChips';

interface WelcomeScreenProps {
  onChipClick: (chip: ActionChip) => void;
  disabled?: boolean;
}

/**
 * 상담 채팅 환영 화면
 *
 * 대화 시작 전 표시되는 환영 메시지 + 액션 칩
 */
export default function WelcomeScreen({ onChipClick, disabled }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
      {/* 로고/아이콘 */}
      <div className="w-20 h-20 rounded-2xl bg-surface-accent flex items-center justify-center mb-6">
        <RobotIcon size={40} weight="fill" className="text-primary" />
      </div>

      {/* 환영 메시지 */}
      <h2 className="text-xl font-bold text-foreground mb-2">
        안녕하세요!
      </h2>
      <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
        무엇이든 물어보세요.
        <br />
        운동 상담, 식단 상담 등
        <br />
        다양한 도움을 드릴 수 있어요.
      </p>

      {/* 액션 칩 */}
      <div className="mt-8 w-full max-w-xs flex flex-col gap-3">
        {DEFAULT_ACTION_CHIPS.map((chip) => {
          const IconComp = ICON_MAP[chip.icon];
          return (
            <button
              key={chip.id}
              onClick={() => onChipClick(chip)}
              disabled={disabled}
              className="flex items-center gap-4 w-full rounded-2xl border border-border bg-card px-5 py-4 text-left transition-colors active:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {IconComp && (
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-surface-accent flex items-center justify-center">
                  <IconComp size={22} weight="fill" className="text-primary" />
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-foreground">{chip.label}</span>
                <span className="text-xs text-muted-foreground mt-0.5">{chip.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
