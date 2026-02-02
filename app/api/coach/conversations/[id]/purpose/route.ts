/**
 * Coach Active Purpose API
 *
 * GET    /api/coach/conversations/[id]/purpose - 활성 목적 조회
 * POST   /api/coach/conversations/[id]/purpose - 활성 목적 설정
 * DELETE /api/coach/conversations/[id]/purpose - 활성 목적 해제
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  DbCoachConversation,
  transformDbCoachConversation,
  ActivePurpose,
  CoachConversationMetadata,
} from '@/lib/types/coach';
import { z } from 'zod';

// ============================================================================
// Validation
// ============================================================================

const ActivePurposeSchema = z.object({
  activePurpose: z.object({
    type: z.literal('routine_generation'),
    stage: z.enum(['init', 'collecting_info', 'generating', 'reviewing', 'applying']),
    collectedData: z.record(z.unknown()).default({}),
    startedAt: z.string().optional(),
  }).nullable(),
});

// ============================================================================
// GET /api/coach/conversations/[id]/purpose
// ============================================================================

export const GET = withAuth(
  async (request: NextRequest, { supabase, params }) => {
    const { id } = await params;

    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('metadata')
      .eq('id', id)
      .eq('type', 'ai')
            .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '대화를 찾을 수 없습니다.', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      console.error('[Coach Purpose GET] Error:', error);
      return NextResponse.json(
        { error: '조회에 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    const metadata = conversation.metadata as CoachConversationMetadata | null;
    return NextResponse.json({
      activePurpose: metadata?.activePurpose ?? null,
    });
  }
);

// ============================================================================
// POST /api/coach/conversations/[id]/purpose
// ============================================================================

export const POST = withAuth(
  async (request: NextRequest, { supabase, params }) => {
    const { id } = await params;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const validation = ActivePurposeSchema.safeParse(body);
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

    const { activePurpose } = validation.data;

    // 현재 메타데이터 조회
    const { data: current, error: fetchError } = await supabase
      .from('conversations')
      .select('metadata')
      .eq('id', id)
      .eq('type', 'ai')
            .is('deleted_at', null)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '대화를 찾을 수 없습니다.', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      console.error('[Coach Purpose POST] Fetch Error:', fetchError);
      return NextResponse.json(
        { error: '조회에 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // 메타데이터 업데이트
    const currentMetadata = (current.metadata as CoachConversationMetadata) || {};
    const newMetadata: CoachConversationMetadata = {
      ...currentMetadata,
      activePurpose: activePurpose
        ? {
            ...activePurpose,
            startedAt: activePurpose.startedAt || new Date().toISOString(),
          }
        : null,
    };

    const { data: updated, error: updateError } = await supabase
      .from('conversations')
      .update({
        metadata: newMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[Coach Purpose POST] Update Error:', updateError);
      return NextResponse.json(
        { error: '업데이트에 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      transformDbCoachConversation(updated as DbCoachConversation)
    );
  }
);

// ============================================================================
// DELETE /api/coach/conversations/[id]/purpose
// ============================================================================

export const DELETE = withAuth(
  async (request: NextRequest, { supabase, params }) => {
    const { id } = await params;

    // 현재 메타데이터 조회
    const { data: current, error: fetchError } = await supabase
      .from('conversations')
      .select('metadata')
      .eq('id', id)
      .eq('type', 'ai')
            .is('deleted_at', null)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '대화를 찾을 수 없습니다.', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      console.error('[Coach Purpose DELETE] Fetch Error:', fetchError);
      return NextResponse.json(
        { error: '조회에 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // activePurpose + pending_preview 제거 (루틴 생성 프로세스 전체 취소)
    const currentMetadata = (current.metadata as CoachConversationMetadata) || {};
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { activePurpose: _, pending_preview: __, ...restMetadata } = currentMetadata as CoachConversationMetadata & { pending_preview?: unknown };

    const { data: updated, error: updateError } = await supabase
      .from('conversations')
      .update({
        metadata: { ...restMetadata, activePurpose: null, pending_preview: null },
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[Coach Purpose DELETE] Update Error:', updateError);
      return NextResponse.json(
        { error: '업데이트에 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      transformDbCoachConversation(updated as DbCoachConversation)
    );
  }
);
