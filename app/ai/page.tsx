export default function AIPage() {
  return (
    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <h1 className="mb-4 text-2xl font-bold text-green-900">AI 트레이너</h1>
      <p className="text-muted-foreground">AI가 당신의 운동을 분석하고 코칭해줍니다.</p>
      <div className="mt-8 flex h-40 w-full items-center justify-center rounded-2xl bg-green-100">
        <span className="text-green-400">Camera View / Chat UI</span>
      </div>
    </div>
  );
}

