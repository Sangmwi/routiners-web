export default function Home() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-khaki-900">오늘의 운동</h1>
        <div className="h-10 w-10 rounded-full bg-khaki-200"></div>
      </header>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-khaki-800">활동 요약</h2>
        <div className="flex justify-between text-center">
          <div>
            <p className="text-sm text-muted-foreground">걸음 수</p>
            <p className="text-xl font-bold text-primary">5,240</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">칼로리</p>
            <p className="text-xl font-bold text-primary">320</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">운동 시간</p>
            <p className="text-xl font-bold text-primary">45분</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-khaki-800">추천 루틴</h2>
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm transition-colors hover:bg-khaki-50">
              <div className="h-16 w-16 rounded-lg bg-khaki-200"></div>
              <div>
                <h3 className="font-medium text-khaki-900">전신 지방 연소 {i}</h3>
                <p className="text-sm text-muted-foreground">20분 • 중급</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Scroll test content */}
      <section className="space-y-4">
         <h2 className="text-lg font-semibold text-khaki-800">최근 기록</h2>
         {Array.from({ length: 5 }).map((_, i) => (
           <div key={`history-${i}`} className="rounded-xl border border-khaki-200 bg-white p-4">
             <p className="font-medium">저녁 러닝</p>
             <p className="text-sm text-muted-foreground">어제</p>
           </div>
         ))}
      </section>
    </div>
  );
}
