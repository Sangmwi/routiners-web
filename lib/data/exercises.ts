/**
 * 운동 카탈로그 데이터 (하드코딩)
 *
 * TODO: 외부 API 연동 (운동 DB API 등)
 */

// ============================================================================
// Types
// ============================================================================

export type ExerciseCategory =
  | '가슴'
  | '등'
  | '어깨'
  | '하체'
  | '팔'
  | '코어'
  | '유산소'
  | '전신';

/**
 * 운동 추적 유형 — 프론트에서 입력 UI를 동적으로 구성하는 핵심 구분자
 *
 * - weight_reps: 중량+횟수 (벤치프레스, 스쿼트 등)
 * - bodyweight_reps: 맨몸 횟수, 가중 시 중량 추가 (풀업, 딥스 등)
 * - assisted: 보조 중량 = 빼주는 무게 (어시스트 친업, 어시스트 딥 등)
 * - duration: 시간 기반 (플랭크, 사이드 플랭크 등)
 * - distance_time: 거리+시간 (러닝, 사이클, 로잉 등)
 */
export type TrackingType =
  | 'weight_reps'
  | 'bodyweight_reps'
  | 'assisted'
  | 'duration'
  | 'distance_time';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'band'
  | 'other';

export type Big3LiftType = 'squat' | 'bench' | 'deadlift';

export interface ExerciseInfo {
  id: string;
  name: string;
  category: ExerciseCategory;
  targetMuscle: string;
  trackingType: TrackingType;
  equipment: Equipment;
  big3LiftType?: Big3LiftType;
}

export const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  '가슴',
  '등',
  '어깨',
  '하체',
  '팔',
  '코어',
  '유산소',
  '전신',
];

export const EXERCISE_CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  가슴: '가슴',
  등: '등',
  어깨: '어깨',
  하체: '하체',
  팔: '팔',
  코어: '코어',
  유산소: '유산소',
  전신: '전신',
};

// ============================================================================
// Data
// ============================================================================

