export default function ProfilePage() {
  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-khaki-900">내 프로필</h1>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
         <div className="flex flex-col items-center gap-4">
            <div className="h-24 w-24 rounded-full bg-khaki-300"></div>
            <h2 className="text-xl font-bold">사용자님</h2>
            <p className="text-sm text-muted-foreground">Beginner Level</p>
         </div>
         <div className="mt-8 space-y-1">
            <button className="flex w-full justify-between rounded-lg p-3 hover:bg-khaki-50">
               <span>내 정보 수정</span>
               <span className="text-muted-foreground">&gt;</span>
            </button>
            <button className="flex w-full justify-between rounded-lg p-3 hover:bg-khaki-50">
               <span>운동 기록</span>
               <span className="text-muted-foreground">&gt;</span>
            </button>
            <button className="flex w-full justify-between rounded-lg p-3 hover:bg-khaki-50">
               <span>설정</span>
               <span className="text-muted-foreground">&gt;</span>
            </button>
         </div>
      </div>
    </div>
  );
}

