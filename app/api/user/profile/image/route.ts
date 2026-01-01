import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  badRequest,
  forbidden,
  internalError,
} from '@/lib/utils/apiResponse';
import { z } from 'zod';

// Validation schema
const ImageDeleteSchema = z.object({
  imageUrl: z.string().url('유효한 이미지 URL이 필요합니다'),
});

/**
 * DELETE /api/user/profile/image
 *
 * 프로필 이미지 삭제 (Storage에서 삭제)
 *
 * 사용처: useProfileImageUpload에서 백그라운드 삭제
 * - 이미지 교체/삭제 시 기존 이미지를 Storage에서 정리
 * - DB 업데이트는 PATCH /api/user/profile에서 일괄 처리
 *
 * Request Body:
 * - imageUrl: string (삭제할 이미지 URL)
 *
 * @returns { success: boolean }
 */
export const DELETE = withAuth(async (request: NextRequest, { authUser, supabase }) => {
  // Parse and validate request body
  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest('잘못된 요청 형식입니다');
  }

  const validation = ImageDeleteSchema.safeParse(body);
  if (!validation.success) {
    return badRequest('유효한 이미지 URL이 필요합니다');
  }

  const { imageUrl } = validation.data;

  // Extract file path from URL (remove query params first)
  const urlWithoutParams = imageUrl.split('?')[0];
  const urlParts = urlWithoutParams.split('/profile-images/');
  if (urlParts.length !== 2) {
    return badRequest('잘못된 이미지 URL 형식입니다');
  }

  const filePath = urlParts[1];

  // Verify ownership (file path should start with auth user ID)
  // IMPORTANT: Use authUser.id (auth.uid) to match RLS policy
  if (!filePath.startsWith(authUser.id)) {
    return forbidden('이 이미지를 삭제할 권한이 없습니다');
  }

  // Delete from storage only (DB update is handled by PATCH /api/user/profile)
  const { error: deleteError } = await supabase.storage
    .from('profile-images')
    .remove([filePath]);

  if (deleteError) {
    console.error('[Image Delete Error]', deleteError);
    return internalError('이미지 삭제에 실패했습니다');
  }

  return NextResponse.json({ success: true });
});
