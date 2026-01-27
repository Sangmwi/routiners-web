/**
 * Community Image Upload API Route
 *
 * POST /api/community/upload - 이미지 업로드
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 4;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * POST /api/community/upload
 * 이미지 업로드 (Supabase Storage)
 */
export const POST = withAuth(async (request: NextRequest, { authUser, supabase }) => {
  const formData = await request.formData();
  const files = formData.getAll('files') as File[];

  if (!files || files.length === 0) {
    return NextResponse.json(
      { error: '업로드할 파일이 없습니다.' },
      { status: 400 }
    );
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `최대 ${MAX_FILES}개의 파일만 업로드할 수 있습니다.` },
      { status: 400 }
    );
  }

  // 파일 유효성 검사
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'JPG, PNG, WebP, GIF 형식의 이미지만 업로드할 수 있습니다.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 크기는 5MB를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }
  }

  const urls: string[] = [];

  for (const file of files) {
    // 고유 파일명 생성
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).slice(2, 10);
    const ext = file.name.split('.').pop() ?? 'jpg';
    const fileName = `${authUser.id}/${timestamp}-${randomStr}.${ext}`;

    // Supabase Storage 업로드
    const { data, error } = await supabase.storage
      .from('community')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[POST /api/community/upload] Storage error:', error);
      return NextResponse.json(
        { error: '이미지 업로드에 실패했습니다.' },
        { status: 500 }
      );
    }

    // Public URL 생성
    const {
      data: { publicUrl },
    } = supabase.storage.from('community').getPublicUrl(data.path);

    urls.push(publicUrl);
  }

  return NextResponse.json({ urls });
});
