'use client';

import { Shield } from 'lucide-react';
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
    <div className="flex flex-col items-center space-y-6 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
        <Shield className="h-12 w-12 text-primary" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-card-foreground">본인 확인이 필요해요</h2>
        <p className="text-sm text-muted-foreground">
          루티너스는 현역 군인을 위한 서비스예요.
          <br />
          PASS 앱으로 본인 확인을 진행해 주세요.
        </p>
      </div>

      <div className="w-full space-y-3 rounded-2xl bg-muted/30 border border-border p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            1
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-card-foreground">PASS 앱 실행</p>
            <p className="text-xs text-muted-foreground">본인 확인을 위해 PASS 앱이 실행됩니다</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            2
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-card-foreground">본인 인증</p>
            <p className="text-xs text-muted-foreground">PASS 앱에서 본인 확인을 완료해 주세요</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            3
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-card-foreground">자동 진행</p>
            <p className="text-xs text-muted-foreground">인증 완료 시 다음 단계로 이동합니다</p>
          </div>
        </div>
      </div>

      <Button variant="primary" size="lg" fullWidth onClick={handlePassVerification}>
        <Shield className="h-5 w-5" />
        PASS로 본인 확인
      </Button>

      <p className="text-xs text-muted-foreground">
        본인 확인 정보는 서비스 이용 목적으로만 사용되며,
        <br />
        실명은 공개되지 않습니다.
      </p>
    </div>
  );
}
