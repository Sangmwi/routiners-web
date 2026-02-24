import { FireIcon } from '@phosphor-icons/react';

interface StreakBannerProps {
  count: number;
}

/**
 * 연속 운동 완료 배너
 *
 * 🔥 N일 연속 운동 완료!
 */
export default function StreakBanner({ count }: StreakBannerProps) {
  return (
    <div className="flex items-center gap-2 bg-amber-500/10 rounded-xl px-4 py-3">
      <FireIcon size={20} weight="fill" className="text-amber-500" />
      <span className="text-sm font-medium text-foreground">
        <span className="text-amber-500">{count}일</span> 연속 운동 완료!
      </span>
    </div>
  );
}
