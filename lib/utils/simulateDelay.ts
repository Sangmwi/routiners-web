/**
 * 서버측 랜덤 지연 시뮬레이션
 *
 * MVP 시연 시 더미 API가 즉시 응답하는 것을 방지하여
 * 실제 서비스처럼 자연스러운 로딩 UX를 제공
 *
 * @param minMs - 최소 지연 시간 (ms)
 * @param maxMs - 최대 지연 시간 (ms)
 */
export function simulateDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
