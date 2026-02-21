import { redirect } from 'next/navigation';

/**
 * Legacy redirect: /routine/stats → /stats
 *
 * 기존 북마크/공유 URL 호환을 위한 리다이렉트
 */
export default async function LegacyStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  redirect(tab ? `/stats?tab=${tab}` : '/stats');
}
