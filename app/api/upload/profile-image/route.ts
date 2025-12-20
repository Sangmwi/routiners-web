import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';

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
    return NextResponse.json({ error: 'File is required' }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' },
      { status: 400 }
    );
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: 'File size exceeds 5MB limit' },
      { status: 400 }
    );
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${authUser.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('profile-images')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('[Image Upload Error]', uploadError);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }

  // Get public URL with cache-busting
  const { data: { publicUrl } } = supabase.storage
    .from('profile-images')
    .getPublicUrl(fileName);

  const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

  return NextResponse.json({ url: cacheBustedUrl });
});
