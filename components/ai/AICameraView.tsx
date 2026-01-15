'use client';

import { Camera, Video } from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * AI 카메라 뷰 플레이스홀더
 * 향후 실제 카메라/비디오 기능 구현 예정
 */
export default function AICameraView() {
  return (
    <div className="rounded-2xl bg-card p-6 shadow-sm border border-border/50">
      <h3 className="text-lg font-bold text-card-foreground mb-4">운동 분석</h3>

      {/* 카메라 플레이스홀더 */}
      <div className="relative aspect-video rounded-xl bg-muted overflow-hidden mb-4">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <Video className="h-16 w-16 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">카메라 뷰 (준비 중)</p>
        </div>

        {/* 상태 인디케이터 */}
        <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-card/90 backdrop-blur-sm px-3 py-1.5 shadow-sm border border-border/50">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-medium text-foreground">대기 중</span>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <Button variant="primary" fullWidth>
          <Camera className="h-4 w-4" />
          운동 시작
        </Button>
        <Button variant="outline">
          <Video className="h-4 w-4" />
          영상 업로드
        </Button>
      </div>
    </div>
  );
}
