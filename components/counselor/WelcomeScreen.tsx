'use client';

import { RobotIcon } from '@phosphor-icons/react';

/**
 * 상담 채팅 환영 화면
 *
 * 대화 시작 전 표시되는 환영 메시지
 */
export default function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
      {/* 로고/아이콘 */}
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <RobotIcon size={40} weight="fill" className="text-primary" />
      </div>

      {/* 환영 메시지 */}
      <h2 className="text-xl font-bold text-foreground mb-2">
        안녕하세요!
      </h2>
      <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
        무엇이든 물어보세요.
        <br />
        운동 루틴 생성, 영양 분석, PX 추천 등
        <br />
        다양한 도움을 드릴 수 있어요.
      </p>

      {/* 힌트 */}
      <div className="mt-8 text-xs text-muted-foreground/70">
        아래 액션 칩을 탭하거나 직접 메시지를 입력하세요
      </div>
    </div>
  );
}
