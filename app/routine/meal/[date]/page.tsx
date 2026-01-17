'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';
import { Utensils, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';

interface MealDetailPageProps {
  params: Promise<{ date: string }>;
}

/**
 * 식단 관리 상세 페이지 (플레이스홀더)
 *
 * 향후 AI 영양사 기능이 구현되면
 * 식단 계획과 영양 정보를 표시할 예정
 */
export default function MealDetailPage({ params }: MealDetailPageProps) {
  const { date } = use(params);
  const router = useRouter();

  // 날짜 포맷
  const formattedDate = new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="식단 관리" />

      <div className="flex flex-col items-center justify-center gap-6 p-8 mt-12">
        {/* 아이콘 */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <Utensils className="w-12 h-12 text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* 텍스트 */}
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
          <h2 className="text-xl font-bold text-foreground">
            식단 관리 준비중
          </h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            곧 AI 영양사와 함께 맞춤형 식단을 계획하고 영양 정보를 관리할 수
            있어요.
          </p>
        </div>

        {/* 예정 기능 안내 */}
        <div className="w-full max-w-sm bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">출시 예정 기능</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              맞춤형 칼로리 및 영양소 계획
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              식사별 메뉴 추천
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              영양 섭취 트래킹
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              운동 목표 연동 식단 최적화
            </li>
          </ul>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/routine')}>
            돌아가기
          </Button>
          <Button onClick={() => router.push('/routine/chat?purpose=meal')}>
            AI와 대화하기
          </Button>
        </div>
      </div>
    </div>
  );
}
