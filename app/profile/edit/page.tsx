import ProfileEditClient from '@/components/profile/edit/ProfileEditClient';

// useSuspenseQuery 사용 시 필수 - 빌드 시 API 호출 방지
export const dynamic = 'force-dynamic';

export default function ProfileEditPage() {
  return <ProfileEditClient />;
}
