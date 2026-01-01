import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { withAuth } from '@/utils/supabase/auth';
import { badRequest, internalError } from '@/lib/utils/apiResponse';

/**
 * POST /api/upload/profile-image
 *
 * 프로필 이미지를 Storage에만 업로드 (DB 저장 없음)
 * 저장하기 버튼 클릭 시 PATCH /api/user/profile에서 일괄 저장
 *
 * Request Body (FormData):
 * - file: File
 *
 * @returns { url: string }
 */
export const POST = withAuth(async (request: NextRequest, { authUser, supabase }) => {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return badRequest('파일이 필요합니다');
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return badRequest('JPEG, PNG, WebP 형식만 허용됩니다');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return badRequest('파일 크기는 5MB 이하여야 합니다');
  }

  // Generate unique filename (UUID로 충돌 방지)
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const fileExt = mimeToExt[file.type] || file.name.split('.').pop() || 'jpg';
  const fileName = `${authUser.id}/${randomUUID()}.${fileExt}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('profile-images')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('[Image Upload Error]', uploadError);
    return internalError('이미지 업로드에 실패했습니다');
  }

  // Get public URL with cache-busting
  const { data: { publicUrl } } = supabase.storage
    .from('profile-images')
    .getPublicUrl(fileName);

  const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

  return NextResponse.json({ url: cacheBustedUrl });
});
