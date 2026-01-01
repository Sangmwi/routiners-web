import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { transformDbUserToUser, DbUser } from '@/lib/types/user';
import { SignupCompleteSchema } from '@/lib/schemas/user.schema';
import {
  unauthorized,
  conflict,
  validationError,
  handleError,
} from '@/lib/utils/apiResponse';
import { ZodError } from 'zod';

/**
 * POST /api/signup/complete
 * Complete signup and create User record
 *
 * providerId와 email은 서버 세션에서 가져옵니다.
 * (WebView에서는 클라이언트 Supabase가 세션을 읽지 못하기 때문)
 *
 * Body: SignupCompleteSchema (see lib/schemas/user.schema.ts)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      console.error('Auth error:', authError);
      return unauthorized('로그인이 필요합니다');
    }

    console.log('Authenticated user:', authUser.id);

    // Parse and validate request body using Zod
    let body;
    try {
      const rawBody = await request.json();
      console.log('Signup data received:', { ...rawBody, phoneNumber: '***' });
      body = SignupCompleteSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof ZodError) {
        return validationError(error);
      }
      throw error;
    }

    // providerId와 email은 서버 세션에서 가져옴
    const providerId = authUser.id;
    const email = authUser.email || '';

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('provider_id', authUser.id)
      .maybeSingle();

    if (existingUser) {
      return conflict('이미 가입된 사용자입니다');
    }

    // Check nickname availability
    const { data: nicknameCheck } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', body.nickname)
      .maybeSingle();

    if (nicknameCheck) {
      return conflict('이미 사용 중인 닉네임입니다');
    }

    // Convert enlistment month to full date (YYYY-MM -> YYYY-MM-01)
    const enlistmentDate = body.enlistmentMonth.includes('-')
      ? `${body.enlistmentMonth}-01`
      : body.enlistmentMonth;

    // Create user record (transform camelCase to snake_case)
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        provider_id: providerId,
        email: email,
        real_name: body.realName,
        phone_number: body.phoneNumber,
        birth_date: body.birthDate,
        gender: body.gender,
        nickname: body.nickname,
        enlistment_month: enlistmentDate,
        rank: body.rank,
        unit_id: body.unitId,
        unit_name: body.unitName,
        specialty: body.specialty,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log('User created successfully:', newUser.id);

    // Use centralized transformer
    const transformedUser = transformDbUserToUser(newUser as DbUser);

    return NextResponse.json(transformedUser, { status: 201 });
  } catch (error) {
    console.error('Error completing signup:', error);
    return handleError(error, '/api/signup/complete');
  }
}
