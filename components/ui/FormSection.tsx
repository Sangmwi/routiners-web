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
    <section className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-card-foreground">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
