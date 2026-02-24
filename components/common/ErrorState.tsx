import { ErrorIcon, RefreshIcon } from '@/components/ui/icons';
import Button from '@/components/ui/Button';

interface ErrorStateProps {
  /** 에러 제목 (기본: "오류가 발생했습니다") */
  title?: string;

  /** 에러 메시지 */
  message?: string;

  /** 재시도 버튼 표시 여부 (기본: true) */
  showRetry?: boolean;

  /** 재시도 버튼 클릭 핸들러 */
  onRetry?: () => void;

  /** 전체 페이지 크기로 표시 (기본: false) */
  fullPage?: boolean;
}

/**
 * 에러 발생 시 표시하는 Error State 컴포넌트
 *
 * @example
 * // 기본 사용
 * <ErrorState onRetry={refetch} />
 *
 * // 커스텀 메시지
 * <ErrorState
 *   title="네트워크 오류"
 *   message="인터넷 연결을 확인해주세요"
 *   onRetry={refetch}
 * />
 *
 * // 전체 페이지
 * <ErrorState fullPage onRetry={refetch} />
 */
export default function ErrorState({
  title = '오류가 발생했어요',
  message = '잠시 후 다시 시도해주세요',
  showRetry = true,
  onRetry,
  fullPage = false,
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 text-center ${
        fullPage ? 'min-h-screen' : 'py-16'
      }`}
    >
      {/* 에러 아이콘 */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-danger">
        <ErrorIcon size="xl" className="text-destructive" />
      </div>

      {/* 제목 */}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>

      {/* 메시지 */}
      {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}

      {/* 재시도 버튼 */}
      {showRetry && onRetry && (
        <Button variant="outline" size="md" onClick={onRetry} className="mt-6">
          <RefreshIcon size="sm" />
          다시 시도
        </Button>
      )}
    </div>
  );
}
