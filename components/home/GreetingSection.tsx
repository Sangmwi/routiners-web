interface GreetingSectionProps {
  nickname: string;
}

export default function GreetingSection({ nickname }: GreetingSectionProps) {
  return <h3 className="text-md font-bold text-muted-foreground mb-4">반가워요, {nickname}님!</h3>;
}
