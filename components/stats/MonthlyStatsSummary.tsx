'use client';

import type { MonthlyStats } from '@/hooks/routine';
import StatsSummaryRenderer from './StatsSummaryRenderer';

interface MonthlyStatsSummaryProps {
  stats: MonthlyStats;
}

export default function MonthlyStatsSummary({ stats }: MonthlyStatsSummaryProps) {
  return <StatsSummaryRenderer stats={stats} totalLabel={`${stats.totalDays}일`} />;
}
