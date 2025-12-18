'use client';

import GreetingSection from '@/components/home/GreetingSection';
import HealthScoreCard from '@/components/home/HealthScoreCard';
import SectionHeader from '@/components/home/SectionHeader';
import ProductCard from '@/components/home/ProductCard';
import InfluencerSlider from '@/components/home/InfluencerSlider';

// 더미 데이터 타입 정의
interface Product {
  id: string;
  brand: string;
  description: string;
  price: number;
  imageUrl?: string;
}

interface Influencer {
  id: string;
  author: string;
  title: string;
  imageUrl?: string;
  votes: number;
}

// 더미 데이터
const DUMMY_USER_NICKNAME = '한상휘';
const DUMMY_HEALTH_SCORE = 78;

const DUMMY_PRODUCTS: Product[] = [
  {
    id: '1',
    brand: 'Dr. Elizabeth',
    description: '테아닌과 밀크씨슬 활력 솔루션',
    price: 25000,
  },
  {
    id: '2',
    brand: '빙그레',
    description: '요플레 프로틴 맥스',
    price: 1680,
  },
  {
    id: '3',
    brand: '매일유업',
    description: '테셀렉스 코어 프로틴 베리오트바 50gx6',
    price: 4440,
  },
  {
    id: '4',
    brand: '매일유업',
    description: '블루다이아몬드 아몬드브리즈 프로틴',
    price: 550,
  },
];

const DUMMY_INFLUENCERS: Influencer[] = [
  {
    id: '1',
    author: 'soldier_sbd500',
    title: '군인들을 위한 3대 운동 정체기 뚫는 비법',
    votes: 78,
  },
  {
    id: '2',
    author: 'fitness_warrior',
    title: '이번달 No.1 XX대 군인 랭킹',
    votes: 54,
  },
  {
    id: '3',
    author: 'gym_master',
    title: '초보자를 위한 올바른 웨이트리프팅 자세',
    votes: 92,
  },
  {
    id: '4',
    author: 'health_coach',
    title: '군대에서 실천 가능한 식단 관리법',
    votes: 67,
  },
  {
    id: '5',
    author: 'cardio_king',
    title: '유산소 운동으로 체력 기르기',
    votes: 45,
  },
  {
    id: '6',
    author: 'strength_trainer',
    title: '상체 근력 향상을 위한 루틴',
    votes: 83,
  },
];

export default function Home() {
  const handleViewHealthDetails = () => {
    // TODO: 건강 점수 상세 페이지로 이동
    console.log('건강 점수 상세 보기');
  };

  const handleViewMoreProducts = () => {
    // TODO: PX 상품 목록 페이지로 이동
    console.log('PX 상품 더보기');
  };

  const handleViewMoreInfluencers = () => {
    // TODO: 인플루언서 목록 페이지로 이동
    console.log('인플루언서 더보기');
  };

  const handleProductClick = (productId: string) => {
    // TODO: 상품 상세 페이지로 이동
    console.log('상품 클릭:', productId);
  };

  const handleInfluencerClick = (influencerId: string) => {
    // TODO: 인플루언서 상세 페이지로 이동
    console.log('인플루언서 클릭:', influencerId);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <GreetingSection nickname={DUMMY_USER_NICKNAME} />

      <HealthScoreCard score={DUMMY_HEALTH_SCORE} onViewDetails={handleViewHealthDetails} />

      <section>
        <SectionHeader
          title="이번주 PX 핫템 TOP 4 🔥🔥🔥"
          showMoreButton
          onMoreClick={handleViewMoreProducts}
        />
        <div className="grid grid-cols-2 gap-4">
          {DUMMY_PRODUCTS.map((product) => (
            <ProductCard
              key={product.id}
              brand={product.brand}
              description={product.description}
              price={product.price}
              imageUrl={product.imageUrl}
              onClick={() => handleProductClick(product.id)}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="삼플루언서"
          showMoreButton
          onMoreClick={handleViewMoreInfluencers}
        />
        <InfluencerSlider
          influencers={DUMMY_INFLUENCERS}
          onMoreClick={handleViewMoreInfluencers}
          onCardClick={handleInfluencerClick}
        />
      </section>
    </div>
  );
}
