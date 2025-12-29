-- InBody 측정 기록 테이블
-- 실행: Supabase Dashboard > SQL Editor 또는 supabase db push

CREATE TABLE inbody_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  measured_at DATE NOT NULL,

  -- 핵심 지표 (MVP 공개)
  weight DECIMAL(5,2) NOT NULL,
  skeletal_muscle_mass DECIMAL(5,2) NOT NULL,
  body_fat_percentage DECIMAL(4,1) NOT NULL,
  bmi DECIMAL(4,1),
  inbody_score INTEGER,

  -- 체성분 상세 (비공개, 본인만 조회)
  total_body_water DECIMAL(5,2),
  protein DECIMAL(5,2),
  minerals DECIMAL(5,2),
  body_fat_mass DECIMAL(5,2),

  -- 부위별 근육량
  right_arm_muscle DECIMAL(4,2),
  left_arm_muscle DECIMAL(4,2),
  trunk_muscle DECIMAL(5,2),
  right_leg_muscle DECIMAL(5,2),
  left_leg_muscle DECIMAL(5,2),

  -- 부위별 체지방량
  right_arm_fat DECIMAL(4,2),
  left_arm_fat DECIMAL(4,2),
  trunk_fat DECIMAL(5,2),
  right_leg_fat DECIMAL(5,2),
  left_leg_fat DECIMAL(5,2),

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 같은 날짜에 중복 측정 방지
  UNIQUE(user_id, measured_at)
);

-- 인덱스: 사용자별 측정일 역순 조회 최적화
CREATE INDEX idx_inbody_user_date ON inbody_records(user_id, measured_at DESC);

-- RLS 활성화
ALTER TABLE inbody_records ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 레코드만 CRUD 가능
-- (provider_id를 통해 auth.uid()와 users.id를 매핑)
CREATE POLICY "Users can view own inbody records" ON inbody_records
  FOR SELECT USING (auth.uid() IN (
    SELECT provider_id::uuid FROM users WHERE id = user_id
  ));

CREATE POLICY "Users can insert own inbody records" ON inbody_records
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT provider_id::uuid FROM users WHERE id = user_id
  ));

CREATE POLICY "Users can update own inbody records" ON inbody_records
  FOR UPDATE USING (auth.uid() IN (
    SELECT provider_id::uuid FROM users WHERE id = user_id
  ));

CREATE POLICY "Users can delete own inbody records" ON inbody_records
  FOR DELETE USING (auth.uid() IN (
    SELECT provider_id::uuid FROM users WHERE id = user_id
  ));

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_inbody_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_inbody_updated_at
  BEFORE UPDATE ON inbody_records
  FOR EACH ROW
  EXECUTE FUNCTION update_inbody_updated_at();
