'use client';

import { ReactNode } from 'react';
import { PageHeader } from './shared/PageHeader';

interface DetailLayoutProps {
  /** 페이지 제목 */
  title: string;

  /** 뒤로가기 버튼 표시 여부 (기본: true) */
  showBack?: boolean;

  /** 커스텀 뒤로가기 핸들러 */
  onBack?: () => void;

  /** 우측 액션 버튼 */
  action?: ReactNode;

  /** 제목 가운데 정렬 여부 (기본: false) */
  centered?: boolean;

  /** 본문 패딩 (기본: true) */
  padding?: boolean;

  /** 하단 여백 추가 (기본: true) - BottomNav 공간 확보 */
  bottomPadding?: boolean;

  /** 배경색 투명 여부 (기본: false) */
  headerTransparent?: boolean;

  /** 자식 컴포넌트 */
  children: ReactNode;
}

/**
 * 상세 페이지용 통합 레이아웃 (순수 배치만 담당)
 *
 * - PageHeader (뒤로가기 + 제목 + 액션)
 * - 콘텐츠 영역 (패딩 옵션)
 *
 * Suspense/ErrorBoundary는 각 page.tsx에서 명시적으로 관리합니다.
 * 이는 SOLID의 SRP(단일 책임 원칙)를 따릅니다.
 *
 * @example
 * // page.tsx에서 사용
 * <DetailLayout title="운동 기록">
 *   <QueryErrorBoundary>
 *     <Suspense fallback={<PulseLoader />}>
 *       <WorkoutContent date={date} />
 *     </Suspense>
 *   </QueryErrorBoundary>
 * </DetailLayout>
 */
export function DetailLayout({
  title,
  showBack = true,
  onBack,
  action,
  centered = false,
  padding = true,
  bottomPadding = true,
  headerTransparent = false,
  children,
}: DetailLayoutProps) {
  return (
    <div className={`min-h-screen bg-background ${bottomPadding ? 'pb-24' : ''}`}>
      <PageHeader
        title={title}
        showBackButton={showBack}
        onBack={onBack}
        action={action}
        centered={centered}
        transparent={headerTransparent}
      />
      <div className={padding ? 'p-4' : ''}>{children}</div>
    </div>
  );
}

export default DetailLayout;
