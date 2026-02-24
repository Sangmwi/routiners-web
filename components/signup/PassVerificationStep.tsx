'use client';

import { ShieldIcon } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';

interface PassVerificationStepProps {
  onVerified: (data: {
    realName: string;
    phoneNumber: string;
    birthDate: string;
    gender: 'male' | 'female';
  }) => void;
}

export default function PassVerificationStep({ onVerified }: PassVerificationStepProps) {
  const handlePassVerification = async () => {
    // TODO: Integrate with actual PASS API
    // For now, simulate the verification
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock data (in production, this would come from PASS)
    onVerified({
      realName: '홍길동',
      phoneNumber: '01012345678',
      birthDate: '1998-03-15',
      gender: 'male',
    });
  };

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto px-6 py-8">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6">
          {/* Icon + Title */}
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-surface-accent flex items-center justify-center">
              <ShieldIcon size={24} className="text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">본인 확인이 필요해요</h1>
              <p className="text-muted-foreground">
                루티너스는 현역 군인을 위한 서비스예요.
                <br />
                PASS 앱으로 본인 확인을 진행해 주세요.
              </p>
            </div>
          </div>

          {/* Steps Guide */}
          <div className="space-y-4 rounded-2xl bg-surface-secondary border border-border p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shrink-0">
                1
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">PASS 앱 실행</p>
                <p className="text-xs text-muted-foreground">본인 확인을 위해 PASS 앱이 실행돼요</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shrink-0">
                2
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">본인 인증</p>
                <p className="text-xs text-muted-foreground">PASS 앱에서 본인 확인을 완료해 주세요</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shrink-0">
                3
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">자동 진행</p>
                <p className="text-xs text-muted-foreground">인증 완료 시 다음 단계로 이동해요</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="shrink-0 pt-6 pb-safe">
        <Button variant="primary" size="lg" fullWidth onClick={handlePassVerification}>
          <ShieldIcon size={20} />
          PASS로 본인 확인
        </Button>
      </div>
    </div>
  );
}
