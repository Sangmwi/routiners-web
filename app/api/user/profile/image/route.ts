import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';

const MAX_PROFILE_IMAGES = 4;

/**
 * POST /api/user/profile/image
 *
 * 프로필 이미지 업로드
 *
 * Request Body (FormData):
 * - file: File
 * - index: number (0-3, position in profile_images array)
 *
 * @returns { url: string, index: number, profileImages: string[] }
 */
export const POST = withAuth(async (request: NextRequest, { authUser, supabase }) => {
  // Get current user profile
  const { data: currentUser, error: userError } = await supabase
    .from('users')
    .select('id, profile_images')
    .eq('provider_id', authUser.id)
    .single();

  if (userError || !currentUser) {
    return NextResponse.json(
      { error: 'User profile not found' },
      { status: 404 }
    );
  }

  // Parse multipart form data
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const indexStr = formData.get('index') as string;
  const index = parseInt(indexStr, 10);

  if (!file) {
    return NextResponse.json(
      { error: 'File is required' },
      { status: 400 }
    );
  }

  if (isNaN(index) || index < 0 || index >= MAX_PROFILE_IMAGES) {
    return NextResponse.json(
      { error: `Invalid index. Must be 0-${MAX_PROFILE_IMAGES - 1}` },
      { status: 400 }
    );
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
  // IMPORTANT: Use authUser.id (auth.uid) to match RLS policy
  const fileExt = file.name.split('.').pop();
  const fileName = `${authUser.id}/photo-${index}-${Date.now()}.${fileExt}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('profile-images')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('[Image Upload Error]', uploadError);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('profile-images').getPublicUrl(fileName);

  // Add cache-busting query parameter to force CDN/browser to fetch new image
  const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

  // Update profile_images array in database
  const currentImages: string[] = currentUser.profile_images || [];
  const newImages = [...currentImages];

  // Ensure array has enough slots
  while (newImages.length <= index) {
    newImages.push('');
  }

  // Set the image at the specified index
  newImages[index] = cacheBustedUrl;

  // Filter out empty strings and limit to MAX_PROFILE_IMAGES
  const finalImages = newImages.filter(Boolean).slice(0, MAX_PROFILE_IMAGES);

  // Update database
  const { error: updateError } = await supabase
    .from('users')
    .update({
      profile_images: finalImages,
      updated_at: new Date().toISOString(),
    })
    .eq('provider_id', authUser.id);

  if (updateError) {
    console.error('[Profile Update Error]', updateError);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    url: cacheBustedUrl,
    index,
    profileImages: finalImages,
  });
});

/**
 * DELETE /api/user/profile/image
 *
 * 프로필 이미지 삭제
 *
 * Request Body:
 * - imageUrl: string (the image URL to delete)
 *
 * @returns { success: boolean, profileImages: string[] }
 */
export const DELETE = withAuth(async (request: NextRequest, { authUser, supabase }) => {
  // Get current user profile
  const { data: currentUser, error: userError } = await supabase
    .from('users')
    .select('id, profile_images')
    .eq('provider_id', authUser.id)
    .single();

  if (userError || !currentUser) {
    return NextResponse.json(
      { error: 'User profile not found' },
      { status: 404 }
    );
  }

  // Parse request body
  const body = await request.json();
  const { imageUrl } = body;

  if (!imageUrl) {
    return NextResponse.json(
      { error: 'imageUrl is required' },
      { status: 400 }
    );
  }

  // Extract file path from URL (remove query params first)
  const urlWithoutParams = imageUrl.split('?')[0];
  const urlParts = urlWithoutParams.split('/profile-images/');
  if (urlParts.length !== 2) {
    return NextResponse.json(
      { error: 'Invalid image URL' },
      { status: 400 }
    );
  }

  const filePath = urlParts[1];

  // Verify ownership (file path should start with auth user ID)
  // IMPORTANT: Use authUser.id (auth.uid) to match RLS policy
  if (!filePath.startsWith(authUser.id)) {
    return NextResponse.json(
      { error: 'Unauthorized to delete this image' },
      { status: 403 }
    );
  }

  // Delete from storage
  const { error: deleteError } = await supabase.storage
    .from('profile-images')
    .remove([filePath]);

  if (deleteError) {
    console.error('[Image Delete Error]', deleteError);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }

  // Remove from profile_images array (compare without query params)
  const currentImages: string[] = currentUser.profile_images || [];
  const newImages = currentImages.filter(img => {
    const imgWithoutParams = img.split('?')[0];
    return imgWithoutParams !== urlWithoutParams;
  });

  // Update database
  const { error: updateError } = await supabase
    .from('users')
    .update({
      profile_images: newImages,
      updated_at: new Date().toISOString(),
    })
    .eq('provider_id', authUser.id);

  if (updateError) {
    console.error('[Profile Update Error]', updateError);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    profileImages: newImages,
  });
});

/**
 * PUT /api/user/profile/image
 *
 * 프로필 이미지 순서 변경 (드래그 앤 드롭)
 *
 * Request Body:
 * - profileImages: string[] (new order of images)
 *
 * @returns { success: boolean, profileImages: string[] }
 */
export const PUT = withAuth(async (request: NextRequest, { authUser, supabase }) => {
  // Get current user profile
  const { data: currentUser, error: userError } = await supabase
    .from('users')
    .select('id, profile_images')
    .eq('provider_id', authUser.id)
    .single();

  if (userError || !currentUser) {
    return NextResponse.json(
      { error: 'User profile not found' },
      { status: 404 }
    );
  }

  // Parse request body
  const body = await request.json();
  const { profileImages } = body;

  if (!Array.isArray(profileImages)) {
    return NextResponse.json(
      { error: 'profileImages must be an array' },
      { status: 400 }
    );
  }

  // Validate: all URLs should belong to current user
  const currentImages: string[] = currentUser.profile_images || [];
  const currentImageSet = new Set(currentImages.map(img => img.split('?')[0]));

  for (const img of profileImages) {
    const imgWithoutParams = img.split('?')[0];
    if (!currentImageSet.has(imgWithoutParams)) {
      return NextResponse.json(
        { error: 'Invalid image URL in array' },
        { status: 400 }
      );
    }
  }

  // Limit to MAX_PROFILE_IMAGES
  const finalImages = profileImages.slice(0, MAX_PROFILE_IMAGES);

  // Update database
  const { error: updateError } = await supabase
    .from('users')
    .update({
      profile_images: finalImages,
      updated_at: new Date().toISOString(),
    })
    .eq('provider_id', authUser.id);

  if (updateError) {
    console.error('[Profile Update Error]', updateError);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    profileImages: finalImages,
  });
});
