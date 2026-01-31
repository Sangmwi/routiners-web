interface GreetingSectionProps {
  nickname: string;
}

export default function GreetingSection({ nickname }: GreetingSectionProps) {
  return <h3 className="text-md font-bold text-muted-foreground mb-4">환영합니다, {nickname}님!</h3>;
}
