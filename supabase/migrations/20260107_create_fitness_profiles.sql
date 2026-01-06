-- Fitness Profile 테이블
-- AI 트레이너가 사용하는 사용자 운동 선호도 및 프로필 정보
-- 실행: Supabase Dashboard > SQL Editor 또는 supabase db push

CREATE TABLE fitness_profiles (
  -- 1:1 관계 (users 테이블과)
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- 운동 목표 (muscle_gain, fat_loss, endurance, general_fitness, strength)
  fitness_goal TEXT CHECK (fitness_goal IN (
    'muscle_gain', 'fat_loss', 'endurance', 'general_fitness', 'strength'
  )),

  -- 운동 경험 수준 (beginner, intermediate, advanced)
  experience_level TEXT CHECK (experience_level IN (
    'beginner', 'intermediate', 'advanced'
  )),

  -- 주간 운동 일수 (1-7)
  preferred_days_per_week INTEGER CHECK (
    preferred_days_per_week IS NULL OR
    (preferred_days_per_week >= 1 AND preferred_days_per_week <= 7)
  ),

  -- 세션당 운동 시간 (분)
  session_duration_minutes INTEGER CHECK (
    session_duration_minutes IS NULL OR
    (session_duration_minutes >= 10 AND session_duration_minutes <= 180)
  ),

  -- 장비 접근성 (full_gym, limited, bodyweight_only)
  equipment_access TEXT CHECK (equipment_access IN (
    'full_gym', 'limited', 'bodyweight_only'
  )),

  -- 집중 부위 (chest, back, shoulders, arms, legs, core, full_body)
  focus_areas TEXT[] DEFAULT '{}',

  -- 부상/제한 사항 (자유 텍스트 배열)
  injuries TEXT[] DEFAULT '{}',

  -- 선호 사항 (예: prefer_compound, prefer_machines, morning_workout)
  preferences TEXT[] DEFAULT '{}',

  -- 제한 사항 (예: no_running, avoid_heavy_squats)
  restrictions TEXT[] DEFAULT '{}',

  -- AI 메모 (대화 중 수집한 추가 정보)
  ai_notes JSONB DEFAULT '{}',

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 코멘트
COMMENT ON TABLE fitness_profiles IS 'AI 트레이너가 활용하는 사용자 운동 프로필';
COMMENT ON COLUMN fitness_profiles.fitness_goal IS '운동 목표: muscle_gain, fat_loss, endurance, general_fitness, strength';
COMMENT ON COLUMN fitness_profiles.experience_level IS '운동 경험: beginner, intermediate, advanced';
COMMENT ON COLUMN fitness_profiles.equipment_access IS '장비 접근성: full_gym, limited, bodyweight_only';
COMMENT ON COLUMN fitness_profiles.focus_areas IS '집중 부위 배열: chest, back, shoulders, arms, legs, core, full_body';
COMMENT ON COLUMN fitness_profiles.injuries IS '부상/제한 사항 (자유 텍스트)';
COMMENT ON COLUMN fitness_profiles.ai_notes IS 'AI가 대화 중 수집한 추가 컨텍스트';

-- RLS 활성화
ALTER TABLE fitness_profiles ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 프로필만 CRUD 가능
-- (provider_id를 통해 auth.uid()와 users.id를 매핑)
CREATE POLICY "Users can view own fitness profile" ON fitness_profiles
  FOR SELECT USING (auth.uid() IN (
    SELECT provider_id::uuid FROM users WHERE id = user_id
  ));

CREATE POLICY "Users can insert own fitness profile" ON fitness_profiles
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT provider_id::uuid FROM users WHERE id = user_id
  ));

CREATE POLICY "Users can update own fitness profile" ON fitness_profiles
  FOR UPDATE USING (auth.uid() IN (
    SELECT provider_id::uuid FROM users WHERE id = user_id
  ));

CREATE POLICY "Users can delete own fitness profile" ON fitness_profiles
  FOR DELETE USING (auth.uid() IN (
    SELECT provider_id::uuid FROM users WHERE id = user_id
  ));

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_fitness_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_fitness_profile_updated_at
  BEFORE UPDATE ON fitness_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_fitness_profile_updated_at();
