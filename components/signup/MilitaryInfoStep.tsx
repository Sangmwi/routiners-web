'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import UnitSearch from '@/components/signup/UnitSearch';
import { useCheckNickname } from '@/hooks';
import {
  RANK_OPTIONS,
  SPECIALTY_OPTIONS,
  getEnlistmentYears,
  MONTHS,
  validateEnlistmentAndRank,
} from '@/lib/constants/military';
import { UNITS } from '@/lib/constants/units';
import { MilitaryInfoData, Rank, Specialty, Unit } from '@/lib/types';

interface MilitaryInfoStepProps {
  onComplete: (data: MilitaryInfoData) => void;
  onBack: () => void;
}

export default function MilitaryInfoStep({ onComplete, onBack }: MilitaryInfoStepProps) {
  const [enlistmentYear, setEnlistmentYear] = useState('');
  const [enlistmentMonth, setEnlistmentMonth] = useState('');
  const [rank, setRank] = useState<Rank | ''>('');
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [specialty, setSpecialty] = useState<Specialty | ''>('');
  const [nickname, setNickname] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: nicknameCheck } = useCheckNickname(nickname, nickname.length >= 2);

  const enlistmentYears = getEnlistmentYears();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!enlistmentYear) newErrors.enlistmentYear = '입대 연도를 선택해 주세요';
    if (!enlistmentMonth) newErrors.enlistmentMonth = '입대 월을 선택해 주세요';
    if (!rank) newErrors.rank = '계급을 선택해 주세요';
    if (!selectedUnit) newErrors.unit = '소속 부대를 선택해 주세요';
    if (!specialty) newErrors.specialty = '병과를 선택해 주세요';
    if (!nickname) newErrors.nickname = '닉네임을 입력해 주세요';
    else if (nickname.length < 2) newErrors.nickname = '닉네임은 2자 이상이어야 합니다';
    else if (nicknameCheck && !nicknameCheck.available)
      newErrors.nickname = '이미 사용 중인 닉네임입니다';

    // Validate enlistment date and rank
    if (enlistmentYear && enlistmentMonth && rank) {
      const enlistmentDate = `${enlistmentYear}-${enlistmentMonth}`;
      const validation = validateEnlistmentAndRank(enlistmentDate, rank);
      if (!validation.valid) {
        newErrors.rank = validation.message || '입대 시기와 계급이 맞지 않습니다';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: MilitaryInfoData = {
      enlistmentMonth: `${enlistmentYear}-${enlistmentMonth}`,
      rank: rank as Rank,
      unitId: selectedUnit!.id,
      unitName: selectedUnit!.name,
      specialty: specialty as Specialty,
      nickname,
    };

    onComplete(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-foreground">군인 정보 입력</h2>
        <p className="text-sm text-muted-foreground">
          루티너스는 현역 군인을 위한 서비스예요.
          <br />몇 가지만 확인하면 바로 사용할 수 있어요.
        </p>
      </div>

      <div className="space-y-4">
        {/* Enlistment Date */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            입대 시기 <span className="ml-1 text-destructive">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={enlistmentYear}
              onChange={(e) => setEnlistmentYear(e.target.value)}
              options={enlistmentYears.map((year) => ({ value: String(year), label: `${year}년` }))}
              placeholder="연도"
              error={errors.enlistmentYear}
            />
            <Select
              value={enlistmentMonth}
              onChange={(e) => setEnlistmentMonth(e.target.value)}
              options={MONTHS}
              placeholder="월"
              error={errors.enlistmentMonth}
            />
          </div>
        </div>

        {/* Rank */}
        <Select
          label="현재 계급"
          value={rank}
          onChange={(e) => setRank(e.target.value as Rank)}
          options={RANK_OPTIONS}
          placeholder="계급을 선택하세요"
          required
          error={errors.rank}
        />

        {/* Unit Search */}
        <UnitSearch
          units={UNITS}
          selectedUnit={selectedUnit}
          onSelect={setSelectedUnit}
          error={errors.unit}
        />

        {/* Specialty */}
        <Select
          label="병과"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value as Specialty)}
          options={SPECIALTY_OPTIONS}
          placeholder="병과를 선택하세요"
          required
          error={errors.specialty}
        />

        {/* Nickname */}
        <div>
          <Input
            label="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="다른 사용자에게 보여질 이름"
            required
            error={errors.nickname}
            helperText={
              nickname.length >= 2 && nicknameCheck?.available
                ? '사용 가능한 닉네임입니다'
                : '실명은 공개되지 않습니다'
            }
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} fullWidth>
          이전
        </Button>
        <Button type="submit" variant="primary" fullWidth>
          다음
        </Button>
      </div>
    </form>
  );
}
