'use client';

interface ProfileInterestsTagsProps {
  interests?: string[];
}

export default function ProfileInterestsTags({ interests }: ProfileInterestsTagsProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-card-foreground">관심 종목</h2>

      {interests && interests.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {interests.map((interest, index) => (
            <div
              key={index}
              className="inline-flex items-center px-3 py-1.5 rounded-[14px] bg-muted text-xs text-card-foreground"
            >
              {interest}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          관심 종목이 없습니다
        </p>
      )}
    </div>
  );
}
