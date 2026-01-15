/**
 * 개인화된 닉네임 추천 유틸리티
 *
 * 사용자의 군 정보(계급, 병과)를 기반으로
 * 개인화된 닉네임을 생성합니다.
 */

// 계급 기반 단어
const RANK_WORDS: Record<string, string[]> = {
  이병: ['신병', '루키', '뉴비', '새싹', '신참'],
  일병: ['성장하는', '일취월장', '파이팅'],
  상병: ['숙련된', '베테랑', '중견', '에이스'],
  병장: ['고참', '짱', '보스', '대선배', '레전드'],
};

// 병과 기반 단어
const SPECIALTY_WORDS: Record<string, string[]> = {
  보병: ['보병', '인팬트리', '돌격병', '전사'],
  포병: ['캐논', '포격수', '아틸러리', '파이어'],
  기갑: ['탱커', '장갑병', '아머', '철갑'],
  공병: ['공병', '엔지니어', '빌더', '건설자'],
  정보통신: ['시그널', '통신병', '넷러너', '테크'],
  항공: ['에어맨', '스카이', '파일럿', '윙맨'],
  화생방: ['케미컬', '방호병', '실드', '가드'],
  병참: ['로지스틱', '보급병', '서플라이', '물류왕'],
  의무: ['메딕', '힐러', '의무병', '라이프'],
  법무: ['저스티스', '법무관', '심판자'],
  행정: ['어드민', '행정관', '매니저'],
  기타: ['솔저', '워리어', '파이터'],
};

// 공통 형용사 (피트니스/운동 관련)
const COMMON_ADJECTIVES = [
  '불타는',
  '강철',
  '무적의',
  '전설의',
  '파워',
  '열정',
  '근육',
  '단단한',
];

// 피트니스 명사
const FITNESS_NOUNS = [
  '헬창',
  '근육맨',
  '머슬러',
  '리프터',
  '짐러',
  '파이터',
  '바디',
];

/**
 * 배열을 무작위로 섞습니다 (Fisher-Yates 알고리즘)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

interface MilitaryInfo {
  rank: string;
  specialty: string;
}

/**
 * 개인화된 닉네임을 생성합니다.
 *
 * @param info - 군 정보 (계급, 병과)
 * @param count - 생성할 닉네임 개수 (기본값: 4)
 * @returns 랜덤하게 섞인 닉네임 배열
 *
 * 조합 규칙:
 * 1. 계급단어 + 피트니스명사: "고참헬창", "신병머슬러"
 * 2. 형용사 + 병과단어: "불타는보병", "강철탱커"
 * 3. 계급단어 + 병과단어: "짱포격수", "루키메딕"
 * 4. 형용사 + 피트니스명사: "무적의근육맨" (fallback)
 */
export function generatePersonalizedNicknames(
  info: MilitaryInfo,
  count: number = 4
): string[] {
  const rankWords = RANK_WORDS[info.rank] || RANK_WORDS['이병'];
  const specialtyWords =
    SPECIALTY_WORDS[info.specialty] || SPECIALTY_WORDS['기타'];

  const combinations: string[] = [];

  // 1. 계급 + 피트니스
  for (const r of rankWords) {
    for (const f of FITNESS_NOUNS) {
      const combo = r + f;
      if (combo.length <= 12) {
        combinations.push(combo);
      }
    }
  }

  // 2. 형용사 + 병과
  for (const a of COMMON_ADJECTIVES) {
    for (const s of specialtyWords) {
      const combo = a + s;
      if (combo.length <= 12) {
        combinations.push(combo);
      }
    }
  }

  // 3. 계급 + 병과
  for (const r of rankWords) {
    for (const s of specialtyWords) {
      const combo = r + s;
      if (combo.length <= 12) {
        combinations.push(combo);
      }
    }
  }

  // 4. 형용사 + 피트니스 (fallback)
  for (const a of COMMON_ADJECTIVES) {
    for (const f of FITNESS_NOUNS) {
      const combo = a + f;
      if (combo.length <= 12) {
        combinations.push(combo);
      }
    }
  }

  // 중복 제거 후 랜덤 셔플
  const unique = [...new Set(combinations)];
  return shuffleArray(unique).slice(0, count);
}
