'use client';

interface ProfileBioSectionProps {
  bio?: string;
}

export default function ProfileBioSection({ bio }: ProfileBioSectionProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-card-foreground">소개</h2>
      {bio ? (
        <p className="text-sm text-card-foreground/90 leading-relaxed whitespace-pre-line">
          {bio}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          소개글이 없습니다
        </p>
      )}
    </div>
  );
}
