import MainTabHeader from '@/components/common/MainTabHeader';

interface GreetingSectionProps {
  nickname: string;
}

export default function GreetingSection({ nickname }: GreetingSectionProps) {
  return <MainTabHeader title={`환영합니다, ${nickname}님!`} />;
}
