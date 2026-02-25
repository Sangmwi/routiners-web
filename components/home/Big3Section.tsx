'use client';

import SectionHeader from '@/components/ui/SectionHeader';
import { Big3SummaryCard } from '@/components/progress/Big3SummaryCard';
import type { Big3Summary } from '@/lib/types/progress';

interface Big3SectionProps {
  summary: Big3Summary;
}

export default function Big3Section({ summary }: Big3SectionProps) {
  return (
    <section>
      <SectionHeader title="3대 운동" action={{ label: '관리', href: '/profile/big3' }} />
      <div className="mt-3">
        <Big3SummaryCard
          summary={summary}
          sparklineHeight={36}
          sparklineShowAllDots
        />
      </div>
    </section>
  );
}

