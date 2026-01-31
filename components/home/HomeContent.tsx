'use client';

import { useCurrentUserProfileSuspense } from '@/hooks/profile';
import GreetingSection from '@/components/home/GreetingSection';
import HealthScoreCard from '@/components/home/HealthScoreCard';
import SectionHeader from '@/components/ui/SectionHeader';
import ProductSlider from '@/components/home/ProductSlider';
import InfluencerSlider from '@/components/home/InfluencerSlider';
import { Product, Influencer } from '@/lib/types';

// 더미 데이터
const DUMMY_HEALTH_SCORE = 78;

const DUMMY_PRODUCTS: Product[] = [
  { id: '1', brand: 'Dr. Elizabeth', name: '테아닌과 밀크씨슬 활력 솔루션', price: 25000 },
  { id: '2', brand: '빙그레', name: '요플레 프로틴 맥스', price: 1680 },
  { id: '3', brand: '매일유업', name: '테셀렉스 코어 프로틴 베리오트바 50gx6', price: 4440 },
  { id: '4', brand: '매일유업', name: '블루다이아몬드 아몬드브리즈 프로틴', price: 550 },
  { id: '5', brand: '남양유업', name: '맛있는 우유 GT 단백질', price: 2200 },
  { id: '6', brand: '오뚜기', name: '3분 카레 매운맛', price: 1500 },
  { id: '7', brand: '롯데', name: '칸쵸 오리지널', price: 1200 },
  { id: '8', brand: 'CJ제일제당', name: '백설 햇반', price: 1800 },
  { id: '9', brand: '농심', name: '신라면 블랙', price: 1300 },
  { id: '10', brand: '해태', name: '허니버터칩', price: 1600 },
];

const DUMMY_INFLUENCERS: Influencer[] = [
  { id: '1', author: 'soldier_sbd500', title: '군인들을 위한 3대 운동 정체기 뚫는 비법', votes: 78 },
  { id: '2', author: 'fitness_warrior', title: '이번달 No.1 XX대 군인 랭킹', votes: 54 },
  { id: '3', author: 'gym_master', title: '초보자를 위한 올바른 웨이트리프팅 자세', votes: 92 },
  { id: '4', author: 'health_coach', title: '군대에서 실천 가능한 식단 관리법', votes: 67 },
  { id: '5', author: 'cardio_king', title: '유산소 운동으로 체력 기르기', votes: 45 },
  { id: '6', author: 'strength_trainer', title: '상체 근력 향상을 위한 루틴', votes: 83 },
  { id: '7', author: 'muscle_builder', title: '벌크업 시즌 최적의 영양제 조합', votes: 61 },
  { id: '8', author: 'endurance_pro', title: '체력검정 만점 받는 훈련법', votes: 88 },
  { id: '9', author: 'diet_expert', title: '군 복무 중 체중 감량 성공 후기', votes: 72 },
  { id: '10', author: 'pt_specialist', title: '아침 PT 전 꼭 해야 할 스트레칭', votes: 56 },
];

/**
 * 홈 페이지 콘텐츠 (Suspense 내부)
 *
 * - useSuspenseQuery로 사용자 프로필 조회
 * - 상위 page.tsx의 Suspense boundary에서 로딩 처리
 */
export default function HomeContent() {
  const { data: user } = useCurrentUserProfileSuspense();

  const handleViewHealthDetails = () => {
    console.log('건강 점수 상세 보기');
  };

  const handleViewMoreProducts = () => {
    console.log('PX 상품 더보기');
  };

  const handleViewMoreInfluencers = () => {
    console.log('인플루언서 더보기');
  };

  const handleProductClick = (productId: string) => {
    console.log('상품 클릭:', productId);
  };

  const handleInfluencerClick = (influencerId: string) => {
    console.log('인플루언서 클릭:', influencerId);
  };

  return (
    <>
      <section>
        <GreetingSection nickname={user?.nickname || '사용자'} />
        <HealthScoreCard score={DUMMY_HEALTH_SCORE} onViewDetails={handleViewHealthDetails} />
      </section>

      <section>
        <SectionHeader
          title="이주의 PX 핫템 🔥"
          action={{ label: '더 보기', onClick: handleViewMoreProducts }}
          className="mb-4"
        />
        <ProductSlider products={DUMMY_PRODUCTS} onCardClick={handleProductClick} />
      </section>

      <section>
        <SectionHeader
          title="이주의 인플루언서"
          action={{ label: '더 보기', onClick: handleViewMoreInfluencers }}
          className="mb-4"
        />
        <InfluencerSlider influencers={DUMMY_INFLUENCERS} onCardClick={handleInfluencerClick} />
      </section>
    </>
  );
}
