-- 사용자 추천 알고리즘을 PostgreSQL 함수로 구현
-- 200명 데이터를 Node.js로 가져와서 처리하는 대신 DB에서 직접 스코어링

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
  rank_grade INTEGER,
  unit_id TEXT,
  unit_name TEXT,
  specialty TEXT,
  profile_image_url TEXT,
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
    id,
    provider_id,
    email,
    real_name,
    phone_number,
    birth_date,
    gender,
    nickname,
    enlistment_month,
    rank,
    rank_grade,
    unit_id,
    unit_name,
    specialty,
    profile_image_url,
    bio,
    height_cm,
    weight_kg,
    skeletal_muscle_mass_kg,
    body_fat_percentage,
    interested_exercise_locations,
    interested_exercise_types,
    is_smoker,
    show_body_metrics,
    created_at,
    updated_at,
    similarity_score
  FROM scored_users
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION get_user_recommendations TO authenticated;

COMMENT ON FUNCTION get_user_recommendations IS '사용자 추천 알고리즘 - DB에서 직접 스코어링하여 성능 최적화';
