'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';

/**
 * 프로필 페이지 전용 헤더
 * 메인 탭 레이아웃 내에서 사용되며, 설정 링크를 포함합니다.
 */
export default function ProfileHeader() {
  return (
    <div className="flex items-center justify-between -mx-4 -mt-4 px-4 py-3 mb-2">
      <h1 className="text-xl font-bold text-foreground">내 프로필</h1>
      <Link
        href="/profile/edit"
        prefetch={true}
        className="p-1.5 hover:bg-muted/50 rounded-lg transition-colors"
        aria-label="프로필 편집"
      >
        <Settings className="w-5 h-5 text-muted-foreground" />
      </Link>
    </div>
  );
}
