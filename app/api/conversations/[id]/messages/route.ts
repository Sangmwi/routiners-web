import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { DbChatMessage, transformDbMessage } from '@/lib/types/chat';
import { z } from 'zod';

const MessageCreateSchema = z.object({
  content: z.string().min(1, '메시지를 입력해주세요.'),
  contentType: z.enum(['text', 'image', 'file', 'audio', 'video', 'location', 'call']).default('text'),
  mediaUrl: z.string().url().optional(),
  replyToId: z.string().uuid().optional(),
});

/**
 * GET /api/conversations/[id]/messages
 * 메시지 목록 조회 (페이지네이션)
 */
export const GET = withAuth(
  async (
    request: NextRequest,
    { userId, supabase, params }
  ) => {
    const { id: conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const cursor = searchParams.get('cursor'); // created_at 기준

    // 권한 확인 (참여자인지)
    const { data: conversation } = await supabase
      .from('conversations')
      .select('type, created_by')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { error: '대화를 찾을 수 없습니다.', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // AI 대화는 생성자만
    if (conversation.type === 'ai') {
      if (conversation.created_by !== userId) {
        return NextResponse.json(
          { error: '접근 권한이 없습니다.', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    } else {
      // 일반 대화는 참여자 확인
      const { data: participant } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .is('left_at', null)
        .single();

      if (!participant) {
        return NextResponse.json(
          { error: '접근 권한이 없습니다.', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    }

    // 메시지 조회
    let query = supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit + 1); // +1 for hasMore check

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Messages GET] Error:', error);
      return NextResponse.json(
        { error: '메시지를 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    const messages = data as DbChatMessage[];
    const hasMore = messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, limit) : messages;

    // 오래된 순으로 정렬해서 반환
    const sortedMessages = resultMessages.reverse().map(transformDbMessage);

    return NextResponse.json({
      messages: sortedMessages,
      hasMore,
      nextCursor: hasMore ? resultMessages[resultMessages.length - 1].created_at : undefined,
    });
  }
);

/**
 * POST /api/conversations/[id]/messages
 * 일반 메시지 전송 (유저 간 채팅용)
 */
export const POST = withAuth(
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

    const validation = MessageCreateSchema.safeParse(body);
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

    const { content, contentType, mediaUrl, replyToId } = validation.data;

    // 대화 존재 및 권한 확인
    const { data: conversation } = await supabase
      .from('conversations')
      .select('type, created_by')
      .eq('id', conversationId)
      .is('deleted_at', null)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { error: '대화를 찾을 수 없습니다.', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // AI 대화는 생성자만
    if (conversation.type === 'ai') {
      if (conversation.created_by !== userId) {
        return NextResponse.json(
          { error: '접근 권한이 없습니다.', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    } else {
      // 일반 대화는 참여자 확인
      const { data: participant } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .is('left_at', null)
        .single();

      if (!participant) {
        return NextResponse.json(
          { error: '접근 권한이 없습니다.', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    }

    // 메시지 생성
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        role: 'user',
        content,
        content_type: contentType,
        media_url: mediaUrl || null,
        reply_to_id: replyToId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[Messages POST] Error:', error);
      return NextResponse.json(
        { error: '메시지 전송에 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // 대화 updated_at 갱신
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return NextResponse.json(transformDbMessage(data as DbChatMessage), { status: 201 });
  }
);
