import { ReactNode } from 'react';
import { LoadingSkeleton } from './LoadingSkeleton';

export interface ImageContainerProps {
  fill: boolean;
  width?: string | number;
  height?: string | number;
  loading: boolean;
  children: ReactNode;
}

/** 이미지 컨테이너 - fill/고정크기에 따른 래퍼 + 스켈레톤 처리 */
export function ImageContainer({ fill, width, height, loading, children }: ImageContainerProps) {
  if (fill) {
    return (
      <div className="absolute inset-0">
        {children}
        <LoadingSkeleton show={loading} />
      </div>
    );
  }

  return (
    <div className="relative inline-block" style={{ width, height }}>
      {children}
      <LoadingSkeleton show={loading} />
    </div>
  );
}
