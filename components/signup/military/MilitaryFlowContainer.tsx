'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { MilitaryInfoData, Rank, Specialty } from '@/lib/types/user';
import { EnlistmentStep } from './EnlistmentStep';
import { RankStep } from './RankStep';
import { UnitStep } from './UnitStep';
import { SpecialtyStep } from './SpecialtyStep';
import { NicknameStep } from './NicknameStep';

interface MilitaryFlowContainerProps {
  onComplete: (data: MilitaryInfoData) => void;
  onBack: () => void;
}

type SubStep = 'enlistment' | 'rank' | 'unit' | 'specialty' | 'nickname';

const SUB_STEPS: SubStep[] = ['enlistment', 'rank', 'unit', 'specialty', 'nickname'];

interface FormData {
  enlistmentYear: string;
  enlistmentMonth: string;
  rank: Rank | null;
  unitId: string;
  unitName: string;
  specialty: Specialty | null;
  nickname: string;
}

/**
 * MilitaryFlowContainer
 *
 * 토스식 멀티스텝 군인정보 입력 플로우
 * - 한 화면 = 한 질문
 * - 슬라이드 애니메이션
 * - 뒤로가기 지원
 */
export default function MilitaryFlowContainer({
  onComplete,
  onBack,
}: MilitaryFlowContainerProps) {
  const [currentSubStep, setCurrentSubStep] = useState<SubStep>('enlistment');
  const [formData, setFormData] = useState<FormData>({
    enlistmentYear: '',
    enlistmentMonth: '',
    rank: null,
    unitId: '',
    unitName: '',
    specialty: null,
    nickname: '',
  });

  const currentIndex = SUB_STEPS.indexOf(currentSubStep);
  const totalSteps = SUB_STEPS.length;

  const goNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < SUB_STEPS.length) {
      setCurrentSubStep(SUB_STEPS[nextIndex]);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentSubStep(SUB_STEPS[currentIndex - 1]);
    } else {
      onBack();
    }
  };

  const handleEnlistmentComplete = (year: string, month: string) => {
    setFormData((prev) => ({ ...prev, enlistmentYear: year, enlistmentMonth: month }));
    goNext();
  };

  const handleRankComplete = (rank: Rank) => {
    setFormData((prev) => ({ ...prev, rank }));
    goNext();
  };

  const handleUnitComplete = (unitId: string, unitName: string) => {
    setFormData((prev) => ({ ...prev, unitId, unitName }));
    goNext();
  };

  const handleSpecialtyComplete = (specialty: Specialty) => {
    setFormData((prev) => ({ ...prev, specialty }));
    goNext();
  };

  const handleNicknameComplete = (nickname: string) => {
    // 최종 데이터 조합
    const finalData: MilitaryInfoData = {
      enlistmentMonth: `${formData.enlistmentYear}-${formData.enlistmentMonth}`,
      rank: formData.rank!,
      unitId: formData.unitId,
      unitName: formData.unitName,
      specialty: formData.specialty!,
      nickname,
    };
    onComplete(finalData);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto px-6 py-8">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <button
          onClick={goBack}
          className="p-2 -ml-2 rounded-full hover:bg-muted active:bg-muted/80 transition-colors"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>

        {/* Progress bar inline */}
        <div className="flex-1 mx-4 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
            style={{ width: `${((currentIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-0.5 text-sm">
          <span className="font-medium text-foreground">{currentIndex + 1}</span>
          <span className="text-muted-foreground">/{totalSteps}</span>
        </div>
      </div>

      {/* Content area - each step handles its own scroll */}
      <div className="flex-1 w-full min-h-0">
        {currentSubStep === 'enlistment' && (
          <EnlistmentStep
            initialYear={formData.enlistmentYear}
            initialMonth={formData.enlistmentMonth}
            onNext={handleEnlistmentComplete}
          />
        )}

        {currentSubStep === 'rank' && (
          <RankStep
            selectedRank={formData.rank}
            enlistmentDate={
              formData.enlistmentYear && formData.enlistmentMonth
                ? `${formData.enlistmentYear}-${formData.enlistmentMonth}`
                : undefined
            }
            onNext={handleRankComplete}
          />
        )}

        {currentSubStep === 'unit' && (
          <UnitStep
            selectedUnitId={formData.unitId}
            selectedUnitName={formData.unitName}
            onNext={handleUnitComplete}
          />
        )}

        {currentSubStep === 'specialty' && (
          <SpecialtyStep
            selectedSpecialty={formData.specialty}
            onNext={handleSpecialtyComplete}
          />
        )}

        {currentSubStep === 'nickname' && (
          <NicknameStep
            initialNickname={formData.nickname}
            rank={formData.rank || '이병'}
            specialty={formData.specialty || '기타'}
            onNext={handleNicknameComplete}
          />
        )}
      </div>
    </div>
  );
}
