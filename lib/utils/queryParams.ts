import { PAGINATION } from '@/lib/constants/pagination';

export function parsePaginationParams(
  searchParams: URLSearchParams,
  options?: { defaultLimit?: number; maxLimit?: number },
): { page: number; limit: number; offset: number } {
  const defaultLimit = options?.defaultLimit ?? PAGINATION.DEFAULT_LIMIT;
  const maxLimit = options?.maxLimit ?? PAGINATION.MAX_LIMIT;

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(maxLimit, Math.max(1, parseInt(searchParams.get('limit') ?? String(defaultLimit), 10)));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}
