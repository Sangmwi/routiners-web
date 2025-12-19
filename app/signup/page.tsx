'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import StepIndicator from '@/components/ui/StepIndicator';
import PassVerificationStep from '@/components/signup/PassVerificationStep';
import MilitaryInfoStep from '@/components/signup/MilitaryInfoStep';
import ConfirmationStep from '@/components/signup/ConfirmationStep';
import { useCompleteSignup } from '@/lib/hooks/useAuth';
import { PassVerificationData, MilitaryInfoData, SignupCompleteData } from '@/lib/types';

const STEPS = ['본인인증', '군인정보', '확인'];

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
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
      // Get current auth user
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('Not authenticated');
      }

      const signupData: SignupCompleteData = {
        providerId: authUser.id,
        email: authUser.email || '',
        ...passData,
        ...militaryData,
      };

      await completeSignupMutation.mutateAsync(signupData);

      // Redirect to home on success
      router.push('/');
    } catch (error) {
      console.error('Signup failed:', error);
      alert('가입에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-md px-6 py-8">
        {/* Step Indicator */}
        <div className="mb-8">
          <StepIndicator steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Step Content */}
        <div className="rounded-3xl bg-card border border-border p-8 shadow-lg">
          {currentStep === 1 && <PassVerificationStep onVerified={handlePassVerified} />}

          {currentStep === 2 && militaryData === null && (
            <MilitaryInfoStep onComplete={handleMilitaryInfoComplete} onBack={handleBackFromMilitary} />
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
        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          © 2024 루티너스. All rights reserved.
        </p>
      </div>
    </div>
  );
}


