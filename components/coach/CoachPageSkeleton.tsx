'use client';

/**
 * 코치 페이지 스켈레톤
 *
 * Suspense fallback용 로딩 UI
 */
export default function CoachPageSkeleton() {
  return (
    <div className="flex flex-col h-full bg-background animate-pulse">
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="w-10 h-10 rounded-full bg-muted" />
        <div className="w-16 h-6 rounded bg-muted" />
        <div className="w-10 h-10 rounded-full bg-muted" />
      </div>

      {/* 컨텐츠 영역 스켈레톤 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* 아이콘 */}
        <div className="w-20 h-20 rounded-2xl bg-muted mb-6" />

        {/* 텍스트 */}
        <div className="w-32 h-7 rounded bg-muted mb-2" />
        <div className="w-48 h-4 rounded bg-muted mb-1" />
        <div className="w-40 h-4 rounded bg-muted" />
      </div>

      {/* 액션 칩 스켈레톤 */}
      <div className="flex gap-3 px-4 py-3 border-t border-border">
        <div className="w-40 h-16 rounded-xl bg-muted shrink-0" />
        <div className="w-40 h-16 rounded-xl bg-muted shrink-0" />
      </div>

      {/* 인풋 스켈레톤 */}
      <div className="flex items-end gap-2 p-4 border-t border-border">
        <div className="flex-1 h-11 rounded-xl bg-muted" />
        <div className="w-11 h-11 rounded-xl bg-muted shrink-0" />
      </div>
    </div>
  );
}
