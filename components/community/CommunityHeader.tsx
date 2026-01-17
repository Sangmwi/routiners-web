'use client';

import { PencilSimpleLineIcon, FunnelIcon } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';

interface CommunityHeaderProps {
  onNewPost?: () => void;
  onFilter?: () => void;
}

/**
 * 커뮤니티 페이지 헤더
 */
export default function CommunityHeader({ onNewPost, onFilter }: CommunityHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-foreground">커뮤니티</h1>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onFilter}>
          <FunnelIcon size={16} />
        </Button>
        <Button variant="primary" size="sm" onClick={onNewPost}>
          <PencilSimpleLineIcon size={16} />
          글쓰기
        </Button>
      </div>
    </div>
  );
}
