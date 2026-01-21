/**
 * Rate Limiter
 *
 * 간단한 메모리 기반 Rate Limiting
 * Serverless 환경에서는 인스턴스별로 독립적이므로 완전하지 않지만,
 * 기본적인 보호 제공
 *
 * 프로덕션에서는 Redis 또는 Upstash 기반 Rate Limiting 권장
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// 메모리 캐시 (인스턴스별 독립)
const cache = new Map<string, RateLimitEntry>();

// 주기적으로 만료된 엔트리 정리 (메모리 누수 방지)
const CLEANUP_INTERVAL = 60 * 1000; // 1분
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of cache.entries()) {
    if (entry.resetTime < now) {
      cache.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** 최대 요청 수 */
  maxRequests: number;
  /** 윈도우 시간 (밀리초) */
  windowMs: number;
}

export interface RateLimitResult {
  /** 요청 허용 여부 */
  allowed: boolean;
  /** 남은 요청 수 */
  remaining: number;
  /** 리셋까지 남은 시간 (밀리초) */
  resetIn: number;
}

/**
 * Rate Limit 체크
 *
 * @param key - 고유 식별자 (IP, userId 등)
 * @param config - Rate Limit 설정
 * @returns RateLimitResult
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = cache.get(key);

  // 새 엔트리 또는 윈도우 만료
  if (!entry || entry.resetTime < now) {
    cache.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }

  // 기존 윈도우 내
  if (entry.count < config.maxRequests) {
    entry.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetIn: entry.resetTime - now,
    };
  }

  // 제한 초과
  return {
    allowed: false,
    remaining: 0,
    resetIn: entry.resetTime - now,
  };
}

/**
 * AI API Rate Limit 설정
 * - 분당 10회 제한 (OpenAI 비용 보호)
 */
export const AI_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60 * 1000, // 1분
};

/**
 * InBody 스캔 Rate Limit 설정
 * - 분당 5회 제한 (Vision API 비용 보호)
 */
export const INBODY_SCAN_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 60 * 1000, // 1분
};

/**
 * Rate Limit 초과 응답 생성
 */
export function rateLimitExceeded(result: RateLimitResult) {
  const retryAfterSec = Math.ceil(result.resetIn / 1000);
  return {
    error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: retryAfterSec,
  };
}
