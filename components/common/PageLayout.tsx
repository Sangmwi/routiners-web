'use client';

import { Suspense, ReactNode } from 'react';
import PageHeader from './PageHeader';
import { QueryErrorBoundary } from './QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';

// ============================================================================
// Types
// ============================================================================

interface PageLayoutProps {
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

  /** 하단 여백 추가 (기본: true) */
  bottomPadding?: boolean;

  /** 자식 컴포넌트 */
  children: ReactNode;
}

// ============================================================================
// Component
// ============================================================================

/**
 * 페이지 레이아웃 컴포넌트
 *
 * 상세 페이지용 통합 레이아웃:
 * - PageHeader (헤더)
 * - ErrorBoundary (에러 처리)
 * - Suspense (로딩 상태)
 *
 * useSuspenseBaseQuery와 함께 사용하면 페이지 코드가 대폭 간소화됩니다.
 *
 * @example
 * // 기본 사용 - Content 컴포넌트에서 useSuspenseBaseQuery 사용
 * function ProfileEditContent() {
 *   const { data: profile } = useSuspenseBaseQuery(
 *     queryKeys.user.me(),
 *     profileApi.getCurrentUserProfile
 *   );
 *   return <ProfileEditForm profile={profile} />;
 * }
 *
 * export default function ProfileEditPage() {
 *   return (
 *     <PageLayout title="프로필 수정">
 *       <ProfileEditContent />
 *     </PageLayout>
 *   );
 * }
 *
 * @example
 * // 액션 버튼 + 패딩 없음
 * <PageLayout
 *   title="전체 캘린더"
 *   action={<Button>필터</Button>}
 *   padding={false}
 * >
 *   <CalendarContent />
 * </PageLayout>
 */
export default function PageLayout({
  title,
  showBack = true,
  onBack,
  action,
  centered = false,
  padding = true,
  bottomPadding = true,
  children,
}: PageLayoutProps) {
  return (
    <div className={`min-h-screen bg-background ${bottomPadding ? 'pb-8' : ''}`}>
      <PageHeader
        title={title}
        showBackButton={showBack}
        onBack={onBack}
        action={action}
        centered={centered}
      />
      <QueryErrorBoundary>
        <Suspense
          fallback={
            <div className={padding ? 'p-4' : ''}>
              <PulseLoader />
            </div>
          }
        >
          <div className={padding ? 'p-4' : ''}>{children}</div>
        </Suspense>
      </QueryErrorBoundary>
    </div>
  );
}
