import { redirect } from 'next/navigation';

interface RoutineDatePageProps {
  params: Promise<{ date: string }>;
}

/**
 * 기존 루틴 날짜 페이지 → 운동 상세 페이지로 리다이렉트
 *
 * 하위 호환성을 위해 기존 URL(/routine/2025-01-10)을
 * 새 URL(/routine/workout/2025-01-10)로 리다이렉트
 */
export default async function RoutineDatePage({
  params,
}: RoutineDatePageProps) {
  const { date } = await params;
  redirect(`/routine/workout/${date}`);
}
