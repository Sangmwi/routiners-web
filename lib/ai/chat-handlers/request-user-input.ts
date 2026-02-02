/**
 * Request User Input Handler
 *
 * request_user_input 도구 처리
 * 사용자에게 선택형 입력 UI를 표시
 *
 * Phase 9: 메시지 기반 트랜지언트 UI
 * - 입력 요청 카드를 chat_messages 테이블에 저장
 * - content_type: 'input_request'
 * - 액션 후에도 히스토리에서 확인 가능
 *
 * Phase 20: Zod 런타임 검증 추가 (B안)
 * - AI 응답 타입 보장
 * - 검증 실패 시 에러 메시지 저장 (fallback UI)
 */

import { z } from 'zod';
import { executeRequestUserInput } from '@/lib/ai/executors';
import type { ToolHandlerContext, ToolHandlerResult, FunctionCallInfo } from './types';
import type { InputRequestType, InputRequestOption, InputRequestSliderConfig } from '@/lib/types/fitness';

// =============================================================================
// Zod Schema (Phase 20: B안 - 런타임 검증)
// =============================================================================

const InputRequestOptionSchema = z.object({
  value: z.string().min(1, 'value는 빈 문자열이 될 수 없습니다'),
  label: z.string().min(1, 'label은 빈 문자열이 될 수 없습니다'),
});

const SliderConfigSchema = z.object({
  min: z.number(),
  max: z.number(),
  step: z.number().positive('step은 양수여야 합니다'),
  unit: z.string(),
  defaultValue: z.number().optional(),
});

const RequestUserInputArgsSchema = z.object({
  message: z.string().optional(),
  type: z.enum(['radio', 'checkbox', 'slider']),
  options: z.array(InputRequestOptionSchema).nullable().optional(),
  sliderConfig: SliderConfigSchema.nullable().optional(),
}).superRefine((data, ctx) => {
  // radio/checkbox는 options 필수
  if ((data.type === 'radio' || data.type === 'checkbox')) {
    if (!data.options || data.options.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${data.type} 타입은 options 배열이 필수입니다 (최소 1개 이상)`,
        path: ['options'],
      });
    }
  }
  // slider는 sliderConfig 필수
  if (data.type === 'slider') {
    if (!data.sliderConfig) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'slider 타입은 sliderConfig가 필수입니다',
        path: ['sliderConfig'],
      });
    }
  }
});

interface RequestUserInputArgs {
  message?: string;
  type: InputRequestType;
  options?: InputRequestOption[] | null;
  sliderConfig?: InputRequestSliderConfig | null;
}

export async function handleRequestUserInput(
  fc: FunctionCallInfo,
  args: RequestUserInputArgs,
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  // Phase 20: Zod 런타임 검증 (B안)
  const parseResult = RequestUserInputArgsSchema.safeParse(args);

  if (!parseResult.success) {
    const errorMessage = parseResult.error.errors.map(e => e.message).join(', ');
    console.error('[request_user_input] Zod validation failed:', {
      errors: parseResult.error.errors,
      args,
    });

    // 검증 실패 시에도 에러 메시지를 저장하여 UI에 표시
    await ctx.supabase.from('chat_messages').insert({
      conversation_id: ctx.conversationId,
      sender_id: null,
      role: 'assistant',
      content: `입력 요청 오류: ${errorMessage}`,
      content_type: 'text',
    });

    ctx.sendEvent('tool_done', {
      toolCallId: fc.id,
      name: 'request_user_input',
      success: false,
      error: errorMessage,
    });

    return {
      toolResult: JSON.stringify({
        success: false,
        error: errorMessage,
        hint: 'radio/checkbox 타입은 options 배열 필수, slider 타입은 sliderConfig 필수',
      }),
      continueLoop: true, // AI가 재시도하도록
    };
  }

  // null을 undefined로 변환 (executor 호환성)
  const validatedArgs = {
    ...parseResult.data,
    options: parseResult.data.options ?? undefined,
    sliderConfig: parseResult.data.sliderConfig ?? undefined,
  };

  const inputResult = executeRequestUserInput(validatedArgs, fc.id);

  let messageId: string | undefined;

  // message가 있으면 별도 text 메시지로 저장 (카드와 분리)
  if (args.message?.trim()) {
    await ctx.supabase.from('chat_messages').insert({
      conversation_id: ctx.conversationId,
      sender_id: null,
      role: 'assistant',
      content: args.message,
      content_type: 'text',
    });
  }

  // 🆕 Phase 9: 메시지 테이블에 저장 (영구 보존)
  if (inputResult.success && inputResult.data) {
    const { data: insertedMessage, error: insertError } = await ctx.supabase
      .from('chat_messages')
      .insert({
        conversation_id: ctx.conversationId,
        sender_id: null,
        role: 'assistant',
        content: JSON.stringify(inputResult.data),
        content_type: 'input_request',
        metadata: {
          status: 'pending', // 'pending' | 'submitted' | 'cancelled'
        },
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[request_user_input] Failed to save message:', insertError);
    } else {
      messageId = insertedMessage?.id;
    }

    // input_request SSE 이벤트 전송 (messageId 포함)
    ctx.sendEvent('input_request', {
      ...inputResult.data,
      messageId, // 클라이언트에서 상태 업데이트용
    });
  }

  ctx.sendEvent('tool_done', {
    toolCallId: fc.id,
    name: 'request_user_input',
    success: inputResult.success,
    data: { ...inputResult.data, messageId },
    error: inputResult.error,
  });

  return {
    toolResult: JSON.stringify({
      success: true,
      waiting_for_user: true,
      message: '사용자 입력 대기 중',
    }),
    continueLoop: false, // 사용자 입력 대기
  };
}
