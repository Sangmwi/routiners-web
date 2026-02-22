'use client';

import { useCurrentUserProfileSuspense } from '@/hooks/profile';
import ProfileCompactHeader from '@/components/profile/ProfileCompactHeader';
import ProfileActionRow from '@/components/profile/ProfileActionRow';
import ProfileActivityGrid from '@/components/profile/ProfileActivityGrid';

/**
 * 소셜 프로필 페이지 콘텐츠 (Suspense 내부)
 *
 * - 원형 프로필 사진 + 닉네임 + 소개
 * - 팔로워/팔로잉/프로필편집 액션 로우
 * - 활동 그리드 (커뮤니티 게시글 3-column)
 */
export default function ProfileContent() {
  const { data: user } = useCurrentUserProfileSuspense();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p>프로필 정보를 불러올 수 없어요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ProfileCompactHeader user={user} />
      <div className="px-4">
        <ProfileActionRow />
      </div>

      {/* 활동 섹션 */}
      <div className="pt-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 mb-3">
          활동
        </h3>
        <ProfileActivityGrid userId={user.id} />
      </div>
    </div>
  );
}
