export default function CommunityPage() {
  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-green-900">커뮤니티</h1>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-xl border border-green-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-green-100"></div>
              <span className="font-medium text-sm">헬린이{i}</span>
              <span className="ml-auto text-xs text-muted-foreground">{i}시간 전</span>
            </div>
            <p className="text-green-800">오늘 운동 완료했습니다! #오운완 #삼평오</p>
          </div>
        ))}
      </div>
    </div>
  );
}

