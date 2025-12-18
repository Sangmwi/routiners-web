interface GreetingSectionProps {
  nickname: string;
}

export default function GreetingSection({ nickname }: GreetingSectionProps) {
  return (
    <section className="mb-6">
      <h1 className="text-2xl font-bold text-green-900">
        환영합니다, {nickname}님!
      </h1>
    </section>
  );
}

