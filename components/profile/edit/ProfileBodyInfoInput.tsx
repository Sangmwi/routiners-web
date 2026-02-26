'use client';

import { CigaretteIcon, CigaretteSlashIcon } from '@phosphor-icons/react';

interface ProfileBodyInfoInputProps {
  isSmoker: boolean | undefined;
  onSmokerChange: (value: boolean) => void;
}

export default function ProfileBodyInfoInput({
  isSmoker,
  onSmokerChange,
}: ProfileBodyInfoInputProps) {
  return (
    <div className="space-y-6">
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
