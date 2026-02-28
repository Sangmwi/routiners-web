import { ZodError, ZodSchema } from 'zod';

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

/**
 * Zod 스키마 검증 + 필드 에러 세터 통합 유틸리티
 *
 * 검증 실패 시 필드 에러를 세팅하고 false 반환.
 * 검증 성공 시 에러를 초기화하고 true 반환.
 *
 * @example
 * const handleSave = () => {
 *   if (!validateForm(MySchema, data, setFormErrors)) return;
 *   mutate(data, { ... });
 * };
 */
export function validateForm<TFields extends string>(
  schema: ZodSchema,
  data: unknown,
  setFormErrors: (errors: Partial<Record<TFields, string>>) => void,
): boolean {
  const result = schema.safeParse(data);
  if (!result.success) {
    setFormErrors(collectZodErrors<TFields>(result.error));
    return false;
  }
  setFormErrors({} as Partial<Record<TFields, string>>);
  return true;
}
