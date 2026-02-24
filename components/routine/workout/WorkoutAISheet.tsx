'use client';

import { useState } from 'react';
import { RobotIcon, PaperPlaneRightIcon, LightbulbIcon, TargetIcon, WarningIcon } from '@phosphor-icons/react';
import Modal, { ModalBody } from '@/components/ui/Modal';

interface WorkoutAISheetProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
}

/** MVP 목 데이터 */
const MOCK_TIPS = [
  {
    icon: TargetIcon,
    label: '자세 포인트',
    text: '팔꿈치를 몸에 가깝게 유지하고, 등을 곧게 펴세요. 반동을 사용하지 않도록 주의하세요.',
  },
  {
    icon: LightbulbIcon,
    label: '꿀팁',
    text: '내릴 때 천천히 3초간 버티면 근비대 효과가 더 높아져요. 호흡은 올릴 때 내쉬세요.',
  },
  {
    icon: WarningIcon,
    label: '주의사항',
    text: '손목이 꺾이지 않도록 중립을 유지하세요. 무게가 무리라면 1~2kg 낮춰서 시작하세요.',
  },
];

const MOCK_MESSAGES = [
  { role: 'assistant' as const, text: '안녕하세요! 현재 운동에 대해 궁금한 점이 있으면 물어보세요 💪' },
];

export default function WorkoutAISheet({ isOpen, onClose, exerciseName }: WorkoutAISheetProps) {
  const [inputValue, setInputValue] = useState('');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      enableSwipe
      height="full"
      showCloseButton={false}
    >
      <ModalBody className="flex flex-col h-full">
        {/* 헤더 */}
        <div className="px-4 pt-1 pb-3 border-b border-edge-subtle">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-surface-accent flex items-center justify-center">
              <RobotIcon size={18} className="text-primary" weight="fill" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">AI 트레이너</h3>
              <p className="text-xs text-muted-foreground">{exerciseName}</p>
            </div>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
          {/* 운동 팁 카드들 */}
          <div className="space-y-3">
            {MOCK_TIPS.map((tip) => (
              <div key={tip.label} className="rounded-xl bg-surface-secondary p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <tip.icon size={16} weight="fill" className="text-primary" />
                  <span className="text-xs font-semibold text-foreground">{tip.label}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>

          {/* 채팅 영역 (목업) */}
          <div className="space-y-3 pt-2">
            {MOCK_MESSAGES.map((msg, i) => (
              <div key={i} className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-surface-accent flex items-center justify-center shrink-0 mt-0.5">
                  <RobotIcon size={12} className="text-primary" weight="fill" />
                </div>
                <div className="rounded-2xl rounded-tl-md bg-surface-hover px-3.5 py-2.5 max-w-[85%]">
                  <p className="text-sm text-foreground">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 입력 영역 */}
        <div className="px-4 py-3 pb-safe border-t border-edge-subtle">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="AI에게 질문하기..."
              disabled
              className="flex-1 h-10 px-4 rounded-full bg-surface-hover border border-border text-sm text-foreground placeholder:text-muted-foreground/50 disabled:opacity-60"
            />
            <button
              disabled
              className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center disabled:opacity-40"
            >
              <PaperPlaneRightIcon size={18} className="text-primary" weight="fill" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground/50 text-center mt-2">
            곧 AI 트레이너 기능이 추가될 예정이에요
          </p>
        </div>
      </ModalBody>
    </Modal>
  );
}
