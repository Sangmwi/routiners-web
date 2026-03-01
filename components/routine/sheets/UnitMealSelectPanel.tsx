'use client';

import { DatePicker } from '@/components/ui/WheelPicker';
import { LoadingSpinner } from '@/components/ui/icons';
import {
  BuildingsIcon,
  MagnifyingGlassIcon,
  CaretDownIcon,
  CaretUpIcon,
  CalendarIcon,
} from '@phosphor-icons/react';
import { formatKoreanDate, addDays, parseDate, formatDate } from '@/lib/utils/dateHelpers';

interface Unit {
  id: string;
  name: string;
  region?: string;
}

interface UnitMealSelectPanelProps {
  // Unit selection
  selectedUnit: Unit | undefined;
  selectedUnitId: string;
  onUnitChange: (id: string) => void;
  showUnitPicker: boolean;
  onToggleUnitPicker: () => void;
  unitSearchQuery: string;
  onUnitSearchChange: (q: string) => void;
  filteredUnits: Unit[];
  // Date range
  startDate: string;
  endDate: string;
  onStartDateChange: (d: string) => void;
  onEndDateChange: (d: string) => void;
  showStartDatePicker: boolean;
  showEndDatePicker: boolean;
  onToggleStartDatePicker: () => void;
  onToggleEndDatePicker: () => void;
  today: string;
  maxDays: number;
  // Date list
  allDates: string[];
  existingMealDates: Set<string>;
  newDates: string[];
  isCheckingExisting: boolean;
}

export default function UnitMealSelectPanel({
  selectedUnit,
  selectedUnitId,
  onUnitChange,
  showUnitPicker,
  onToggleUnitPicker,
  unitSearchQuery,
  onUnitSearchChange,
  filteredUnits,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  showStartDatePicker,
  showEndDatePicker,
  onToggleStartDatePicker,
  onToggleEndDatePicker,
  today,
  maxDays,
  allDates,
  existingMealDates,
  newDates,
  isCheckingExisting,
}: UnitMealSelectPanelProps) {
  return (
    <>
      {/* 부대 선택 */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">부대</h3>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-hover">
          <BuildingsIcon size={20} className="text-muted-foreground" />
          {selectedUnit ? (
            <span className="text-sm font-medium flex-1">{selectedUnit.name}</span>
          ) : (
            <span className="text-sm text-muted-foreground flex-1">부대를 선택해주세요</span>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleUnitPicker}
          className="flex items-center gap-1 text-xs text-primary font-medium"
        >
          {showUnitPicker ? (
            <><CaretUpIcon size={12} weight="bold" />접기</>
          ) : (
            <><CaretDownIcon size={12} weight="bold" />다른 부대 선택</>
          )}
        </button>

        {showUnitPicker && (
          <div className="space-y-2">
            <div className="relative">
              <MagnifyingGlassIcon
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={unitSearchQuery}
                onChange={(e) => onUnitSearchChange(e.target.value)}
                placeholder="부대명 검색..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-muted text-sm placeholder:text-hint focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-edge-subtle divide-y divide-edge-faint">
              {filteredUnits.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground text-center">검색 결과 없음</p>
              ) : (
                filteredUnits.map((unit) => (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => onUnitChange(unit.id)}
                    className={`w-full px-3 py-2.5 text-left text-sm ${
                      unit.id === selectedUnitId
                        ? 'bg-surface-accent text-primary font-medium'
                        : 'text-foreground'
                    }`}
                  >
                    {unit.name}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 날짜 범위 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">불러올 기간</h3>

        {/* 시작일 */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">시작일</p>
          <button
            type="button"
            onClick={onToggleStartDatePicker}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-secondary"
          >
            <CalendarIcon size={18} className="text-muted-foreground" />
            <span className="text-sm font-medium flex-1 text-left">
              {formatKoreanDate(startDate, { year: false, weekday: true, weekdayFormat: 'short' })}
            </span>
            {showStartDatePicker ? (
              <CaretUpIcon size={14} className="text-muted-foreground" />
            ) : (
              <CaretDownIcon size={14} className="text-muted-foreground" />
            )}
          </button>
          {showStartDatePicker && (
            <div className="bg-surface-secondary rounded-xl px-3 py-2">
              <DatePicker value={startDate} onChange={onStartDateChange} minDate={today} showLabels={false} />
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-edge-subtle" />
          <span className="text-xs text-muted-foreground">~</span>
          <div className="flex-1 h-px bg-edge-subtle" />
        </div>

        {/* 종료일 */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">종료일</p>
          <button
            type="button"
            onClick={onToggleEndDatePicker}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-secondary"
          >
            <CalendarIcon size={18} className="text-muted-foreground" />
            <span className="text-sm font-medium flex-1 text-left">
              {formatKoreanDate(endDate, { year: false, weekday: true, weekdayFormat: 'short' })}
            </span>
            {showEndDatePicker ? (
              <CaretUpIcon size={14} className="text-muted-foreground" />
            ) : (
              <CaretDownIcon size={14} className="text-muted-foreground" />
            )}
          </button>
          {showEndDatePicker && (
            <div className="bg-surface-secondary rounded-xl px-3 py-2">
              <DatePicker
                value={endDate}
                onChange={onEndDateChange}
                minDate={startDate}
                maxDate={formatDate(addDays(parseDate(startDate), maxDays - 1))}
                showLabels={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* 날짜 목록 */}
      {selectedUnitId && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">날짜 목록 ({allDates.length}일)</h3>
            {isCheckingExisting && <LoadingSpinner size="sm" variant="muted" />}
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1">
            {allDates.map((d) => {
              const isExisting = existingMealDates.has(d);
              return (
                <div key={d} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-secondary">
                  <CalendarIcon
                    size={16}
                    className={isExisting ? 'text-hint-faint' : 'text-foreground'}
                  />
                  <span className={`text-sm flex-1 ${isExisting ? 'text-hint line-through' : 'text-foreground'}`}>
                    {formatKoreanDate(d, { year: false, weekday: true, weekdayFormat: 'short' })}
                  </span>
                  {isExisting && (
                    <span className="text-xs bg-surface-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      등록됨
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {existingMealDates.size > 0 && newDates.length > 0 && (
            <p className="text-xs text-muted-foreground">기존 식단이 있는 날은 건너뜁니다</p>
          )}
          {newDates.length === 0 && !isCheckingExisting && (
            <p className="text-xs text-yellow-500">
              선택한 기간에 이미 모든 식단이 등록되어 있어요
            </p>
          )}
        </div>
      )}
    </>
  );
}
