'use client';

import { CigaretteIcon, CigaretteSlashIcon } from '@phosphor-icons/react';
import { WheelPicker } from '@/components/ui/WheelPicker';
import { HEIGHT_RANGE, WEIGHT_RANGE } from '@/lib/types/user';

interface ProfileBodyInfoInputProps {
  height: string;
  weight: string;
  isSmoker: boolean | undefined;
  onHeightChange: (value: string) => void;
  onWeightChange: (value: string) => void;
  onSmokerChange: (value: boolean) => void;
}

// WheelPicker 옵션 (범위 상수에서 생성)
const heightOptions = Array.from({ length: HEIGHT_RANGE.max - HEIGHT_RANGE.min + 1 }, (_, i) => ({
  value: String(HEIGHT_RANGE.min + i),
  label: `${HEIGHT_RANGE.min + i}cm`,
}));

const weightOptions = Array.from({ length: WEIGHT_RANGE.max - WEIGHT_RANGE.min + 1 }, (_, i) => ({
  value: String(WEIGHT_RANGE.min + i),
  label: `${WEIGHT_RANGE.min + i}kg`,
}));

export default function ProfileBodyInfoInput({
  height,
  weight,
  isSmoker,
  onHeightChange,
  onWeightChange,
  onSmokerChange,
}: ProfileBodyInfoInputProps) {
  return (
    <div className="space-y-6">
      {/* 키/몸무게 WheelPicker */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">키</label>
          <div className="bg-muted/20 rounded-xl p-2">
            <WheelPicker
              options={heightOptions}
              value={height || '175'}
              onChange={onHeightChange}
              itemHeight={40}
              visibleItems={3}
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">몸무게</label>
          <div className="bg-muted/20 rounded-xl p-2">
            <WheelPicker
              options={weightOptions}
              value={weight || '70'}
              onChange={onWeightChange}
              itemHeight={40}
              visibleItems={3}
            />
          </div>
        </div>
      </div>

      {/* 흡연 여부 - 토글 스위치 */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">흡연</span>
          {isSmoker !== undefined && (
            <span className={`flex items-center gap-1 text-xs ${
              isSmoker ? 'text-orange-500' : 'text-emerald-500'
            }`}>
              {isSmoker ? (
                <><CigaretteIcon size={14} /> 흡연</>
              ) : (
                <><CigaretteSlashIcon size={14} /> 비흡연</>
              )}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onSmokerChange(!(isSmoker ?? false))}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
            isSmoker ? 'bg-orange-500' : 'bg-emerald-500'
          }`}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
              isSmoker ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
