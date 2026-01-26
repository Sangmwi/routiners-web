import HomeClient from '@/components/home/HomeClient';

// 정적 생성 방지 - 클라이언트 데이터 필요
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return <HomeClient />;
}
