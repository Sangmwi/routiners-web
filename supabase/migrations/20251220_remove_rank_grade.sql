-- Migration: Remove rank_grade column from users table
-- Date: 2024-12-20
-- Description: Simplify rank system by removing 호봉 (rank_grade)
--              Keep only simple ranks: 이병, 일병, 상병, 병장

-- Step 1: Drop the rank_grade column from users table
ALTER TABLE users DROP COLUMN IF EXISTS rank_grade;

-- Step 2: Update rank column to use simple Korean rank names directly
-- Convert existing enum-style values to Korean
UPDATE users SET rank = '이병' WHERE rank = 'private';
UPDATE users SET rank = '일병' WHERE rank = 'private_first_class';
UPDATE users SET rank = '상병' WHERE rank = 'corporal';
UPDATE users SET rank = '병장' WHERE rank = 'sergeant';

-- Step 3: Add check constraint to validate rank values
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_rank_check;
ALTER TABLE users ADD CONSTRAINT users_rank_check
  CHECK (rank IN ('이병', '일병', '상병', '병장'));

-- Step 4: Update the public_user_profiles view to remove rank_grade
DROP VIEW IF EXISTS public_user_profiles;

CREATE VIEW public_user_profiles AS
SELECT
  id,
  nickname,
  gender,
  rank,
  unit_name,
  specialty,
  profile_images[1] as profile_image_url,
  bio,
  height_cm,
  weight_kg,
  CASE WHEN show_body_metrics THEN skeletal_muscle_mass_kg ELSE NULL END as skeletal_muscle_mass_kg,
  CASE WHEN show_body_metrics THEN body_fat_percentage ELSE NULL END as body_fat_percentage,
  interested_exercise_locations,
  interested_exercise_types,
  is_smoker,
  created_at
FROM users;

-- Step 5: Recreate the recommendations function without rank_grade
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
  profile_images TEXT[],
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
    scored_users.profile_images,
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
  ORDER BY scored_users.similarity_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_recommendations TO authenticated;

COMMENT ON FUNCTION get_user_recommendations IS '사용자 추천 알고리즘 - DB에서 직접 스코어링하여 성능 최적화 (rank_grade 제거됨)';
