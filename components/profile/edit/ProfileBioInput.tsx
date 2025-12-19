'use client';

import { useState } from 'react';

interface ProfileBioInputProps {
  defaultValue?: string;
}

export default function ProfileBioInput({ defaultValue = '' }: ProfileBioInputProps) {
  const [bio, setBio] = useState(defaultValue || '');
  const maxLength = 500;

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-card-foreground">소개</h2>
      <p className="text-xs text-muted-foreground">
        나를 잘 표현할 수 있는 소개글을 작성해 보세요! 같이 운동할 사람을 찾고 있다면 이곳에서 만들어보세요!
      </p>

      <div className="relative">
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={maxLength}
          placeholder="소개글을 입력하세요..."
          className="w-full h-32 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm text-card-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
        <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
          {(bio || '').length}/{maxLength}
        </div>
      </div>
    </section>
  );
}
