/** 로딩 스켈레톤 오버레이 */
export function LoadingSkeleton({ show }: { show: boolean }) {
  if (!show) return null;
  return <div className="absolute inset-0 bg-card animate-pulse" />;
}
