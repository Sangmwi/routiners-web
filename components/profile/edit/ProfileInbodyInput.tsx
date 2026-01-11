'use client';

import { useState } from 'react';
import { Settings, ChevronRight } from 'lucide-react';
import FormSection from '@/components/ui/FormSection';
import FormToggle from '@/components/ui/FormToggle';
import { InBodyManageModal, MetricsGrid } from '@/components/inbody';
import { useInBodySummary } from '@/hooks/inbody';

interface ProfileInbodyInputProps {
  showInbodyPublic: boolean;
  onShowInbodyPublicChange: (value: boolean) => void;
}

export default function ProfileInbodyInput({
  showInbodyPublic,
  onShowInbodyPublicChange,
}: ProfileInbodyInputProps) {
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const { data: summary } = useInBodySummary();

  const latest = summary?.latest;
  const totalRecords = summary?.totalRecords ?? 0;

  return (
    <>
      <FormSection
        title="인바디 정보"
        description="인바디 결과지를 스캔하여 정확한 데이터를 기록하세요"
        action={
          <button
            type="button"
            onClick={() => setIsManageModalOpen(true)}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>관리</span>
          </button>
        }
      >
        <div className="space-y-4">
          {/* 현재 인바디 요약 */}
          <div
            className="bg-muted/30 rounded-xl p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setIsManageModalOpen(true)}
          >
            {latest ? (
              <>
                <MetricsGrid data={latest} />
                <div className="flex items-center justify-center gap-1 mt-3 text-xs text-muted-foreground">
                  <span>총 {totalRecords}개의 기록</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-card-foreground">
                    아직 등록된 기록이 없어요
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    탭하여 인바디 기록을 추가하세요
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* 공개 설정 토글 */}
          <FormToggle
            label="인바디 정보 공개"
            description="다른 사용자에게 인바디 정보를 공개합니다"
            checked={showInbodyPublic}
            onChange={onShowInbodyPublicChange}
          />
        </div>
      </FormSection>

      {/* 인바디 관리 모달 */}
      <InBodyManageModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
      />
    </>
  );
}
