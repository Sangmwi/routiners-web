import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { withAuth } from '@/utils/supabase/auth';
import { DbConversation, DbChatMessage, transformDbMessage } from '@/lib/types/chat';
import { z } from 'zod';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 시스템 프롬프트 (purpose별)
const SYSTEM_PROMPTS: Record<'workout' | 'meal', string> = {
  workout: `당신은 "루티너스"라는 한국 군인 대상 피트니스 앱의 AI 트레이너입니다.
사용자와 대화하며 그들의 운동 목표, 현재 체력 수준, 가용 시간 등을 파악하고 맞춤형 4주 운동 루틴을 제안합니다.

## 역할
1. 친근하고 전문적인 트레이너로서 대화
2. 사용자의 운동 경험, 목표, 제약사항 파악
3. 군대 환경(제한된 장비, 시간, 공간)을 고려한 실용적인 조언
4. 4주 운동 계획 수립 및 제안

## 대화 흐름
1. 인사 및 운동 목표 파악 (근력 증가, 체중 감량, 체력 향상 등)
2. 현재 운동 경험 및 체력 수준 확인
3. 가용 시간 및 장비 확인 (헬스장 접근성, 주당 운동 가능 일수)
4. 선호하는 운동 종류 파악
5. 4주 운동 계획 제안

## 운동 계획 형식
운동 계획을 제안할 때는 다음 정보를 포함하세요:
- 운동명
- 세트 수와 반복 횟수
- 권장 중량 (초보자/중급자/고급자 기준)
- 세트 간 휴식 시간
- 운동 팁이나 주의사항

## 제약사항
- 한국어로 대화
- 군대 문화와 환경을 이해하고 존중
- 안전을 최우선으로
- 현실적이고 실행 가능한 계획 제안
- 과도한 운동량 지양`,

  meal: `당신은 "루티너스"라는 한국 군인 대상 피트니스 앱의 AI 영양사입니다.
사용자와 대화하며 그들의 식단 목표, 현재 식습관, 제약사항 등을 파악하고 맞춤형 식단을 제안합니다.

## 역할
1. 친근하고 전문적인 영양사로서 대화
2. 사용자의 식단 목표, 제약사항 파악
3. 군대 환경(군식당, 제한된 선택지)을 고려한 실용적인 조언
4. 맞춤형 식단 계획 수립 및 제안

## 대화 흐름
1. 인사 및 식단 목표 파악 (체중 감량, 근육량 증가, 건강 관리 등)
2. 현재 식습관 및 알레르기/기피 음식 확인
3. 군식당 이용 여부 및 간식 섭취 패턴 파악
4. 영양 목표 설정 (칼로리, 단백질 등)
5. 식단 계획 제안

## 식단 계획 형식
식단을 제안할 때는 다음 정보를 포함하세요:
- 식사 시간대 (아침, 점심, 저녁, 간식)
- 음식 구성
- 대략적인 칼로리와 영양소
- 실천 팁

## 제약사항
- 한국어로 대화
- 군대 환경과 문화 이해
- 현실적이고 실천 가능한 식단 제안
- 극단적인 다이어트 지양
- 영양 균형 중시`,
};

const MessageSchema = z.object({
  message: z.string().min(1, '메시지를 입력해주세요.'),
});

/**
 * POST /api/conversations/[id]/messages/ai
 * AI 채팅 메시지 전송 (SSE 스트리밍 또는 일반 응답)
 */
export const POST = withAuth<Response>(
  async (
    request: NextRequest,
    { userId, supabase, params }
  ) => {
    const { id: conversationId } = await params;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const validation = MessageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: '입력값이 유효하지 않습니다.',
          code: 'VALIDATION_ERROR',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { message } = validation.data;

    // 대화 조회 및 권한 확인
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('type', 'ai')
      .is('deleted_at', null)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: '대화를 찾을 수 없습니다.', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const conv = conversation as DbConversation;

    if (conv.created_by !== userId) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    if (conv.ai_status !== 'active') {
      return NextResponse.json(
        { error: '이미 종료된 대화입니다.', code: 'SESSION_CLOSED' },
        { status: 400 }
      );
    }

    // 기존 메시지 조회
    const { data: existingMessages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    const messages = (existingMessages as DbChatMessage[] || []).map(transformDbMessage);

    // 사용자 메시지 저장
    const { data: userMsg, error: userMsgError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        role: 'user',
        content: message,
        content_type: 'text',
      })
      .select()
      .single();

    if (userMsgError) {
      console.error('[AI Chat] User Message Error:', userMsgError);
      return NextResponse.json(
        { error: '메시지 저장에 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    const allMessages = [...messages, transformDbMessage(userMsg as DbChatMessage)];
    const purpose = conv.ai_purpose as 'workout' | 'meal';

    // 비스트리밍 요청인지 확인
    const noStream = request.headers.get('X-No-Stream') === 'true';

    if (noStream) {
      // 비스트리밍 응답
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4.1-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPTS[purpose] },
            ...allMessages.map((m) => ({
              role: m.role as 'user' | 'assistant' | 'system',
              content: m.content,
            })),
          ],
          max_tokens: 2000,
        });

        const assistantContent = response.choices[0]?.message?.content || '';

        // AI 응답 저장
        await supabase.from('chat_messages').insert({
          conversation_id: conversationId,
          sender_id: null,
          role: 'assistant',
          content: assistantContent,
          content_type: 'text',
        });

        // 대화 updated_at 갱신
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);

        return NextResponse.json({ content: assistantContent });
      } catch (error) {
        console.error('[AI Chat] OpenAI Error:', error);
        return NextResponse.json(
          { error: 'AI 응답 생성에 실패했습니다.', code: 'AI_ERROR' },
          { status: 500 }
        );
      }
    }

    // SSE 스트리밍 응답
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await openai.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages: [
              { role: 'system', content: SYSTEM_PROMPTS[purpose] },
              ...allMessages.map((m) => ({
                role: m.role as 'user' | 'assistant' | 'system',
                content: m.content,
              })),
            ],
            max_tokens: 2000,
            stream: true,
          });

          let fullContent = '';

          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          }

          // AI 응답 저장
          await supabase.from('chat_messages').insert({
            conversation_id: conversationId,
            sender_id: null,
            role: 'assistant',
            content: fullContent,
            content_type: 'text',
          });

          // 대화 updated_at 갱신
          await supabase
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId);

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('[AI Chat Stream] Error:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: 'AI 응답 생성 중 오류가 발생했습니다.' })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }
);
