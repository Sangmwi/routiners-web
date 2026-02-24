'use client';

import { useState, useEffect } from 'react';
import { PencilSimpleIcon } from '@phosphor-icons/react';
import { ExpandIcon, CollapseIcon } from '@/components/ui/icons';
import Button from '@/components/ui/Button';
import { InBodyCreateData } from '@/lib/types/inbody';
import FormInput from '@/components/ui/FormInput';
import { DatePicker } from '@/components/ui/WheelPicker';
import { ImageWithFallback } from '@/components/ui/image';

interface InBodyPreviewProps {
  data: InBodyCreateData;
  imagePreview?: string | null;
  onChange: (data: InBodyCreateData) => void;
  /** 읽기 전용 모드 (수정 버튼 숨김) */
  readOnly?: boolean;
  /** 초기 편집 모드 시작 여부 */
  initialEditing?: boolean;
}

export default function InBodyPreview({
  data,
  imagePreview,
  onChange,
  readOnly = false,
  initialEditing = false,
}: InBodyPreviewProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(initialEditing);

  // 부모가 initialEditing을 변경하면 동기화
  useEffect(() => {
    setIsEditing(initialEditing);
  }, [initialEditing]);

  // readOnly 모드에서는 수정 불가
  const canEdit = !readOnly;

  // 핵심 지표 수정 핸들러
  const handleCoreChange = (field: keyof InBodyCreateData, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) || value === '') {
      onChange({
        ...data,
        [field]: value === '' ? undefined : numValue,
      });
    }
  };

  // 날짜 수정 핸들러
  const handleDateChange = (value: string) => {
    onChange({
      ...data,
      measuredAt: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* 이미지 미리보기 (옵션) */}
      {imagePreview && (
        <div className="flex justify-center">
          <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
            <ImageWithFallback
              src={imagePreview}
              alt="InBody 결과지"
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}

      {/* 추출 결과 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-card-foreground">
          {readOnly ? '인바디 데이터' : '추출된 데이터'}
        </h3>
        {canEdit && !initialEditing && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setIsEditing(!isEditing)}
          >
            <PencilSimpleIcon size={16} />
            {isEditing ? '완료' : '수정'}
          </Button>
        )}
      </div>

      {/* 측정일 */}
      <div className="bg-surface-secondary rounded-xl p-4">
        {isEditing ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">측정일</p>
            <DatePicker
              value={data.measuredAt}
              onChange={handleDateChange}
              minDate="2020-01-01"
              maxDate={new Date().toISOString().split('T')[0]}
              showLabels={false}
            />
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">측정일</span>
            <span className="font-medium text-card-foreground">
              {data.measuredAt}
            </span>
          </div>
        )}
      </div>

      {/* 핵심 지표 */}
      <div className="bg-surface-secondary rounded-xl p-4 space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">
          핵심 지표
        </h4>

        {isEditing ? (
          <div className="space-y-3">
            <FormInput
              type="number"
              step="0.1"
              label="체중 (kg)"
              value={data.weight?.toString() || ''}
              onChange={(e) => handleCoreChange('weight', e.target.value)}
            />
            <FormInput
              type="number"
              step="0.1"
              label="골격근량 (kg)"
              value={data.skeletalMuscleMass?.toString() || ''}
              onChange={(e) => handleCoreChange('skeletalMuscleMass', e.target.value)}
            />
            <FormInput
              type="number"
              step="0.1"
              label="체지방률 (%)"
              value={data.bodyFatPercentage?.toString() || ''}
              onChange={(e) => handleCoreChange('bodyFatPercentage', e.target.value)}
            />
            <FormInput
              type="number"
              step="0.1"
              label="BMI"
              value={data.bmi?.toString() || ''}
              onChange={(e) => handleCoreChange('bmi', e.target.value)}
            />
            <FormInput
              type="number"
              label="인바디 점수"
              value={data.inbodyScore?.toString() || ''}
              onChange={(e) => handleCoreChange('inbodyScore', e.target.value)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <DataItem label="체중" value={data.weight} unit="kg" />
            <DataItem label="골격근량" value={data.skeletalMuscleMass} unit="kg" />
            <DataItem label="체지방률" value={data.bodyFatPercentage} unit="%" />
            <DataItem label="BMI" value={data.bmi} />
            <DataItem label="인바디 점수" value={data.inbodyScore} unit="점" />
          </div>
        )}
      </div>

      {/* 상세 지표 토글 */}
      {!isEditing && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-center gap-1 py-2 text-sm text-muted-foreground hover:text-card-foreground transition-colors"
        >
          {showDetails ? (
            <>
              <CollapseIcon size="sm" />
              상세 정보 접기
            </>
          ) : (
            <>
              <ExpandIcon size="sm" />
              상세 정보 보기
            </>
          )}
        </button>
      )}

      {/* 상세 지표 */}
      {showDetails && !isEditing && (
        <div className="space-y-4">
          {/* 체성분 */}
          <div className="bg-surface-secondary rounded-xl p-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              체성분
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <DataItem label="체수분" value={data.totalBodyWater} unit="L" />
              <DataItem label="단백질" value={data.protein} unit="kg" />
              <DataItem label="무기질" value={data.minerals} unit="kg" />
              <DataItem label="체지방량" value={data.bodyFatMass} unit="kg" />
            </div>
          </div>

          {/* 부위별 근육량 */}
          {(data.rightArmMuscle || data.leftArmMuscle || data.trunkMuscle || data.rightLegMuscle || data.leftLegMuscle) && (
            <div className="bg-surface-secondary rounded-xl p-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                부위별 근육량
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <DataItem label="오른팔" value={data.rightArmMuscle} unit="kg" />
                <DataItem label="왼팔" value={data.leftArmMuscle} unit="kg" />
                <DataItem label="몸통" value={data.trunkMuscle} unit="kg" />
                <DataItem label="오른다리" value={data.rightLegMuscle} unit="kg" />
                <DataItem label="왼다리" value={data.leftLegMuscle} unit="kg" />
              </div>
            </div>
          )}

          {/* 부위별 체지방량 */}
          {(data.rightArmFat || data.leftArmFat || data.trunkFat || data.rightLegFat || data.leftLegFat) && (
            <div className="bg-surface-secondary rounded-xl p-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                부위별 체지방량
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <DataItem label="오른팔" value={data.rightArmFat} unit="kg" />
                <DataItem label="왼팔" value={data.leftArmFat} unit="kg" />
                <DataItem label="몸통" value={data.trunkFat} unit="kg" />
                <DataItem label="오른다리" value={data.rightLegFat} unit="kg" />
                <DataItem label="왼다리" value={data.leftLegFat} unit="kg" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 데이터 아이템 컴포넌트
function DataItem({
  label,
  value,
  unit,
}: {
  label: string;
  value?: number;
  unit?: string;
}) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-card-foreground">
        {value !== undefined ? (
          <>{value}<span className="text-xs font-normal text-muted-foreground ml-0.5">{unit || ''}</span></>
        ) : '-'}
      </span>
    </div>
  );
}
