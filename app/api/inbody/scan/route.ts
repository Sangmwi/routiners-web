import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { withAuth } from '@/utils/supabase/auth';
import { InBodyExtractedDataSchema, transformExtractedToCreateData } from '@/lib/types/inbody';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// OpenAI Structured Output용 JSON Schema
// strict: true 모드에서는 모든 properties가 required에 포함되어야 함
// 선택적 필드는 type: ['number', 'null'] 형태로 nullable 처리
function getInBodyJsonSchema() {
  return {
    type: 'object',
    properties: {
      measured_at: {
        type: 'string',
        description: '측정일 (YYYY-MM-DD 형식)',
      },
      weight: {
        type: 'number',
        description: '체중 (kg 단위, 숫자만)',
      },
      skeletal_muscle_mass: {
        type: 'number',
        description: '골격근량 (kg 단위, 숫자만)',
      },
      body_fat_percentage: {
        type: 'number',
        description: '체지방률 (% 단위, 숫자만)',
      },
      bmi: {
        type: ['number', 'null'],
        description: 'BMI (체질량지수, 숫자만). 없으면 null',
      },
      inbody_score: {
        type: ['integer', 'null'],
        description: '인바디 점수 (0-100 정수). 없으면 null',
      },
      total_body_water: {
        type: ['number', 'null'],
        description: '체수분 (L 단위). 없으면 null',
      },
      protein: {
        type: ['number', 'null'],
        description: '단백질 (kg 단위). 없으면 null',
      },
      minerals: {
        type: ['number', 'null'],
        description: '무기질 (kg 단위). 없으면 null',
      },
      body_fat_mass: {
        type: ['number', 'null'],
        description: '체지방량 (kg 단위). 없으면 null',
      },
      right_arm_muscle: {
        type: ['number', 'null'],
        description: '오른팔 근육량 (kg). 없으면 null',
      },
      left_arm_muscle: {
        type: ['number', 'null'],
        description: '왼팔 근육량 (kg). 없으면 null',
      },
      trunk_muscle: {
        type: ['number', 'null'],
        description: '몸통 근육량 (kg). 없으면 null',
      },
      right_leg_muscle: {
        type: ['number', 'null'],
        description: '오른다리 근육량 (kg). 없으면 null',
      },
      left_leg_muscle: {
        type: ['number', 'null'],
        description: '왼다리 근육량 (kg). 없으면 null',
      },
      right_arm_fat: {
        type: ['number', 'null'],
        description: '오른팔 체지방량 (kg). 없으면 null',
      },
      left_arm_fat: {
        type: ['number', 'null'],
        description: '왼팔 체지방량 (kg). 없으면 null',
      },
      trunk_fat: {
        type: ['number', 'null'],
        description: '몸통 체지방량 (kg). 없으면 null',
      },
      right_leg_fat: {
        type: ['number', 'null'],
        description: '오른다리 체지방량 (kg). 없으면 null',
      },
      left_leg_fat: {
        type: ['number', 'null'],
        description: '왼다리 체지방량 (kg). 없으면 null',
      },
    },
    required: [
      'measured_at',
      'weight',
      'skeletal_muscle_mass',
      'body_fat_percentage',
      'bmi',
      'inbody_score',
      'total_body_water',
      'protein',
      'minerals',
      'body_fat_mass',
      'right_arm_muscle',
      'left_arm_muscle',
      'trunk_muscle',
      'right_leg_muscle',
      'left_leg_muscle',
      'right_arm_fat',
      'left_arm_fat',
      'trunk_fat',
      'right_leg_fat',
      'left_leg_fat',
    ],
    additionalProperties: false,
  };
}

/**
 * POST /api/inbody/scan
 * InBody 결과지 이미지에서 데이터 추출 (AI Vision)
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File | null;

    if (!image) {
      return NextResponse.json(
        { error: '이미지가 제공되지 않았습니다.', code: 'MISSING_FIELD' },
        { status: 400 }
      );
    }

    // 이미지 타입 검증
    if (!image.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '유효한 이미지 파일이 아닙니다.', code: 'INVALID_FORMAT' },
        { status: 400 }
      );
    }

    // 이미지 크기 제한 (10MB)
    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: '이미지 크기는 10MB 이하여야 합니다.', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // 이미지 → base64 변환
    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = image.type;

    // OpenAI Vision API 호출
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // 비용 효율적인 모델 (o4-mini 대신 현재 사용 가능한 모델)
      messages: [
        {
          role: 'system',
          content: `당신은 InBody 측정 결과지에서 데이터를 추출하는 전문가입니다.
이미지에서 다음 정보를 정확히 추출하세요:

필수 항목:
- measured_at: 측정일 (YYYY-MM-DD 형식으로 변환)
- weight: 체중 (kg)
- skeletal_muscle_mass: 골격근량 (kg)
- body_fat_percentage: 체지방률 (%)

선택 항목 (있는 경우에만):
- bmi: BMI
- inbody_score: 인바디 점수
- total_body_water: 체수분 (L)
- protein: 단백질 (kg)
- minerals: 무기질 (kg)
- body_fat_mass: 체지방량 (kg)
- 부위별 근육량: right_arm_muscle, left_arm_muscle, trunk_muscle, right_leg_muscle, left_leg_muscle
- 부위별 체지방량: right_arm_fat, left_arm_fat, trunk_fat, right_leg_fat, left_leg_fat

주의사항:
- 숫자만 추출하고, 단위(kg, %, L 등)는 제외하세요.
- 측정일이 없으면 오늘 날짜를 사용하세요.
- 읽을 수 없거나 불분명한 값은 생략하세요.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '이 InBody 결과지에서 측정 데이터를 추출해주세요. JSON 형식으로 응답하세요.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'inbody_data',
          strict: true,
          schema: getInBodyJsonSchema(),
        },
      },
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: 'AI 응답이 없습니다.', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    // JSON 파싱
    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: 'AI 응답을 파싱할 수 없습니다.', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    // Zod 검증
    const validationResult = InBodyExtractedDataSchema.safeParse(parsedData);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: '추출된 데이터가 유효하지 않습니다. 다른 이미지를 시도해주세요.',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.flatten(),
        },
        { status: 422 }
      );
    }

    // 클라이언트용 형식으로 변환
    const createData = transformExtractedToCreateData(validationResult.data);

    return NextResponse.json({
      data: validationResult.data,
      createData,
    });
  } catch (error: unknown) {
    console.error('[InBody Scan] Error:', error);

    // OpenAI API 에러 처리
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.', code: 'SERVICE_UNAVAILABLE' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: 'AI 서비스 오류가 발생했습니다.', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: '스캔 중 오류가 발생했습니다.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});
