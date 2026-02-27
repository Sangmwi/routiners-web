import { ZodError } from 'zod';

/**
 * Zod 에러 → 필드별 에러 맵 변환
 *
 * safeParse 실패 시 반복되는 forEach 보일러플레이트를 추출한 유틸리티.
 * 첫 번째 경로 세그먼트(path[0])를 필드 키로, 필드별 첫 번째 에러만 수집.
 *
 * @example
 * const result = MySchema.safeParse(data);
 * if (!result.success) {
 *   setFormErrors(collectZodErrors<keyof MyFormErrors>(result.error));
 *   return;
 * }
 */
export function collectZodErrors<TFields extends string>(
  zodError: ZodError
): Partial<Record<TFields, string>> {
  const errors: Partial<Record<TFields, string>> = {};
  zodError.errors.forEach((e) => {
    const field = e.path[0] as TFields;
    if (field && !errors[field]) errors[field] = e.message;
  });
  return errors;
}
