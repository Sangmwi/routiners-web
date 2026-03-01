'use client';

import { useState, useRef } from 'react';
import type { InBodyCreateData } from '@/lib/types/inbody';

interface UseInBodyScanStreamOptions {
  onComplete: (createData: InBodyCreateData) => void;
  onError: (message: string) => void;
}

interface InBodyScanStream {
  start: (file: File) => Promise<void>;
  abort: () => void;
  progress: number;
  message: string;
  isScanning: boolean;
}

/**
 * 인바디 결과지 스캔 SSE 스트림 훅
 *
 * /api/inbody/scan 엔드포인트에 이미지를 전송하고
 * SSE progress/complete/error 이벤트를 소비.
 *
 * InBodyScanModal에서 SSE 관심사 분리 목적으로 추출됨.
 */
export function useInBodyScanStream({
  onComplete,
  onError,
}: UseInBodyScanStreamOptions): InBodyScanStream {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const start = async (file: File) => {
    setProgress(0);
    setMessage('이미지 업로드 중...');
    setIsScanning(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/inbody/scan', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '스캔에 실패했어요.');
      }

      if (!response.body) {
        throw new Error('스트리밍 응답을 받을 수 없습니다.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() || '';

        for (const chunk of chunks) {
          if (!chunk.trim()) continue;

          const eventMatch = chunk.match(/^event: (.+)\ndata: (.+)$/m);
          if (!eventMatch) continue;

          const [, event, data] = eventMatch;
          const parsed = JSON.parse(data);

          switch (event) {
            case 'progress':
              setProgress(parsed.progress);
              setMessage(parsed.message);
              break;
            case 'complete':
              setProgress(100);
              setMessage('완료!');
              await new Promise((resolve) => setTimeout(resolve, 300));
              onComplete(parsed.createData);
              setIsScanning(false);
              return;
            case 'error':
              throw new Error(parsed.error);
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setIsScanning(false);
        return;
      }
      onError(err instanceof Error ? err.message : '스캔 중 오류가 발생했어요.');
      setIsScanning(false);
    } finally {
      abortRef.current = null;
    }
  };

  const abort = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsScanning(false);
    setProgress(0);
    setMessage('');
  };

  return { start, abort, progress, message, isScanning };
}