export const EXERCISES: ExerciseInfo[] = [
  // === 가슴 ===
  { id: 'bench-press', name: '벤치프레스', category: '가슴', targetMuscle: '대흉근', trackingType: 'weight_reps', equipment: 'barbell', big3LiftType: 'bench' },
  { id: 'incline-bench-press', name: '인클라인 벤치프레스', category: '가슴', targetMuscle: '상부 흉근', trackingType: 'weight_reps', equipment: 'barbell' },
  { id: 'decline-bench-press', name: '디클라인 벤치프레스', category: '가슴', targetMuscle: '하부 흉근', trackingType: 'weight_reps', equipment: 'barbell' },
  { id: 'dumbbell-press', name: '덤벨 프레스', category: '가슴', targetMuscle: '대흉근', trackingType: 'weight_reps', equipment: 'dumbbell' },
  { id: 'incline-dumbbell-press', name: '인클라인 덤벨 프레스', category: '가슴', targetMuscle: '상부 흉근', trackingType: 'weight_reps', equipment: 'dumbbell' },
  { id: 'chest-press-machine', name: '체스트 프레스 머신', category: '가슴', targetMuscle: '대흉근', trackingType: 'weight_reps', equipment: 'machine' },
  { id: 'pec-fly', name: '펙 플라이', category: '가슴', targetMuscle: '대흉근', trackingType: 'weight_reps', equipment: 'machine' },
  { id: 'cable-crossover', name: '케이블 크로스오버', category: '가슴', targetMuscle: '대흉근', trackingType: 'weight_reps', equipment: 'cable' },
  { id: 'push-up', name: '푸시업', category: '가슴', targetMuscle: '대흉근', trackingType: 'bodyweight_reps', equipment: 'bodyweight' },
  { id: 'dips-chest', name: '딥스 (가슴)', category: '가슴', targetMuscle: '하부 흉근', trackingType: 'bodyweight_reps', equipment: 'bodyweight' },

  // === 등 ===
  { id: 'pull-up', name: '풀업', category: '등', targetMuscle: '광배근', trackingType: 'bodyweight_reps', equipment: 'bodyweight' },
  { id: 'chin-up', name: '친업', category: '등', targetMuscle: '광배근', trackingType: 'bodyweight_reps', equipment: 'bodyweight' },
  { id: 'lat-pulldown', name: '랫풀다운', category: '등', targetMuscle: '광배근', trackingType: 'weight_reps', equipment: 'cable' },
  { id: 'barbell-row', name: '바벨 로우', category: '등', targetMuscle: '광배근', trackingType: 'weight_reps', equipment: 'barbell' },
  { id: 'dumbbell-row', name: '덤벨 로우', category: '등', targetMuscle: '광배근', trackingType: 'weight_reps', equipment: 'dumbbell' },
  { id: 'seated-cable-row', name: '시티드 케이블 로우', category: '등', targetMuscle: '중부 승모근', trackingType: 'weight_reps', equipment: 'cable' },
  { id: 'cable-row', name: '케이블 로우', category: '등', targetMuscle: '광배근', trackingType: 'weight_reps', equipment: 'cable' },
  { id: 't-bar-row', name: 'T바 로우', category: '등', targetMuscle: '광배근', trackingType: 'weight_reps', equipment: 'barbell' },
  { id: 'face-pull', name: '페이스풀', category: '등', targetMuscle: '후면 삼각근', trackingType: 'weight_reps', equipment: 'cable' },
  { id: 'back-extension', name: '백 익스텐션', category: '등', targetMuscle: '기립근', trackingType: 'bodyweight_reps', equipment: 'bodyweight' },

  // === 어깨 ===
  { id: 'overhead-press', name: '오버헤드 프레스', category: '어깨', targetMuscle: '전면 삼각근', trackingType: 'weight_reps', equipment: 'barbell' },
  { id: 'dumbbell-shoulder-press', name: '덤벨 숄더 프레스', category: '어깨', targetMuscle: '전면 삼각근', trackingType: 'weight_reps', equipment: 'dumbbell' },
  { id: 'side-lateral-raise', name: '사이드 레터럴 레이즈', category: '어깨', targetMuscle: '측면 삼각근', trackingType: 'weight_reps', equipment: 'dumbbell' },
  { id: 'front-raise', name: '프론트 레이즈', category: '어깨', targetMuscle: '전면 삼각근', trackingType: 'weight_reps', equipment: 'dumbbell' },
  { id: 'rear-delt-fly', name: '리어 델트 플라이', category: '어깨', targetMuscle: '후면 삼각근', trackingType: 'weight_reps', equipment: 'dumbbell' },
  { id: 'upright-row', name: '업라이트 로우', category: '어깨', targetMuscle: '측면 삼각근', trackingType: 'weight_reps', equipment: 'barbell' },
  { id: 'arnold-press', name: '아놀드 프레스', category: '어깨', targetMuscle: '삼각근', trackingType: 'weight_reps', equipment: 'dumbbell' },
  { id: 'shrug', name: '슈러그', category: '어깨', targetMuscle: '상부 승모근', trackingType: 'weight_reps', equipment: 'dumbbell' },

  // === 하체 ===
  { id: 'squat', name: '스쿼트', category: '하체', targetMuscle: '대퇴사두근', trackingType: 'weight_reps', equipment: 'barbell', big3LiftType: 'squat' },
  { id: 'front-squat', name: '프론트 스쿼트', category: '하체', targetMuscle: '대퇴사두근', trackingType: 'weight_reps', equipment: 'barbell' },
  { id: 'goblet-squat', name: '고블릿 스쿼트', category: '하체', targetMuscle: '대퇴사두근', trackingType: 'weight_reps', equipment: 'dumbbell' },
  { id: 'leg-press', name: '레그 프레스', category: '하체', targetMuscle: '대퇴사두근', trackingType: 'weight_reps', equipment: 'machine' },
  { id: 'leg-extension', name: '레그 익스텐션', category: '하체', targetMuscle: '대퇴사두근', trackingType: 'weight_reps', equipment: 'machine' },
  { id: 'leg-curl', name: '레그 컬', category: '하체', targetMuscle: '햄스트링', trackingType: 'weight_reps', equipment: 'machine' },
  { id: 'lunge', name: '런지', category: '하체', targetMuscle: '대퇴사두근', trackingType: 'weight_reps', equipment: 'dumbbell' },
  { id: 'bulgarian-split-squat', name: '불가리안 스플릿 스쿼트', category: '하체', targetMuscle: '대퇴사두근', trackingType: 'weight_reps', equipment: 'dumbbell' },
  { id: 'deadlift', name: '데드리프트', category: '하체', targetMuscle: '햄스트링', trackingType: 'weight_reps', equipment: 'barbell', big3LiftType: 'deadlift' },
  { id: 'romanian-deadlift', name: '루마니안 데드리프트', category: '하체', targetMuscle: '햄스트링', trackingType: 'weight_reps', equipment: 'barbell' },
  { id: 'sumo-deadlift', name: '스모 데드리프트', category: '하체', targetMuscle: '내전근', trackingType: 'weight_reps', equipment: 'barbell' },
  { id: 'hip-thrust', name: '힙 쓰러스트', category: '하체', targetMuscle: '대둔근', trackingType: 'weight_reps', equipment: 'barbell' },
  { id: 'calf-raise', name: '카프 레이즈', category: '하체', targetMuscle: '종아리', trackingType: 'weight_reps', equipment: 'machine' },
  { id: 'hack-squat', name: '핵 스쿼트', category: '하체', targetMuscle: '대퇴사두근', trackingType: 'weight_reps', equipment: 'machine' },

  // === 팔 ===
  { id: 'barbell-curl', name: '바벨 컬', category: '팔', targetMuscle: '이두근', trackingType: 'weight_reps', equipment: 'barbell' },
  { id: 'dumbbell-curl', name: '덤벨 컬', category: '팔', targetMuscle: '이두근', trackingType: 'weight_reps', equipment: 'dumbbell' },
  { id: 'hammer-curl', name: '해머 컬', category: '팔', targetMuscle: '상완근', trackingType: 'weight_reps', equipment: 'dumbbell' },
  { id: 'concentration-curl', name: '컨센트레이션 컬', category: '팔', targetMuscle: '이두근', trackingType: 'weight_reps', equipment: 'dumbbell' },
  { id: 'tricep-pushdown', name: '트라이셉 푸시다운', category: '팔', targetMuscle: '삼두근', trackingType: 'weight_reps', equipment: 'cable' },
  { id: 'overhead-tricep-extension', name: '오버헤드 트라이셉 익스텐션', category: '팔', targetMuscle: '삼두근', trackingType: 'weight_reps', equipment: 'cable' },
  { id: 'skull-crusher', name: '스컬 크러셔', category: '팔', targetMuscle: '삼두근', trackingType: 'weight_reps', equipment: 'barbell' },
  { id: 'dips-tricep', name: '딥스 (삼두)', category: '팔', targetMuscle: '삼두근', trackingType: 'bodyweight_reps', equipment: 'bodyweight' },
  { id: 'wrist-curl', name: '리스트 컬', category: '팔', targetMuscle: '전완근', trackingType: 'weight_reps', equipment: 'dumbbell' },

  // === 코어 ===
  { id: 'plank', name: '플랭크', category: '코어', targetMuscle: '복직근', trackingType: 'duration', equipment: 'bodyweight' },
  { id: 'side-plank', name: '사이드 플랭크', category: '코어', targetMuscle: '외복사근', trackingType: 'duration', equipment: 'bodyweight' },
  { id: 'crunch', name: '크런치', category: '코어', targetMuscle: '복직근', trackingType: 'bodyweight_reps', equipment: 'bodyweight' },
  { id: 'sit-up', name: '싯업', category: '코어', targetMuscle: '복직근', trackingType: 'bodyweight_reps', equipment: 'bodyweight' },
  { id: 'leg-raise', name: '레그 레이즈', category: '코어', targetMuscle: '하복부', trackingType: 'bodyweight_reps', equipment: 'bodyweight' },
  { id: 'hanging-leg-raise', name: '행잉 레그 레이즈', category: '코어', targetMuscle: '하복부', trackingType: 'bodyweight_reps', equipment: 'bodyweight' },
  { id: 'russian-twist', name: '러시안 트위스트', category: '코어', targetMuscle: '외복사근', trackingType: 'bodyweight_reps', equipment: 'bodyweight' },
  { id: 'mountain-climber', name: '마운틴 클라이머', category: '코어', targetMuscle: '복직근', trackingType: 'bodyweight_reps', equipment: 'bodyweight' },
  { id: 'ab-wheel', name: '앱 휠', category: '코어', targetMuscle: '복직근', trackingType: 'bodyweight_reps', equipment: 'other' },

  // === 유산소 ===
  { id: 'running', name: '러닝', category: '유산소', targetMuscle: '심폐', trackingType: 'distance_time', equipment: 'bodyweight' },
  { id: 'treadmill', name: '트레드밀', category: '유산소', targetMuscle: '심폐', trackingType: 'distance_time', equipment: 'machine' },
  { id: 'cycling', name: '사이클', category: '유산소', targetMuscle: '심폐', trackingType: 'distance_time', equipment: 'machine' },
  { id: 'rowing-machine', name: '로잉머신', category: '유산소', targetMuscle: '심폐', trackingType: 'distance_time', equipment: 'machine' },
  { id: 'jump-rope', name: '줄넘기', category: '유산소', targetMuscle: '심폐', trackingType: 'duration', equipment: 'other' },
  { id: 'stair-climber', name: '계단 오르기', category: '유산소', targetMuscle: '심폐', trackingType: 'distance_time', equipment: 'machine' },
  { id: 'elliptical', name: '일립티컬', category: '유산소', targetMuscle: '심폐', trackingType: 'distance_time', equipment: 'machine' },

  // === 전신 ===
  { id: 'burpee', name: '버피', category: '전신', targetMuscle: '전신', trackingType: 'bodyweight_reps', equipment: 'bodyweight' },
  { id: 'clean-and-press', name: '클린 앤 프레스', category: '전신', targetMuscle: '전신', trackingType: 'weight_reps', equipment: 'barbell' },
  { id: 'kettlebell-swing', name: '케틀벨 스윙', category: '전신', targetMuscle: '후면사슬', trackingType: 'weight_reps', equipment: 'kettlebell' },
  { id: 'thrusters', name: '쓰러스터', category: '전신', targetMuscle: '전신', trackingType: 'weight_reps', equipment: 'barbell' },
  { id: 'battle-rope', name: '배틀로프', category: '전신', targetMuscle: '전신', trackingType: 'duration', equipment: 'other' },
];

