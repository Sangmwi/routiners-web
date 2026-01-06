'use client';

import { Cigarette, CigaretteOff } from 'lucide-react';
import FormSection from '@/components/ui/FormSection';

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
  const heightValue = height ? Number(height) : HEIGHT_CONFIG.default;
  const weightValue = weight ? Number(weight) : WEIGHT_CONFIG.default;

  return (
    <FormSection
      title="신체 정보"
      description="슬라이더를 움직여 입력하세요."
    >
      <div className="space-y-6">
        {/* 신장 슬라이더 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">신장</span>
            <span className="text-sm font-medium text-foreground">
              {height || '-'} cm
            </span>
          </div>
          <input
            type="range"
            min={HEIGHT_CONFIG.min}
            max={HEIGHT_CONFIG.max}
            step={1}
            value={heightValue}
            onChange={(e) => onHeightChange(e.target.value)}
            className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{HEIGHT_CONFIG.min}cm</span>
            <span>{HEIGHT_CONFIG.max}cm</span>
          </div>
        </div>

        {/* 체중 슬라이더 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">체중</span>
            <span className="text-sm font-medium text-foreground">
              {weight || '-'} kg
            </span>
          </div>
          <input
            type="range"
            min={WEIGHT_CONFIG.min}
            max={WEIGHT_CONFIG.max}
            step={1}
            value={weightValue}
            onChange={(e) => onWeightChange(e.target.value)}
            className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{WEIGHT_CONFIG.min}kg</span>
            <span>{WEIGHT_CONFIG.max}kg</span>
          </div>
        </div>

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
