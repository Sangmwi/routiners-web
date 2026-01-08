import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { withAuth } from '@/utils/supabase/auth';
import {
  InBodyExtractedDataSchema,
  transformExtractedToCreateData,
} from '@/lib/types/inbody';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Responses API용 JSON Schema
// strict 모드에서는 모든 properties가 required에 포함되어야 함
// 선택적 필드는 type: ['number', 'null'] 형태로 nullable 처리
const INBODY_JSON_SCHEMA = {
  type: 'object' as const,
  properties: {
    // 이미지 유효성 검사 필드
    is_valid_inbody: {
      type: 'boolean' as const,
      description:
        '이 이미지가 InBody 측정 결과지인지 여부. InBody 결과지가 아니면 false',
    },
    rejection_reason: {
      type: ['string', 'null'] as const,
      description:
        'is_valid_inbody가 false인 경우 거부 사유. 예: "음식 사진입니다", "체중계 사진입니다"',
    },
    // 측정 데이터 필드
    measured_at: {
      type: ['string', 'null'] as const,
      description: '측정일 (YYYY-MM-DD 형식). is_valid_inbody가 false면 null',
    },
    weight: {
      type: ['number', 'null'] as const,
      description: '체중 (kg 단위, 숫자만). is_valid_inbody가 false면 null',
    },
    skeletal_muscle_mass: {
      type: ['number', 'null'] as const,
      description: '골격근량 (kg 단위, 숫자만). is_valid_inbody가 false면 null',
    },
    body_fat_percentage: {
      type: ['number', 'null'] as const,
      description: '체지방률 (% 단위, 숫자만). is_valid_inbody가 false면 null',
    },
    bmi: {
      type: ['number', 'null'] as const,
      description: 'BMI (체질량지수, 숫자만). 없으면 null',
    },
    inbody_score: {
      type: ['integer', 'null'] as const,
      description: '인바디 점수 (0-100 정수). 없으면 null',
    },
    total_body_water: {
      type: ['number', 'null'] as const,
      description: '체수분 (L 단위). 없으면 null',
    },
    protein: {
      type: ['number', 'null'] as const,
      description: '단백질 (kg 단위). 없으면 null',
    },
    minerals: {
      type: ['number', 'null'] as const,
      description: '무기질 (kg 단위). 없으면 null',
    },
    body_fat_mass: {
      type: ['number', 'null'] as const,
      description: '체지방량 (kg 단위). 없으면 null',
    },
    right_arm_muscle: {
      type: ['number', 'null'] as const,
      description: '오른팔 근육량 (kg). 없으면 null',
    },
    left_arm_muscle: {
      type: ['number', 'null'] as const,
      description: '왼팔 근육량 (kg). 없으면 null',
    },
    trunk_muscle: {
      type: ['number', 'null'] as const,
      description: '몸통 근육량 (kg). 없으면 null',
    },
    right_leg_muscle: {
      type: ['number', 'null'] as const,
      description: '오른다리 근육량 (kg). 없으면 null',
    },
    left_leg_muscle: {
      type: ['number', 'null'] as const,
      description: '왼다리 근육량 (kg). 없으면 null',
    },
    right_arm_fat: {
      type: ['number', 'null'] as const,
      description: '오른팔 체지방량 (kg). 없으면 null',
    },
    left_arm_fat: {
      type: ['number', 'null'] as const,
      description: '왼팔 체지방량 (kg). 없으면 null',
    },
    trunk_fat: {
      type: ['number', 'null'] as const,
      description: '몸통 체지방량 (kg). 없으면 null',
    },
    right_leg_fat: {
      type: ['number', 'null'] as const,
      description: '오른다리 체지방량 (kg). 없으면 null',
    },
    left_leg_fat: {
      type: ['number', 'null'] as const,
      description: '왼다리 체지방량 (kg). 없으면 null',
    },
  },
  required: [
    'is_valid_inbody',
    'rejection_reason',
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

// 시스템 프롬프트
const SYSTEM_INSTRUCTIONS = `당신은 InBody 측정 결과지에서 데이터를 추출하는 전문가입니다.

## 1단계: 이미지 유효성 검사
먼저 이미지가 InBody 측정 결과지인지 판단하세요.

InBody 결과지의 특징:
- "InBody", "체성분분석", "Body Composition" 등의 텍스트가 있음
- 체중, 골격근량, 체지방률 등의 측정값이 표 형태로 정리됨
- 부위별 근육량/체지방량 분석이 포함될 수 있음

InBody 결과지가 아닌 경우:
- is_valid_inbody: false
- rejection_reason: 거부 사유를 간단히 한국어로 작성 (예: "음식 사진입니다", "체중계 사진입니다")
- 나머지 필드는 모두 null

## 2단계: 데이터 추출 (유효한 InBody 결과지인 경우)
is_valid_inbody: true로 설정하고, rejection_reason: null로 설정한 후 아래 정보를 추출하세요.

필수 항목:
- measured_at: 측정일 (YYYY-MM-DD 형식으로 변환)
- weight: 체중 (kg)
- skeletal_muscle_mass: 골격근량 (kg)
- body_fat_percentage: 체지방률 (%)

선택 항목 (있는 경우에만, 없으면 null):
- bmi: BMI (체질량지수)
- inbody_score: 인바디 점수 (0-100 정수)
- total_body_water: 체수분 (L 단위)
- protein: 단백질 (kg 단위)
- minerals: 무기질 (kg 단위)
- body_fat_mass: 체지방량 (kg 단위)
- 부위별 근육량 (kg): right_arm_muscle, left_arm_muscle, trunk_muscle, right_leg_muscle, left_leg_muscle
- 부위별 체지방량 (kg): right_arm_fat, left_arm_fat, trunk_fat, right_leg_fat, left_leg_fat

주의사항:
- 숫자만 추출하고, 단위(kg, %, L 등)는 제외하세요.
- 측정일이 없으면 오늘 날짜를 사용하세요.
- 읽을 수 없거나 불분명한 값은 null로 설정하세요.`;

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

    // OpenAI Responses API 호출 (최신 모델 지원)
    const response = await openai.responses.create({
      model: 'gpt-5.1',
      instructions: SYSTEM_INSTRUCTIONS,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: '이 InBody 결과지에서 측정 데이터를 추출해주세요.',
            },
            {
              type: 'input_image',
              image_url: `data:${mimeType};base64,${base64}`,
              detail: 'high',
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'inbody_data',
          strict: true,
          schema: INBODY_JSON_SCHEMA,
        },
      },
    });

    // Responses API는 output_text로 응답
    const content = response.output_text;
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

    // 1단계: InBody 결과지 유효성 검사
    if (parsedData.is_valid_inbody === false) {
      return NextResponse.json(
        {
          error: parsedData.rejection_reason || '인바디 결과지를 인식할 수 없습니다.',
          code: 'INVALID_IMAGE',
        },
        { status: 422 }
      );
    }

    // is_valid_inbody와 rejection_reason 필드 제거 후 Zod 검증
    const { is_valid_inbody, rejection_reason, ...extractedData } = parsedData;

    console.log('[InBody Scan] AI Response:', extractedData);

    // Zod 검증 (nullable 필드는 null 허용)
    const validationResult = InBodyExtractedDataSchema.safeParse(extractedData);
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
