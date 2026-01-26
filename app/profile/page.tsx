import ProfileClient from '@/components/profile/ProfileClient';

// 정적 생성 방지 - 클라이언트 데이터 필요
export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  return <ProfileClient />;
}
