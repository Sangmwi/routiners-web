import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * POST /api/signup/complete
 * Complete signup and create User record
 *
 * Body: {
 *   providerId: string;
 *   email: string;
 *   realName: string;
 *   phoneNumber: string;
 *   birthDate: string;
 *   gender: 'male' | 'female';
 *   nickname: string;
 *   enlistmentMonth: string;
 *   rank: string;
 *   unitId: string;
 *   unitName: string;
 *   specialty: string;
 * }
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Authenticated user:', authUser.id);

    const body = await request.json();
    console.log('Signup data received:', { ...body, phoneNumber: '***' });

    // Validate required fields
    const requiredFields = [
      'providerId',
      'email',
      'realName',
      'phoneNumber',
      'birthDate',
      'gender',
      'nickname',
      'enlistmentMonth',
      'rank',
      'unitId',
      'unitName',
      'specialty',
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
      }
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('provider_id', authUser.id)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // Check nickname availability
    const { data: nicknameCheck } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', body.nickname)
      .maybeSingle();

    if (nicknameCheck) {
      return NextResponse.json({ error: 'Nickname already taken' }, { status: 409 });
    }

    // Parse rank and rank_grade from combined format (e.g., "이병-1호봉" -> rank: "private", rank_grade: 1)
    const rankMap: Record<string, string> = {
      '이병': 'private',
      '일병': 'private_first_class',
      '상병': 'corporal',
      '병장': 'sergeant',
    };

    const [rankKorean, gradeStr] = body.rank.split('-');
    const rankGrade = parseInt(gradeStr.replace('호봉', ''));
    const rankEnum = rankMap[rankKorean];

    if (!rankEnum || !rankGrade) {
      return NextResponse.json({ error: 'Invalid rank format' }, { status: 400 });
    }

    // Convert enlistment month to full date (YYYY-MM -> YYYY-MM-01)
    const enlistmentDate = body.enlistmentMonth.includes('-')
      ? `${body.enlistmentMonth}-01`
      : body.enlistmentMonth;

    // Create user record (transform camelCase to snake_case)
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        provider_id: body.providerId,
        email: body.email,
        real_name: body.realName,
        phone_number: body.phoneNumber,
        birth_date: body.birthDate,
        gender: body.gender,
        nickname: body.nickname,
        enlistment_month: enlistmentDate,
        rank: rankEnum,
        rank_grade: rankGrade,
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

    // Transform response to camelCase and reconstruct rank format
    const rankKoreanMap: Record<string, string> = {
      'private': '이병',
      'private_first_class': '일병',
      'corporal': '상병',
      'sergeant': '병장',
    };

    // Convert enlistment_month back to YYYY-MM format (from YYYY-MM-DD)
    const enlistmentMonthFormatted = newUser.enlistment_month
      ? newUser.enlistment_month.substring(0, 7) // "2023-06-01" -> "2023-06"
      : newUser.enlistment_month;

    const transformedUser = {
      id: newUser.id,
      providerId: newUser.provider_id,
      email: newUser.email,
      realName: newUser.real_name,
      phoneNumber: newUser.phone_number,
      birthDate: newUser.birth_date,
      gender: newUser.gender,
      nickname: newUser.nickname,
      enlistmentMonth: enlistmentMonthFormatted,
      rank: `${rankKoreanMap[newUser.rank]}-${newUser.rank_grade}호봉`,
      unitId: newUser.unit_id,
      unitName: newUser.unit_name,
      specialty: newUser.specialty,
      createdAt: newUser.created_at,
      updatedAt: newUser.updated_at,
    };

    return NextResponse.json(transformedUser, { status: 201 });
  } catch (error) {
    console.error('Error completing signup:', error);
    console.error('Error type:', typeof error);
    console.error('Error stringified:', JSON.stringify(error, null, 2));

    // Return detailed error in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : JSON.stringify(error),
          errorType: typeof error,
          errorKeys: error ? Object.keys(error) : [],
          stack: error instanceof Error ? error.stack : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


