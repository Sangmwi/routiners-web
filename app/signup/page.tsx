'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PassVerificationStep from '@/components/signup/PassVerificationStep';
import MilitaryFlowContainer from '@/components/signup/military/MilitaryFlowContainer';
import ConfirmationStep from '@/components/signup/ConfirmationStep';
import { useCompleteSignup, useWebViewCore } from '@/hooks';
import { useShowError } from '@/lib/stores/errorStore';
import { PassVerificationData, MilitaryInfoData, isApiError, getErrorMessageByCode } from '@/lib/types';

export default function SignupPage() {
  const router = useRouter();
  const { isInWebView } = useWebViewCore();
  const completeSignupMutation = useCompleteSignup();

  const showError = useShowError();
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
      if (isApiError(error)) {
        showError(getErrorMessageByCode(error.code));
      } else {
        showError('가입에 실패했습니다. 다시 시도해 주세요.');
      }
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Full-screen step content */}
      <div className="flex-1 flex flex-col min-h-0">
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
    </div>
  );
}


