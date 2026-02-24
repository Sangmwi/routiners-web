'use client';

import { RANKS, RANK_LABELS, type Rank } from '@/lib/types/user';

interface ProfileRankInputProps {
  value: Rank;
  onChange: (value: Rank) => void;
}

/** 계급장 — 가로 줄(bar) 개수로 표현 */
function RankInsignia({ rank, active }: { rank: Rank; active: boolean }) {
  const barCount: Record<Rank, number> = {
    '이병': 1,
    '일병': 2,
    '상병': 3,
    '병장': 4,
  };
  const count = barCount[rank];
  const barColor = active ? 'bg-primary-foreground' : 'bg-hint-strong';

  return (
    <div className="flex flex-col items-center justify-center gap-[3px] w-6 h-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`w-full h-[2.5px] rounded-full ${barColor}`}
        />
      ))}
    </div>
  );
}

export default function ProfileRankInput({ value, onChange }: ProfileRankInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground block">계급</label>
      <div className="flex gap-2">
        {RANKS.map((rank) => {
          const isSelected = value === rank;
          return (
            <button
              key={rank}
              type="button"
              onClick={() => onChange(rank)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                  : 'bg-surface-hover text-muted-foreground border border-edge-subtle hover:border-edge-subtle'
              }`}
            >
              <RankInsignia rank={rank} active={isSelected} />
              {RANK_LABELS[rank]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
