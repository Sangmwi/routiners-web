'use client';

/**
 * 상태바 영역 배경 커버
 *
 * viewportFit: 'cover' 환경에서 콘텐츠가 safe-area-inset-top(상태바) 영역까지
 * 확장되면, 스크롤 시 콘텐츠가 상태바 위로 비치는 문제가 생긴다.
 * 이 컴포넌트는 safe-area-inset-top 높이만큼 고정 배경을 덮어 콘텐츠 투과를 차단한다.
 *
 * - z-[52]: BottomNav(z-50) 위, Modal(z-60) 아래
 * - pointer-events-none: 상태바 영역 터치 통과
 * - bg-background: 테마 CSS 변수로 라이트/다크 자동 대응
 */
export function StatusBarCover() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[52] mx-auto max-w-md bg-background pointer-events-none"
      style={{ height: 'env(safe-area-inset-top, 0px)' }}
    />
  );
}
