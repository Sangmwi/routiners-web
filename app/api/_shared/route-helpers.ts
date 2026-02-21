import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'DATABASE_ERROR';

interface ApiErrorOptions {
  status: number;
  code: ApiErrorCode;
  error: string;
  details?: unknown;
}

export function jsonError({ status, code, error, details }: ApiErrorOptions) {
  return NextResponse.json(
    {
      error,
      code,
      ...(details !== undefined ? { details } : {}),
    },
    { status },
  );
}

interface ParseJsonBodyOptions {
  allowEmpty?: boolean;
  badRequestMessage?: string;
}

export async function parseJsonBody(
  request: NextRequest,
  options: ParseJsonBodyOptions = {},
) {
  const { allowEmpty = false, badRequestMessage = '잘못된 요청 형식입니다.' } = options;

  const raw = await request.text();
  if (!raw.trim()) {
    if (allowEmpty) {
      return { ok: true as const, data: {} };
    }
    return {
      ok: false as const,
      response: jsonError({
        status: 400,
        code: 'BAD_REQUEST',
        error: badRequestMessage,
      }),
    };
  }

  try {
    return { ok: true as const, data: JSON.parse(raw) };
  } catch {
    return {
      ok: false as const,
      response: jsonError({
        status: 400,
        code: 'BAD_REQUEST',
        error: badRequestMessage,
      }),
    };
  }
}

export function validateBody<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  body: unknown,
  message = '입력값이 유효하지 않습니다.',
) {
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      ok: false as const,
      response: jsonError({
        status: 400,
        code: 'VALIDATION_ERROR',
        error: message,
        details: result.error.flatten(),
      }),
    };
  }

  return { ok: true as const, data: result.data };
}
