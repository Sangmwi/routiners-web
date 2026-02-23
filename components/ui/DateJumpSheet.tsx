'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Modal, { ModalBody } from '@/components/ui/Modal';
import { DatePicker, YearMonthPicker } from '@/components/ui/WheelPicker';
import { formatDate } from '@/lib/utils/dateHelpers';

interface DateJumpSheetBaseProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickToday?: () => void;
  title?: string;
  confirmLabel?: string;
  quickTodayLabel?: string;
}

type DateJumpSheetDateProps = DateJumpSheetBaseProps & {
  mode: 'date';
  value: string;
  minDate?: string;
  maxDate?: string;
  onConfirm: (payload: { date: string }) => void;
};

type DateJumpSheetYearMonthProps = DateJumpSheetBaseProps & {
  mode: 'yearMonth';
  year: string;
  month: string;
  yearRange?: { start: number; end: number };
  onConfirm: (payload: { year: string; month: string }) => void;
};

export type DateJumpSheetProps =
  | DateJumpSheetDateProps
  | DateJumpSheetYearMonthProps;

function clampDate(date: string, minDate?: string, maxDate?: string) {
  if (minDate && date < minDate) return minDate;
  if (maxDate && date > maxDate) return maxDate;
  return date;
}

export default function DateJumpSheet(props: DateJumpSheetProps) {
  const {
    isOpen,
    onClose,
    onQuickToday,
    title = '날짜 이동',
    confirmLabel = '적용',
    quickTodayLabel = '오늘',
  } = props;

  const [draftDate, setDraftDate] = useState(
    props.mode === 'date' ? props.value : formatDate(new Date()),
  );
  const [draftYear, setDraftYear] = useState(
    props.mode === 'yearMonth'
      ? props.year
      : String(new Date().getFullYear()),
  );
  const [draftMonth, setDraftMonth] = useState(
    props.mode === 'yearMonth'
      ? props.month
      : String(new Date().getMonth() + 1).padStart(2, '0'),
  );

  const handleQuickToday = () => {
    if (props.mode === 'date') {
      const today = formatDate(new Date());
      setDraftDate(clampDate(today, props.minDate, props.maxDate));
    } else {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

      if (!props.yearRange) {
        setDraftYear(String(currentYear));
        setDraftMonth(currentMonth);
      } else {
        const clampedYear = Math.min(
          props.yearRange.end,
          Math.max(props.yearRange.start, currentYear),
        );

        setDraftYear(String(clampedYear));
        setDraftMonth(
          clampedYear === currentYear
            ? currentMonth
            : clampedYear < currentYear
              ? '12'
              : '01',
        );
      }
    }

    onQuickToday?.();
  };

  const handleConfirm = () => {
    if (props.mode === 'date') {
      props.onConfirm({ date: draftDate });
    } else {
      props.onConfirm({ year: draftYear, month: draftMonth });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      position="bottom"
      enableSwipe
    >
      <ModalBody className="p-4 pb-2">
        {props.mode === 'date' ? (
          <DatePicker
            value={draftDate}
            onChange={setDraftDate}
            minDate={props.minDate}
            maxDate={props.maxDate}
            showLabels={false}
          />
        ) : (
          <YearMonthPicker
            year={draftYear}
            month={draftMonth}
            onYearChange={setDraftYear}
            onMonthChange={setDraftMonth}
            yearRange={props.yearRange}
          />
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="ghost" size="md" onClick={handleQuickToday}>
            {quickTodayLabel}
          </Button>
          <Button variant="primary" size="md" onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
}
