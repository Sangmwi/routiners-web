'use client';

import { useRouter } from 'next/navigation';
import { BackIcon } from '@/components/ui/icons';

interface PageHeaderProps {
  /** 페이지 제목 */
  title: string;

  /** 우측에 표시할 액션 버튼 (선택) */
  action?: React.ReactNode;

  /** 뒤로가기 버튼 표시 여부 (기본: true) */
  showBackButton?: boolean;

  /** 커스텀 뒤로가기 핸들러 */
  onBack?: () => void;

  /** 배경색 투명 여부 (기본: false) */
  transparent?: boolean;

  /** 제목 가운데 정렬 여부 (기본: false) */
  centered?: boolean;
}

/**
 * 상세 페이지 상단 헤더 컴포넌트
 *
 * @example
 * <PageHeader title="프로필 수정" />
 * <PageHeader title="설정" action={<Button>저장</Button>} />
 * <PageHeader title="커스텀" onBack={() => router.push('/')} centered />
 */
export function PageHeader({
  title,
  action,
  showBackButton = true,
  onBack,
  transparent = false,
  centered = false,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const bgClass = transparent
    ? 'bg-transparent'
    : 'bg-background border-b border-border/50';

  // 가운데 정렬 레이아웃
  if (centered) {
    return (
      <header className={`sticky top-0 z-40 ${bgClass}`}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* 왼쪽: 뒤로가기 버튼 */}
          {showBackButton ? (
            <button
              onClick={handleBack}
              className="p-1 hover:bg-muted/50 rounded-lg transition-colors"
              aria-label="뒤로가기"
            >
              <BackIcon size="lg" className="text-foreground" />
            </button>
          ) : (
            <div className="w-8" />
          )}

          {/* 가운데: 제목 */}
          <h1 className="text-base font-bold text-foreground">{title}</h1>

          {/* 우측: 액션 버튼 또는 빈 공간 */}
          {action ? (
            <div className="flex items-center">{action}</div>
          ) : (
            <div className="w-8" />
          )}
        </div>
      </header>
    );
  }

  // 기본 왼쪽 정렬 레이아웃
  return (
    <header className={`sticky top-0 z-40 ${bgClass}`}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* 왼쪽: 뒤로가기 버튼 + 제목 */}
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="p-1 -ml-1 hover:bg-muted/50 rounded-lg transition-colors"
              aria-label="뒤로가기"
            >
              <BackIcon size="lg" className="text-foreground" />
            </button>
          )}
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
        </div>

        {/* 우측: 액션 버튼 */}
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
    </header>
  );
}

export default PageHeader;
