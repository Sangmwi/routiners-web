'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Utensils, Calendar, Clock, Check, Edit2, AlertTriangle, Flame, Beef } from 'lucide-react';
import type {
  MealPlanPreviewData,
  MealPreviewWeek,
  MealPreviewDay,
  MealPreviewMeal,
} from '@/lib/types/meal';
import { MEAL_TYPE_LABELS } from '@/lib/types/meal';

interface ChatMealPreviewProps {
  /** 식단 미리보기 데이터 */
  preview: MealPlanPreviewData;
  /** 적용 버튼 클릭 (forceOverwrite: true면 기존 식단 덮어쓰기) */
  onApply: (forceOverwrite?: boolean) => void;
  /** 수정 요청 */
  onRequestRevision: (feedback: string) => void;
  /** 로딩 상태 */
  isApplying?: boolean;
}

const DAY_NAMES = ['', '월', '화', '수', '목', '금', '토', '일'];

/**
 * 단일 식사 카드 (아침/점심/저녁/간식)
 */
function MealCard({ meal }: { meal: MealPreviewMeal }) {
  return (
    <div className="bg-lime-500/5 rounded-lg p-2">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-medium text-lime-600 dark:text-lime-400">
          {MEAL_TYPE_LABELS[meal.type]}
        </span>
        {meal.time && (
          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            {meal.time}
          </span>
        )}
        {meal.totalCalories && (
          <span className="text-xs text-muted-foreground flex items-center gap-0.5 ml-auto">
            <Flame className="w-3 h-3" />
            {meal.totalCalories}kcal
          </span>
        )}
      </div>
      <div className="space-y-0.5">
        {meal.foods.map((food, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between text-xs text-muted-foreground"
          >
            <span className="truncate">{food.name}</span>
            <span className="text-muted-foreground/60 shrink-0 ml-2">
              {food.portion}
              {food.protein && <span className="text-lime-500 ml-1">P{food.protein}g</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 하루 식단 카드
 */
function DayCard({ day }: { day: MealPreviewDay }) {
  return (
    <div className="pl-4 py-2 border-l-2 border-lime-500/30">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-foreground">
          {DAY_NAMES[day.dayOfWeek]}요일
        </span>
        {day.totalCalories && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Flame className="w-3 h-3" />
            {day.totalCalories}kcal
          </span>
        )}
      </div>
      <div className="space-y-2">
        {day.meals.map((meal, idx) => (
          <MealCard key={idx} meal={meal} />
        ))}
      </div>
      {day.notes && (
        <p className="text-xs text-muted-foreground mt-2 italic">{day.notes}</p>
      )}
    </div>
  );
}

/**
 * 주차 카드 (접기/펼치기)
 */
function WeekCard({ week, defaultOpen = false }: { week: MealPreviewWeek; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-lime-500/5 hover:bg-lime-500/10 transition-colors"
      >
        <span className="text-sm font-medium">
          {week.weekNumber}주차
        </span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{week.days.length}일</span>
          {isOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="p-3 space-y-3 bg-background">
          {week.days.map((day, idx) => (
            <DayCard key={idx} day={day} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 식단 미리보기 컴포넌트
 *
 * AI가 생성한 식단을 미리보기로 표시
 * 사용자가 확인 후 적용하거나 수정 요청 가능
 */
export default function ChatMealPreview({
  preview,
  onApply,
  onRequestRevision,
  isApplying = false,
}: ChatMealPreviewProps) {
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [revisionText, setRevisionText] = useState('');

  const hasConflicts = preview.conflicts && preview.conflicts.length > 0;

  const handleRevisionSubmit = () => {
    if (revisionText.trim()) {
      onRequestRevision(revisionText.trim());
      setRevisionText('');
      setShowRevisionInput(false);
    }
  };

  return (
    <div className="my-4 mx-1 rounded-xl border border-lime-500/30 bg-card overflow-hidden">
      {/* 헤더 */}
      <div className="p-4 border-b border-border bg-lime-500/5">
        <div className="flex items-center gap-2 mb-1">
          <Utensils className="w-5 h-5 text-lime-500" />
          <h3 className="font-semibold text-foreground">{preview.title}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{preview.description}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {preview.durationWeeks}주
          </span>
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3" />
            일 {preview.targetCalories}kcal
          </span>
          <span className="flex items-center gap-1">
            <Beef className="w-3 h-3" />
            단백질 {preview.targetProtein}g
          </span>
        </div>
      </div>

      {/* 충돌 경고 */}
      {hasConflicts && (
        <div className="p-3 bg-amber-500/10 border-b border-amber-500/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-600 dark:text-amber-400">
                기존 식단 {preview.conflicts!.length}개와 겹칩니다
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                적용하면 해당 날짜의 기존 식단이 새 식단으로 대체됩니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 주차별 목록 */}
      <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
        {preview.weeks.map((week, idx) => (
          <WeekCard key={week.weekNumber} week={week} defaultOpen={idx === 0} />
        ))}
      </div>

      {/* 액션 버튼 */}
      <div className="p-4 border-t border-border bg-lime-500/5">
        {!showRevisionInput ? (
          <div className="flex gap-2">
            <button
              onClick={() => setShowRevisionInput(true)}
              disabled={isApplying}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Edit2 className="w-4 h-4" />
              수정 요청
            </button>
            <button
              onClick={() => onApply(hasConflicts)}
              disabled={isApplying}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                hasConflicts
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-lime-500 text-white hover:bg-lime-600'
              }`}
            >
              {isApplying ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  적용 중...
                </>
              ) : hasConflicts ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  덮어쓰고 적용
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  이 식단 적용
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <textarea
                value={revisionText}
                onChange={(e) => setRevisionText(e.target.value)}
                placeholder="수정하고 싶은 내용을 알려주세요... (예: 단백질을 더 추가해줘)"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-lime-500/50"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowRevisionInput(false);
                  setRevisionText('');
                }}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleRevisionSubmit}
                disabled={!revisionText.trim()}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-lime-500 text-white hover:bg-lime-600 transition-colors disabled:opacity-50"
              >
                수정 요청
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
