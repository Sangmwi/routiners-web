'use client';

import { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  /** 헤더 오른쪽에 표시될 액션 버튼 */
  action?: ReactNode;
}

/**
 * 재사용 가능한 폼 섹션 컴포넌트
 * 일관된 레이아웃과 스타일을 제공합니다.
 */
export default function FormSection({ title, description, children, action }: FormSectionProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <label className="text-sm font-medium text-muted-foreground">{title}</label>
          {description && (
            <p className="text-xs text-muted-foreground/70 mt-0.5">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
