'use client';

import { ReactNode } from 'react';

interface MainTabHeaderProps {
  /** 페이지 제목 */
  title: string;
  /** 부제목 (선택) */
  subtitle?: string;
  /** 우측 액션 영역 (버튼, 링크 등) */
  action?: ReactNode;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 메인 탭 페이지 공통 헤더
 *
 * 홈, 루틴, 커뮤니티, 프로필 탭에서 통일된 스타일로 사용
 *
 * @example
 * <MainTabHeader title="내 루틴" subtitle="2025년 1월 25일 토요일" />
 * <MainTabHeader title="커뮤니티" action={<Button>글쓰기</Button>} />
 */
export function MainTabHeader({
  title,
  subtitle,
  action,
  className = '',
}: MainTabHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`.trim()}>
      <div>
        <h1 className="text-md font-bold text-muted-foreground">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export default MainTabHeader;
