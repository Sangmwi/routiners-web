-- profile_images (text[]) → profile_photo_url (text) 마이그레이션
-- 프로필 사진을 단일 URL로 변경 (게시글 사진과 분리)

-- 1. 새 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url text;

-- 2. 기존 데이터 마이그레이션 (첫번째 이미지 → profile_photo_url)
UPDATE users SET profile_photo_url = profile_images[1]
WHERE profile_images IS NOT NULL AND array_length(profile_images, 1) > 0;

-- 3. 기존 배열 컬럼 제거
ALTER TABLE users DROP COLUMN IF EXISTS profile_images;

-- 4. 추천 함수 업데이트 (profile_images → profile_photo_url)
CREATE OR REPLACE FUNCTION get_user_recommendations(
  p_user_id UUID,
  p_unit_id TEXT,
  p_interested_exercises TEXT[],
  p_interested_locations TEXT[],
  p_height INTEGER,
  p_weight INTEGER,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  provider_id TEXT,
  email TEXT,
  real_name TEXT,
  phone_number TEXT,
  birth_date DATE,
  gender TEXT,
  nickname TEXT,
  enlistment_month TEXT,
  rank TEXT,
  unit_id TEXT,
  unit_name TEXT,
  specialty TEXT,
  profile_photo_url TEXT,
  bio TEXT,
  height_cm INTEGER,
  weight_kg INTEGER,
  skeletal_muscle_mass_kg NUMERIC,
  body_fat_percentage NUMERIC,
  interested_exercise_locations TEXT[],
  interested_exercise_types TEXT[],
  is_smoker BOOLEAN,
  show_body_metrics BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  similarity_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH scored_users AS (
    SELECT
      u.*,
      (
        -- 1. Same unit (40 points)
        CASE WHEN u.unit_id = p_unit_id THEN 40 ELSE 0 END +

        -- 2. Interested exercises overlap (30 points)
        CASE
          WHEN cardinality(p_interested_exercises) > 0
            AND cardinality(u.interested_exercise_types) > 0
          THEN (
            cardinality(
              ARRAY(
                SELECT unnest(p_interested_exercises)
                INTERSECT
                SELECT unnest(u.interested_exercise_types)
              )
            )::NUMERIC /
            GREATEST(
              cardinality(p_interested_exercises),
              cardinality(u.interested_exercise_types)
            )
          ) * 30
          ELSE 0
        END +

        -- 3. Interested locations overlap (20 points)
        CASE
          WHEN cardinality(p_interested_locations) > 0
            AND cardinality(u.interested_exercise_locations) > 0
          THEN (
            cardinality(
              ARRAY(
                SELECT unnest(p_interested_locations)
                INTERSECT
                SELECT unnest(u.interested_exercise_locations)
              )
            )::NUMERIC /
            GREATEST(
              cardinality(p_interested_locations),
              cardinality(u.interested_exercise_locations)
            )
          ) * 20
          ELSE 0
        END +

        -- 4. Physical similarity (10 points)
        CASE
          WHEN p_height IS NOT NULL
            AND p_weight IS NOT NULL
            AND u.height_cm IS NOT NULL
            AND u.weight_kg IS NOT NULL
          THEN (
            GREATEST(0, (5 - ABS(p_height - u.height_cm))::NUMERIC / 5) * 5 +
            GREATEST(0, (5 - ABS(p_weight - u.weight_kg))::NUMERIC / 5) * 5
          )
          ELSE 0
        END
      ) AS similarity_score
    FROM users u
    WHERE u.id != p_user_id
  )
  SELECT
    scored_users.id,
    scored_users.provider_id,
    scored_users.email,
    scored_users.real_name,
    scored_users.phone_number,
    scored_users.birth_date,
    scored_users.gender,
    scored_users.nickname,
    scored_users.enlistment_month,
    scored_users.rank,
    scored_users.unit_id,
    scored_users.unit_name,
    scored_users.specialty,
    scored_users.profile_photo_url,
    scored_users.bio,
    scored_users.height_cm,
    scored_users.weight_kg,
    scored_users.skeletal_muscle_mass_kg,
    scored_users.body_fat_percentage,
    scored_users.interested_exercise_locations,
    scored_users.interested_exercise_types,
    scored_users.is_smoker,
    scored_users.show_body_metrics,
    scored_users.created_at,
    scored_users.updated_at,
    scored_users.similarity_score
  FROM scored_users
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_user_recommendations TO authenticated;
