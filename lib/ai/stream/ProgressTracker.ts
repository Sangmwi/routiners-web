/**
 * ProgressTracker - 도구 인자 스트리밍 진행률 추적
 *
 * OCP: 새 도구의 진행률 추적은 ProgressTracker.register()만 호출하면 됨.
 * 스트리밍 루프 코드 수정 불필요.
 */

// =============================================================================
// Types
// =============================================================================

export interface ProgressInput {
  toolName: string;
  argumentsSoFar: string;
  delta: string;
}

export interface ProgressEvent {
  progress: number;
  stage: string;
}

export type ProgressCalculator = (input: ProgressInput) => ProgressEvent | null;

// =============================================================================
// ProgressTracker
// =============================================================================

export class ProgressTracker {
  private static calculators = new Map<string, ProgressCalculator>();
  private lastProgress = new Map<string, number>();

  /** 도구별 진행률 계산기 등록 (OCP 확장 포인트) */
  static register(toolName: string, calculator: ProgressCalculator): void {
    ProgressTracker.calculators.set(toolName, calculator);
  }

  /**
   * function_call_arguments.delta 이벤트마다 호출.
   * 전송할 ProgressEvent가 있으면 반환, 없으면 null.
   */
  onArgumentsDelta(
    itemId: string,
    toolName: string,
    argumentsSoFar: string,
    delta: string
  ): ProgressEvent | null {
    const calculator = ProgressTracker.calculators.get(toolName);
    if (!calculator) return null;

    const result = calculator({ toolName, argumentsSoFar, delta });
    if (!result) return null;

    // 5% 단위 스냅 + 중복 방지
    const snapped = Math.floor(result.progress / 5) * 5;
    const lastSent = this.lastProgress.get(itemId) ?? 0;
    if (snapped <= lastSent) return null;

    this.lastProgress.set(itemId, snapped);
    return { progress: snapped, stage: result.stage };
  }
}

// =============================================================================
// generate_routine_preview 진행률 계산기
// =============================================================================

function routinePreviewProgress(input: ProgressInput): ProgressEvent | null {
  const args = input.argumentsSoFar;

  // days_per_week 기반 동적 예상 문자 수 계산
  const daysMatch = args.match(/"days_per_week"\s*:\s*(\d+)/);
  const totalDays = daysMatch ? parseInt(daysMatch[1]) : 3;
  const estimatedChars = daysMatch ? totalDays * 800 + 300 : 2600;

  // dayOfWeek 패턴으로 현재 생성 중인 요일 수 파악
  const dayMatches = args.match(/"dayOfWeek"/g);
  const completedDays = dayMatches ? dayMatches.length : 0;

  // 두 지표 혼합: 문자 수 기반 40% + 요일 완성도 기반 60%
  const charProgress = (args.length / estimatedChars) * 100;
  const dayProgress = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;
  const progress = Math.min(95, Math.round(charProgress * 0.4 + dayProgress * 0.6));

  // 요일 기반 stage 메시지
  const stage =
    completedDays === 0
      ? '루틴 구조 설계 중...'
      : completedDays < totalDays
        ? `${completedDays}/${totalDays}일차 운동 생성 중...`
        : progress < 90
          ? '세부 설정 마무리 중...'
          : '거의 완료!';

  return { progress, stage };
}

// 자체 등록
ProgressTracker.register('generate_routine_preview', routinePreviewProgress);
