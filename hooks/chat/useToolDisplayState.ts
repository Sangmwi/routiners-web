'use client';

import { useState, useEffect, useRef } from 'react';
import type { AIToolStatus } from '@/lib/types/fitness';
import type { ChatMessage } from '@/lib/types/chat';

interface ToolDisplayState {
  /** 표시할 도구 목록 (fade-out 중에도 유지) */
  displayedTools: AIToolStatus[];
  /** fade-out 애니메이션 진행 중 여부 */
  toolsFadingOut: boolean;
}

/**
 * 도구 상태 표시 관리 훅
 *
 * @description
 * AI 도구 실행 상태를 누적하고, 스트리밍 종료 또는 새 메시지 시
 * fade-out 애니메이션 후 클리어합니다.
 *
 * @param activeTools - 현재 실행 중인 도구들
 * @param streamingContent - 스트리밍 콘텐츠 (종료 감지용)
 * @param messages - 메시지 목록 (새 사용자 메시지 감지용)
 */
export function useToolDisplayState(
  activeTools: AIToolStatus[],
  streamingContent: string | undefined,
  messages: ChatMessage[]
): ToolDisplayState {
  const [toolHistory, setToolHistory] = useState<AIToolStatus[]>([]);
  const [displayedTools, setDisplayedTools] = useState<AIToolStatus[]>([]);
  const [toolsFadingOut, setToolsFadingOut] = useState(false);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevStreamingRef = useRef(false);

  // activeTools 변경 시 누적
  useEffect(() => {
    if (activeTools.length > 0) {
      // 새 도구 추가 시 fade-out 취소하고 즉시 표시
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = null;
      }
      setToolsFadingOut(false);

      setToolHistory((prev) => {
        const newTools = [...prev];
        for (const tool of activeTools) {
          const existingIndex = newTools.findIndex(
            (t) => t.toolCallId === tool.toolCallId
          );
          if (existingIndex >= 0) {
            newTools[existingIndex] = tool;
          } else {
            newTools.push(tool);
          }
        }
        return newTools;
      });
    }
  }, [activeTools]);

  // toolHistory → displayedTools 동기화 (fade-out 고려)
  useEffect(() => {
    if (toolHistory.length > 0) {
      setDisplayedTools(toolHistory);
    }
  }, [toolHistory]);

  // 스트리밍 종료 시 fade-out 시작
  useEffect(() => {
    const wasStreaming = prevStreamingRef.current;
    const isNowStreaming = !!streamingContent;
    prevStreamingRef.current = isNowStreaming;

    // 스트리밍 → 종료 전환 시 fade-out 시작
    if (wasStreaming && !isNowStreaming && displayedTools.length > 0) {
      setToolsFadingOut(true);
      fadeTimeoutRef.current = setTimeout(() => {
        setDisplayedTools([]);
        setToolHistory([]);
        setToolsFadingOut(false);
      }, 500);
    }
  }, [streamingContent, displayedTools.length]);

  // 새 사용자 메시지 시: fade-out 후 클리어
  const lastUserMessageId = messages.filter((m) => m.role === 'user').pop()?.id;
  const prevLastUserMessageIdRef = useRef(lastUserMessageId);
  useEffect(() => {
    if (prevLastUserMessageIdRef.current !== lastUserMessageId) {
      prevLastUserMessageIdRef.current = lastUserMessageId;

      // 표시 중인 도구가 있으면 fade-out 후 클리어
      if (displayedTools.length > 0) {
        if (fadeTimeoutRef.current) {
          clearTimeout(fadeTimeoutRef.current);
        }
        setToolsFadingOut(true);
        fadeTimeoutRef.current = setTimeout(() => {
          setDisplayedTools([]);
          setToolHistory([]);
          setToolsFadingOut(false);
        }, 300); // 새 메시지 시에는 빠르게
      } else {
        setToolHistory([]);
      }
    }
  }, [lastUserMessageId, displayedTools.length]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  return { displayedTools, toolsFadingOut };
}
