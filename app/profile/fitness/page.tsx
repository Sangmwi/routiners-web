import FitnessProfileClient from '@/components/profile/fitness/FitnessProfileClient';

// useSuspenseQuery 사용 시 필수 - 빌드 시 API 호출 방지
export const dynamic = 'force-dynamic';

export default function FitnessProfilePage() {
  return <FitnessProfileClient />;
}
