'use client';

import { CheckCircleIcon } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import { PassVerificationData, MilitaryInfoData } from '@/lib/types';

interface ConfirmationStepProps {
  passData: PassVerificationData;
  militaryData: MilitaryInfoData;
  onConfirm: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function ConfirmationStep({
  militaryData,
  onConfirm,
  onBack,
  isLoading = false,
}: ConfirmationStepProps) {
  const formatDate = (dateString: string) => {
    const [year, month] = dateString.split('-');
    return `${year}년 ${parseInt(month)}월`;
  };

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto px-6 py-8">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6">
          {/* Icon + Title */}
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircleIcon size={24} className="text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">입력하신 정보를 확인해 주세요</h1>
              <p className="text-muted-foreground">아래 정보로 가입을 완료해요</p>
            </div>
          </div>

          {/* Info Summary */}
          <div className="space-y-3 rounded-2xl bg-muted/20 p-5 border border-border">
            <InfoRow label="닉네임" value={militaryData.nickname} />
            <InfoRow label="입대 시기" value={formatDate(militaryData.enlistmentMonth)} />
            <InfoRow label="계급" value={militaryData.rank.replace('-', ' ')} />
            <InfoRow label="소속 부대" value={militaryData.unitName} />
            <InfoRow label="병과" value={militaryData.specialty} />
          </div>

          {/* Privacy Notice */}
          <div className="rounded-xl bg-primary/10 p-4">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">본인 확인 완료</span>
              <br />
              실명, 전화번호, 생년월일 정보는 본인 확인용으로만 사용되며 다른 사용자에게 공개되지 않아요.
            </p>
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="shrink-0 pt-6 pb-safe">
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack} fullWidth disabled={isLoading}>
            이전
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            fullWidth
            isLoading={isLoading}
          >
            가입 완료
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}
