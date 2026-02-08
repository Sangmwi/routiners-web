/**
 * Routine Executors
 *
 * 루틴 미리보기, 적용, 저장 관련 실행 함수
 */

import type {
  AIToolResult,
  InputRequest,
  InputRequestOption,
  InputRequestSliderConfig,
  InputRequestType,
  RoutinePreviewData,
  RoutinePreviewWeek,
  RoutinePreviewDay,
  RoutinePreviewExercise,
  RoutineConflict,
} from '@/lib/types';
import type { WorkoutData, WorkoutExercise, EventType } from '@/lib/types/routine';
import { parseRoutineData, type AIRoutineData } from '../schemas';
import { formatDate, checkEventDateConflicts, getRoutineStartDate, getMondayOfWeek } from '../tool-utils';
import { insertEventsWithConflictCheck, updateConversationApplied, type EventInsertData } from '../event-factory';
import type { ToolExecutorContext } from './types';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * AI routine_data(Zod 검증 완료)를 routine_events INSERT 데이터로 변환
 *
 * Phase 11: 오늘부터 첫 매칭 요일 기준 시작, weekCount로 적용 주차 제한
 *
 * @param routineData - Zod 스키마로 검증된 AIRoutineData
 * @param userId - 사용자 ID
 * @param conversationId - 대화 ID (ai_session_id로 사용)
 * @param title - 루틴 제목
 * @param weekCount - 적용할 주차 수 (기본: 전체)
 * @param startAfterDate - 이 날짜 이후부터 시작 (이어붙이기 모드, YYYY-MM-DD)
 */
function convertAIRoutineToEvents(
  routineData: AIRoutineData,
  userId: string,
  conversationId: string,
  title: string,
  weekCount?: number,
  startAfterDate?: string
): Array<{
  user_id: string;
  type: EventType;
  date: string;
  title: string;
  data: WorkoutData;
  rationale: string | null;
  status: 'scheduled';
  source: 'ai';
  ai_session_id: string;
}> {
  const events: Array<{
    user_id: string;
    type: EventType;
    date: string;
    title: string;
    data: WorkoutData;
    rationale: string | null;
    status: 'scheduled';
    source: 'ai';
    ai_session_id: string;
  }> = [];

  // 적용할 주차 제한
  const weeksToApply = weekCount
    ? routineData.weeks.slice(0, weekCount)
    : routineData.weeks;

  if (weeksToApply.length === 0) {
    return events;
  }

  // 루틴에 포함된 요일들 추출 (첫 주 기준)
  const firstWeekDays = weeksToApply[0].days || [];
  const targetDays = firstWeekDays.map(d => d.dayOfWeek);

  // Phase 11: 기준일부터 첫 매칭 요일 찾기 (이어붙이기 시 startAfterDate 이후)
  const startAfter = startAfterDate ? new Date(startAfterDate) : undefined;
  const routineStartDate = getRoutineStartDate(targetDays, startAfter);
  // 시작일이 속한 주의 월요일
  const baseMonday = getMondayOfWeek(routineStartDate);

  weeksToApply.forEach((week, weekIndex) => {
    const weekDays = week.days || [];

    weekDays.forEach((day) => {
      // dayOfWeek: 1=월요일 → 0, 2=화요일 → 1, ...
      const dayOffset = (day.dayOfWeek - 1) + (weekIndex * 7);
      const eventDate = new Date(baseMonday);
      eventDate.setDate(baseMonday.getDate() + dayOffset);

      // 오늘 이전 날짜는 건너뛰기
      if (eventDate < routineStartDate) {
        return;
      }

      // WorkoutExercise[] 변환
      const exercises: WorkoutExercise[] = (day.exercises || []).map((ex, idx) => ({
        id: ex.id || `exercise-${idx}`,
        name: ex.name,
        category: ex.category,
        targetMuscle: ex.targetMuscle,
        sets: (ex.sets || []).map((set, setIdx) => ({
          setNumber: set.setNumber || setIdx + 1,
          targetReps: set.targetReps,
          targetWeight: set.targetWeight,
          restSeconds: set.restSeconds,
        })),
        restSeconds: ex.restSeconds,
        tempo: ex.tempo,
        rir: ex.rir,
        technique: ex.technique,
        notes: ex.notes,
        distance: ex.distance,
      }));

      // WorkoutData 구성
      const workoutData: WorkoutData = {
        exercises,
        estimatedDuration: day.estimatedDuration,
        estimatedCaloriesBurned: day.estimatedCaloriesBurned,
        workoutType: day.workoutType,
        intensity: day.intensity,
        warmup: day.warmup,
        cooldown: day.cooldown,
        tips: day.tips,
        notes: day.notes,
      };

      events.push({
        user_id: userId,
        type: 'workout',
        date: formatDate(eventDate),
        title: day.title || `${title} - Week ${weekIndex + 1} Day ${day.dayOfWeek}`,
        data: workoutData,
        rationale: day.rationale || null,
        status: 'scheduled',
        source: 'ai',
        ai_session_id: conversationId,
      });
    });
  });

  return events;
}

