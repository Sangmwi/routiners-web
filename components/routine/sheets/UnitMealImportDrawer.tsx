'use client';

import Modal, { ModalBody } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import GradientFooter from '@/components/ui/GradientFooter';
import { useUnitMealImportState } from '@/hooks/routine';
import UnitMealSelectPanel from './UnitMealSelectPanel';
import UnitMealProgressPanel from './UnitMealProgressPanel';

interface UnitMealImportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  date: string; // anchor date
  onCreated?: () => void;
}

export default function UnitMealImportDrawer({
  isOpen,
  onClose,
  date,
  onCreated,
}: UnitMealImportDrawerProps) {
  const s = useUnitMealImportState(date);

  const handleClose = () => {
    if (s.isImporting) return;
    s.abortRef.current = true;
    s.resetState();
    onClose();
  };

  const handleDone = () => {
    handleClose();
    if (s.savedCount > 0) onCreated?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="부대 식단 불러오기"
      position="bottom"
      height="full"
      showCloseButton={!s.isImporting}
      stickyFooter={
        <GradientFooter variant="sheet">
          {s.step === 'select' && (
            <Button
              variant="primary"
              fullWidth
              onClick={s.handleStartImport}
              disabled={!s.selectedUnitId || s.newDates.length === 0 || !s.isRangeValid || s.isCheckingExisting}
              isLoading={s.isCheckingExisting}
              className="shadow-none hover:shadow-none"
            >
              {s.isCheckingExisting
                ? '확인 중...'
                : !s.selectedUnitId
                  ? '부대를 선택해주세요'
                  : s.newDates.length === 0
                    ? '불러올 날짜가 없어요'
                    : `${s.newDates.length}일분 식단 불러오기`}
            </Button>
          )}
          {s.step === 'importing' && (
            <Button
              variant="primary"
              fullWidth
              onClick={handleDone}
              disabled={!s.importDone}
              isLoading={s.isImporting}
              className="shadow-none hover:shadow-none"
            >
              {s.isImporting ? '불러오는 중...' : '확인'}
            </Button>
          )}
        </GradientFooter>
      }
    >
      <ModalBody className="p-4 space-y-5">
        {s.step === 'select' && (
          <UnitMealSelectPanel
            selectedUnit={s.selectedUnit}
            selectedUnitId={s.selectedUnitId}
            onUnitChange={(id) => {
              s.setSelectedUnitId(id);
              s.setShowUnitPicker(false);
              s.setUnitSearchQuery('');
            }}
            showUnitPicker={s.showUnitPicker}
            onToggleUnitPicker={() => s.setShowUnitPicker((prev) => !prev)}
            unitSearchQuery={s.unitSearchQuery}
            onUnitSearchChange={s.setUnitSearchQuery}
            filteredUnits={s.filteredUnits}
            startDate={s.startDate}
            endDate={s.endDate}
            onStartDateChange={s.setStartDate}
            onEndDateChange={s.setEndDate}
            showStartDatePicker={s.showStartDatePicker}
            showEndDatePicker={s.showEndDatePicker}
            onToggleStartDatePicker={() => {
              s.setShowStartDatePicker((prev) => !prev);
              s.setShowEndDatePicker(false);
            }}
            onToggleEndDatePicker={() => {
              s.setShowEndDatePicker((prev) => !prev);
              s.setShowStartDatePicker(false);
            }}
            today={s.today}
            maxDays={s.maxDays}
            allDates={s.allDates}
            existingMealDates={s.existingMealDates}
            newDates={s.newDates}
            isCheckingExisting={s.isCheckingExisting}
          />
        )}
        {s.step === 'importing' && (
          <UnitMealProgressPanel
            unitName={s.selectedUnit?.name}
            startDate={s.startDate}
            endDate={s.endDate}
            dayStatuses={s.dayStatuses}
            progress={s.progress}
            importDone={s.importDone}
            isImporting={s.isImporting}
            savedCount={s.savedCount}
            skippedDates={s.skippedDates}
            failedDates={s.failedDates}
          />
        )}
      </ModalBody>
    </Modal>
  );
}
