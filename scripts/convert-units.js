/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

// JSON 파일 읽기 (NaN 처리)
function readJSONFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // NaN을 null로 변환
  const cleaned = content.replace(/:\s*NaN/g, ': null');
  return JSON.parse(cleaned);
}

const regimentsPath = 'C:/Users/sanghwi/Downloads/rutineus_regiments_seed.json';
const brigadesPath = 'C:/Users/sanghwi/Downloads/rutineus_brigades_units_seed.json';

const regiments = readJSONFile(regimentsPath);
const brigades = readJSONFile(brigadesPath);

// REGIMENT와 BRIGADE만 필터링
const all = [...regiments, ...brigades].filter(
  (u) => u.unit_type === 'REGIMENT' || u.unit_type === 'BRIGADE'
);

// 한글을 영문으로 변환하는 매핑
const koreanToEnglish = {
  '수도포병여단': 'capital-artillery',
  '정보통신여단': 'signal',
  '육군기계화학교_교육여단': 'army-mechanized-school-training',
  '육군보병학교_교육여단': 'army-infantry-school-training',
  '육군포병학교_교육여단': 'army-artillery-school-training',
};

// 한글 제거 및 영문 변환 함수
function generateId(code) {
  let id = code.toLowerCase().replace(/_/g, '-');
  
  // 한글 부분을 영문으로 변환
  for (const [korean, english] of Object.entries(koreanToEnglish)) {
    const koreanInCode = korean.replace(/_/g, '-');
    if (id.includes(koreanInCode)) {
      id = id.replace(koreanInCode, english);
    }
  }
  
  // 남은 한글 문자 제거 (영문, 숫자, 하이픈만 유지)
  id = id.replace(/[^a-z0-9-]/g, '');
  
  // 연속된 하이픈 제거
  id = id.replace(/-+/g, '-');
  
  // 앞뒤 하이픈 제거
  id = id.replace(/^-+|-+$/g, '');
  
  return id;
}

// Unit 형식으로 변환
const units = all.map((u) => ({
  id: generateId(u.code),
  name: u.name,
  type: u.unit_type,
  region: '', // 지역 정보는 나중에 추가 가능
  isActive: u.status !== 'HISTORICAL',
}));

// TypeScript 파일 생성
const outputPath = path.join(__dirname, '../lib/units.ts');

// JSON을 TypeScript 형식으로 변환 (따옴표 제거)
function formatAsTypeScript(obj, indent = 2) {
  const spaces = ' '.repeat(indent);
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    const items = obj.map((item) => `${spaces}${formatAsTypeScript(item, indent + 2)}`).join(',\n');
    return `[\n${items}\n${' '.repeat(indent - 2)}]`;
  }
  if (typeof obj === 'object' && obj !== null) {
    const entries = Object.entries(obj)
      .map(([key, value]) => {
        const formattedValue = typeof value === 'string' ? `'${value.replace(/'/g, "\\'")}'` : formatAsTypeScript(value, indent + 2);
        return `${spaces}${key}: ${formattedValue}`;
      })
      .join(',\n');
    return `{\n${entries}\n${' '.repeat(indent - 2)}}`;
  }
  return String(obj);
}

const tsContent = `export type UnitType = 'BRIGADE' | 'REGIMENT';

export interface Unit {
  id: string; // uuid or stable slug
  name: string; // 제23교육연대
  type: UnitType;
  region: string;
  isActive: boolean;
}

export const UNITS: Unit[] = ${formatAsTypeScript(units)};
`;

fs.writeFileSync(outputPath, tsContent, 'utf8');
console.log(`✅ ${units.length}개의 부대 정보를 ${outputPath}에 생성했습니다.`);
console.log(`   - REGIMENT: ${units.filter((u) => u.type === 'REGIMENT').length}개`);
console.log(`   - BRIGADE: ${units.filter((u) => u.type === 'BRIGADE').length}개`);
