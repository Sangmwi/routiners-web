'use client';

import { useState } from 'react';
import { CalendarIcon } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import { YearMonthPicker } from '@/components/ui/WheelPicker';

interface EnlistmentStepProps {
  initialYear?: string;
  initialMonth?: string;
  onNext: (year: string, month: string) => void;
}

/**
 * EnlistmentStep
 *
 * 입대 시기 선택 (토스식)
 * - 휠 피커로 연월 선택
 * - "다음" 버튼으로 진행
 */
export function EnlistmentStep({
  initialYear,
  initialMonth,
  onNext,
}: EnlistmentStepProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState(initialYear || String(currentYear));
  const [month, setMonth] = useState(initialMonth || String(currentMonth).padStart(2, '0'));

  const isValid = year && month;

  const handleNext = () => {
    if (isValid) {
      onNext(year, month);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6">
          {/* Question */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CalendarIcon size={24} className="text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              언제 입대하셨나요?
            </h2>
            <p className="text-muted-foreground">
              입대 연월을 선택해 주세요
            </p>
          </div>

          {/* Year/Month Picker */}
          <div className="py-4">
            <div className="bg-muted/20 rounded-2xl border border-border p-6">
              <YearMonthPicker
                year={year}
                month={month}
                onYearChange={setYear}
                onMonthChange={setMonth}
                yearRange={{ start: currentYear - 3, end: currentYear + 1 }}
              />
            </div>

            {/* Selected display */}
            <div className="mt-4 text-center">
              <span className="text-lg font-semibold text-primary">
                {year}년 {parseInt(month)}월
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="shrink-0 pt-6 pb-safe">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleNext}
          disabled={!isValid}
        >
          다음
        </Button>
      </div>
    </div>
  );
}