// ============================================================================
// Helpers
// ============================================================================

/**
 * 운동명으로 Big3 종목 타입 조회 (이름 매칭 → big3LiftType 플래그 기반)
 */
const BIG3_NAME_MAP = new Map(
  EXERCISES.filter((e) => e.big3LiftType).map((e) => [e.name, e.big3LiftType!])
);

export function getBig3LiftType(exerciseName: string): Big3LiftType | undefined {
  return BIG3_NAME_MAP.get(exerciseName);
}

/**
 * 운동 검색 (이름 prefix match)
 */
export function searchExercises(query: string, category?: ExerciseCategory): ExerciseInfo[] {
  const normalized = query.trim().toLowerCase();
  let results = EXERCISES;

  if (category) {
    results = results.filter((e) => e.category === category);
  }

  if (!normalized) return results;

  return results.filter(
    (e) =>
      e.name.toLowerCase().includes(normalized) ||
      e.targetMuscle.toLowerCase().includes(normalized)
  );
}

/**
 * 카테고리별 운동 그룹핑
 */
export function getExercisesByCategory(): Record<ExerciseCategory, ExerciseInfo[]> {
  return EXERCISES.reduce(
    (acc, exercise) => {
      if (!acc[exercise.category]) acc[exercise.category] = [];
      acc[exercise.category].push(exercise);
      return acc;
    },
    {} as Record<ExerciseCategory, ExerciseInfo[]>,
  );
}

/**
 * 선택된 운동들로 자동 제목 생성
 */
export function generateWorkoutTitle(exercises: Pick<ExerciseInfo, 'category'>[]): string {
  if (exercises.length === 0) return '오늘의 운동';

  const categories = [...new Set(exercises.map((e) => e.category))];

  if (categories.length === 1) return `${categories[0]} 운동`;
  if (categories.length === 2) return `${categories[0]}/${categories[1]} 운동`;
  return '전신 운동';
}
