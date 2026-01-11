'use client';

import { Cigarette, CigaretteOff } from 'lucide-react';
import FormSection from '@/components/ui/FormSection';
import FormSlider from '@/components/ui/FormSlider';

interface ProfileBodyInfoInputProps {
  height: string;
  weight: string;
  isSmoker: boolean | undefined;
  onHeightChange: (value: string) => void;
  onWeightChange: (value: string) => void;
  onSmokerChange: (value: boolean) => void;
}

// 슬라이더 설정
const HEIGHT_CONFIG = { min: 140, max: 200, default: 175 };
const WEIGHT_CONFIG = { min: 40, max: 120, default: 70 };

export default function ProfileBodyInfoInput({
  height,
  weight,
  isSmoker,
  onHeightChange,
  onWeightChange,
  onSmokerChange,
}: ProfileBodyInfoInputProps) {
  return (
    <FormSection
      title="신체 정보"
      description="슬라이더를 움직여 입력하세요."
    >
      <div className="space-y-6">
        <FormSlider
          label="신장"
          value={height}
          onChange={onHeightChange}
          min={HEIGHT_CONFIG.min}
          max={HEIGHT_CONFIG.max}
          unit="cm"
          defaultValue={HEIGHT_CONFIG.default}
        />

        <FormSlider
          label="체중"
          value={weight}
          onChange={onWeightChange}
          min={WEIGHT_CONFIG.min}
          max={WEIGHT_CONFIG.max}
          unit="kg"
          defaultValue={WEIGHT_CONFIG.default}
        />

        {/* 흡연 여부 - 미니멀 토글 */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-muted-foreground">흡연 여부</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onSmokerChange(false)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${
                  isSmoker === false
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }
              `}
            >
              <CigaretteOff className="w-3.5 h-3.5" />
              비흡연
            </button>
            <button
              type="button"
              onClick={() => onSmokerChange(true)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${
                  isSmoker === true
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }
              `}
            >
              <Cigarette className="w-3.5 h-3.5" />
              흡연
            </button>
          </div>
        </div>
      </div>
    </FormSection>
  );
}
