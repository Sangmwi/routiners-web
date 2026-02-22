'use client';

import FormSection from '@/components/ui/FormSection';

interface ProfileBioInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ProfileBioInput({ value, onChange }: ProfileBioInputProps) {
  const maxLength = 500;

  return (
    <FormSection
      title="소개"
      description="나를 잘 표현할 수 있는 소개글을 작성해 보세요!"
    >
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder="소개글을 입력하세요..."
          className="w-full h-32 px-4 py-3 rounded-xl bg-muted/20 border border-border text-sm text-card-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
        <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
          {value.length}/{maxLength}
        </div>
      </div>
    </FormSection>
  );
}
