'use client';

import type { WeeklyStats } from '@/hooks/routine';
import StatsSummaryRenderer from './StatsSummaryRenderer';

interface WeeklyStatsSummaryProps {
  stats: WeeklyStats;
}

export default function WeeklyStatsSummary({ stats }: WeeklyStatsSummaryProps) {
  return <StatsSummaryRenderer stats={stats} totalLabel="7일" />;
}
