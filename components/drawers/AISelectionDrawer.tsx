'use client';

import { Zap, Utensils, Loader2 } from 'lucide-react';
import Modal, { ModalBody } from '@/components/ui/Modal';
import type { ModalDataMap } from '@/lib/stores/modalStore';

interface AISelectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: ModalDataMap['aiSelection'];
}

/**
 * AI 코치 선택 드로어 (바텀시트)
 *
 * 운동/식단 AI 중 선택하여 채팅 시작
 * - 활성 세션 있으면 "진행중" 뱃지 표시
 * - 선택 시 세션 생성/조회 후 채팅 페이지로 이동
 */
export default function AISelectionDrawer({
  isOpen,
  onClose,
  data,
}: AISelectionDrawerProps) {
  const handleSelect = (purpose: 'workout' | 'meal') => {
    // 로딩 중이면 무시
    if (data.isLoading) return;
    // onClose는 FloatingAIButton에서 처리
    data.onSelectPurpose(purpose);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      enableSwipe
      showCloseButton={false}
      size="lg"
    >
      <ModalBody className="pb-8">
        {/* 타이틀 */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-foreground">
            AI 코치와 대화하기
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            원하는 목표를 선택해주세요
          </p>
        </div>

        {/* 로딩 중이면 스피너 표시 */}
        {data.isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">세션을 준비하고 있어요...</p>
          </div>
        ) : (
          /* 선택 옵션 */
          <div className="space-y-3">
            {/* 운동 루틴 */}
            <button
              onClick={() => handleSelect('workout')}
              className="w-full p-4 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">운동 루틴</h3>
                    {data.workoutSessionActive && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">
                        진행중
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    맞춤형 4주 운동 프로그램 생성
                  </p>
                </div>
              </div>
            </button>

            {/* 식단 관리 */}
            <button
              onClick={() => handleSelect('meal')}
              className="w-full p-4 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Utensils className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">식단 관리</h3>
                    {data.mealSessionActive && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">
                        진행중
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    맞춤형 영양 및 식단 계획 생성
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
