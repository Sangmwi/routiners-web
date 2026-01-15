'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StepIndicator from '@/components/ui/StepIndicator';
import PassVerificationStep from '@/components/signup/PassVerificationStep';
import MilitaryFlowContainer from '@/components/signup/military/MilitaryFlowContainer';
import ConfirmationStep from '@/components/signup/ConfirmationStep';
import { useCompleteSignup, useWebViewCore } from '@/hooks';
import { PassVerificationData, MilitaryInfoData, SignupCompleteData } from '@/lib/types';

const STEPS = ['본인인증', '군인정보', '확인'];

export default function SignupPage() {
  const router = useRouter();
  const { isInWebView } = useWebViewCore();
  const completeSignupMutation = useCompleteSignup();

  const [currentStep, setCurrentStep] = useState(1);
  const [passData, setPassData] = useState<PassVerificationData | null>(null);
  const [militaryData, setMilitaryData] = useState<MilitaryInfoData | null>(null);

  const handlePassVerified = (data: PassVerificationData) => {
    setPassData(data);
    setCurrentStep(2);
  };

  const handleMilitaryInfoComplete = (data: MilitaryInfoData) => {
    setMilitaryData(data);
    setCurrentStep(3);
  };

  const handleBackFromMilitary = () => {
    setCurrentStep(1);
  };

  const handleBackFromConfirmation = () => {
    setCurrentStep(2);
  };

  const handleConfirm = async () => {
    if (!passData || !militaryData) return;

    try {
      // 서버 API가 쿠키 세션으로 인증 처리
      // (WebView에서는 클라이언트 getUser()가 작동하지 않음)
      const signupData = {
        ...passData,
        ...militaryData,
      };

      await completeSignupMutation.mutateAsync(signupData);

      // Redirect to home on success
      // replace 사용 (회원가입 완료 후 뒤로가기 방지)
      // WebView에서는 window.location.replace가 더 확실함
      if (isInWebView) {
        window.location.replace('/');
      } else {
        router.replace('/');
      }
    } catch (error) {
      console.error('Signup failed:', error);
      alert('가입에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  return (
    <div className="relative h-screen bg-background overflow-hidden flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-md px-6 py-8 flex flex-col flex-1 overflow-hidden">
        {/* Step Indicator */}
        <div className="mb-8 shrink-0">
          <StepIndicator steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Step Content */}
        <div
          className={`rounded-3xl bg-card border border-border shadow-lg overflow-hidden flex-1 flex flex-col ${
            currentStep === 2 ? 'p-0' : 'p-8'
          }`}
        >
          {currentStep === 1 && <PassVerificationStep onVerified={handlePassVerified} />}

          {currentStep === 2 && (
            <MilitaryFlowContainer
              onComplete={handleMilitaryInfoComplete}
              onBack={handleBackFromMilitary}
            />
          )}

          {currentStep === 3 && passData && militaryData && (
            <ConfirmationStep
              passData={passData}
              militaryData={militaryData}
              onConfirm={handleConfirm}
              onBack={handleBackFromConfirmation}
              isLoading={completeSignupMutation.isPending}
            />
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground/60 shrink-0">
          © 2024 루티너스. All rights reserved.
        </p>
      </div>
    </div>
  );
}