// ============================================================================
// Executors
// ============================================================================

/**
 * save_routine_draft
 *
 * AI가 생성한 루틴을 routine_events 테이블에 실제로 저장
 * 성공 시 conversations.ai_result_applied = true 업데이트
 *
 * Phase 11: weekCount 파라미터 추가 - 사용자가 선택한 주차 수만큼 적용
 */
export async function executeSaveRoutineDraft(
  ctx: ToolExecutorContext,
  args: {
    title: string;
    description: string;
    duration_weeks: number;
    days_per_week: number;
    routine_data: Record<string, unknown>;
    weekCount?: number;
    conflictStrategy?: 'error' | 'overwrite';
    startAfterDate?: string;
  }
): Promise<AIToolResult<{ saved: boolean; eventsCreated: number; startDate: string }>> {
  try {
    // 0. Zod 스키마로 routine_data 검증
    const parseResult = parseRoutineData(args.routine_data);
    if (!parseResult.success) {
      return { success: false, error: parseResult.error };
    }
    const validatedRoutineData = parseResult.data;

    // 1. AI routine_data를 routine_events INSERT 데이터로 변환
    const events = convertAIRoutineToEvents(
      validatedRoutineData,
      ctx.userId,
      ctx.conversationId,
      args.title,
      args.weekCount,
      args.startAfterDate
    );

    // 2. 팩토리로 충돌 체크 + 삽입
    const insertResult = await insertEventsWithConflictCheck(
      ctx,
      events as EventInsertData[],
      'workout',
      args.conflictStrategy || 'error'
    );

    if (!insertResult.success) {
      return { success: false, error: insertResult.error };
    }

    // 3. 대화 상태 업데이트
    await updateConversationApplied(ctx.supabase, ctx.conversationId);

    return {
      success: true,
      data: {
        saved: true,
        eventsCreated: insertResult.eventsCreated!,
        startDate: insertResult.startDate!,
      },
    };
  } catch (err) {
    console.error('[save_routine_draft] Unexpected error:', err);
    return { success: false, error: '루틴 저장 중 오류가 발생했습니다.' };
  }
}

/**
 * request_user_input
 *
 * 사용자에게 객관식 선택 UI를 요청
 * 이 도구는 DB 작업 없이 프론트엔드에 UI 요청만 전달
 * 실제 UI 렌더링은 API route에서 input_request SSE 이벤트로 처리
 */
export function executeRequestUserInput(
  args: {
    message?: string;
    type: InputRequestType;
    options?: InputRequestOption[];
    sliderConfig?: InputRequestSliderConfig;
  },
  toolCallId: string
): AIToolResult<InputRequest> {
  // 유효성 검증
  if (args.type === 'slider' && !args.sliderConfig) {
    return { success: false, error: 'slider 타입에는 sliderConfig가 필요합니다.' };
  }

  if ((args.type === 'radio' || args.type === 'checkbox') && (!args.options || args.options.length === 0)) {
    return { success: false, error: 'radio/checkbox 타입에는 options가 필요합니다.' };
  }

  const inputRequest: InputRequest = {
    id: toolCallId,
    type: args.type,
    message: args.message,
    options: args.options,
    sliderConfig: args.sliderConfig,
  };

  return {
    success: true,
    data: inputRequest,
  };
}

/**
 * generate_routine_preview
 *
 * AI가 생성한 루틴 미리보기 데이터 생성 (DB 저장 없음)
 * 프론트엔드에서 routine_preview SSE 이벤트로 UI 표시
 * - AI는 1주만 생성, 시스템이 2주로 자동 복제
 */
