interface GreetingSectionProps {
  nickname: string;
}

export default function GreetingSection({ nickname }: GreetingSectionProps) {
  return (
    <section className="my-3">
      <h1 className="text-xl font-bold text-card-foreground/90">
        환영합니다, {nickname}님!
      </h1>
    </section>
  );
}