export function executeGenerateRoutinePreview(
  args: {
    title: string;
    description: string;
    duration_weeks: number;
    days_per_week: number;
    weeks: Array<{
      weekNumber: number;
      days: Array<{
        dayOfWeek: number;
        title: string;
        exercises: Array<{
          name: string;
          sets: number;
          reps: string;
          rest: string;
          weight?: number;
          notes?: string;
        }>;
        estimatedDuration?: number;
      }>;
    }>;
  },
  toolCallId: string
): AIToolResult<RoutinePreviewData> {
  // 미리보기 ID 생성
  const previewId = `preview-${toolCallId}`;

  // 1주 데이터를 RoutinePreviewDay[]로 변환하는 헬퍼 함수
  const convertDays = (days: typeof args.weeks[0]['days']): RoutinePreviewDay[] => {
    return days.map((day): RoutinePreviewDay => ({
      dayOfWeek: day.dayOfWeek,
      title: day.title,
      exercises: day.exercises.map((ex): RoutinePreviewExercise => ({
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        rest: ex.rest,
        weight: ex.weight,
        notes: ex.notes,
      })),
      estimatedDuration: day.estimatedDuration,
    }));
  };

  // weeks 데이터 처리: 1주면 4주로 복제 (Phase 11.5)
  let weeks: RoutinePreviewWeek[];

  if (args.weeks.length === 1) {
    // 1주 데이터를 4주로 복제
    const week1Days = convertDays(args.weeks[0].days);
    weeks = [
      { weekNumber: 1, days: week1Days },
      { weekNumber: 2, days: week1Days.map(day => ({ ...day })) },
      { weekNumber: 3, days: week1Days.map(day => ({ ...day })) },
      { weekNumber: 4, days: week1Days.map(day => ({ ...day })) },
    ];
  } else {
    // 2주 이상인 경우 그대로 사용
    weeks = args.weeks.map((week) => ({
      weekNumber: week.weekNumber,
      days: convertDays(week.days),
    }));
  }

  const previewData: RoutinePreviewData = {
    id: previewId,
    title: args.title,
    description: args.description,
    durationWeeks: 4,  // 최대 4주 (Phase 11.5)
    daysPerWeek: args.days_per_week,
    weeks,
    // 원본 데이터 저장 (apply_routine에서 사용)
    rawRoutineData: {
      title: args.title,
      description: args.description,
      duration_weeks: 4,  // 최대 4주 (Phase 11.5)
      days_per_week: args.days_per_week,
      routine_data: {
        weeks: weeks.map((week) => ({
          weekNumber: week.weekNumber,
          days: week.days.map((day) => ({
            dayOfWeek: day.dayOfWeek,
            title: day.title,
            exercises: day.exercises.map((ex) => ({
              name: ex.name,
              category: 'compound',
              targetMuscle: 'general',
              sets: Array.from({ length: ex.sets }, (_, i) => ({
                setNumber: i + 1,
                targetReps: parseInt(ex.reps.split('-')[0]) || 10,
                targetWeight: ex.weight ?? undefined,
              })),
              restSeconds: parseInt(ex.rest) || 90,
              notes: ex.notes,
            })),
            estimatedDuration: day.estimatedDuration || 60,
          })),
        })),
      },
    },
  };

  return {
    success: true,
    data: previewData,
  };
}

/**
 * 충돌 체크
 *
 * 새 루틴이 적용될 날짜들에 기존 루틴이 있는지 확인
 * generate_routine_preview 호출 후 conflicts 필드에 포함
 */
export async function checkDateConflicts(
  ctx: ToolExecutorContext,
  previewData: RoutinePreviewData
): Promise<RoutineConflict[]> {
  return checkEventDateConflicts(ctx, previewData, 'workout');
}

/**
 * apply_routine
 *
 * 미리보기 데이터를 실제 DB에 저장
 * previewData는 API route에서 메시지 metadata에서 가져와서 전달
 *
 * Phase 11: weekCount 파라미터 추가 - 사용자가 선택한 주차 수만큼 적용
 */
export async function executeApplyRoutine(
  ctx: ToolExecutorContext,
  previewData: RoutinePreviewData,
  weekCount?: number,
  conflictStrategy?: 'error' | 'overwrite',
  startAfterDate?: string
): Promise<AIToolResult<{ saved: boolean; eventsCreated: number; startDate: string }>> {
  try {
    if (!previewData.rawRoutineData) {
      return { success: false, error: '미리보기 데이터를 찾을 수 없습니다.' };
    }

    const rawData = previewData.rawRoutineData as {
      title: string;
      description: string;
      duration_weeks: number;
      days_per_week: number;
      routine_data: Record<string, unknown>;
    };

    // 기존 executeSaveRoutineDraft 로직 재사용
    return await executeSaveRoutineDraft(ctx, {
      title: rawData.title,
      description: rawData.description,
      duration_weeks: rawData.duration_weeks,
      days_per_week: rawData.days_per_week,
      routine_data: rawData.routine_data,
      weekCount,
      conflictStrategy,
      startAfterDate,
    });
  } catch (err) {
    console.error('[apply_routine] Unexpected error:', err);
    return { success: false, error: '루틴 적용 중 오류가 발생했습니다.' };
  }
}
