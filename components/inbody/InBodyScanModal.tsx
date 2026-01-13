'use client';

import { useState } from 'react';
import { Camera, ImagePlus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { InBodyCreateData } from '@/lib/types/inbody';
import { useCreateInBody } from '@/hooks/inbody';
import { useNativeImagePicker } from '@/hooks/webview';
import InBodyPreview from './InBodyPreview';

interface InBodyScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 저장 성공 시 콜백 */
  onSuccess?: () => void;
}

type ScanState = 'idle' | 'scanning' | 'preview' | 'saving' | 'error';

export default function InBodyScanModal({
  isOpen,
  onClose,
  onSuccess,
}: InBodyScanModalProps) {
  const [state, setState] = useState<ScanState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [createData, setCreateData] = useState<InBodyCreateData | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const createInBody = useCreateInBody();
  const { pickImage, base64ToFile, isPickerOpen } = useNativeImagePicker();

  // 모달 닫기 시 상태 초기화
  const handleClose = () => {
    setState('idle');
    setError(null);
    setCreateData(null);
    setImagePreview(null);
    onClose();
  };

  // 이미지 스캔 처리 (File 객체로)
  const handleScanImage = async (file: File, previewUrl: string) => {
    setImagePreview(previewUrl);
    setState('scanning');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/inbody/scan', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '스캔에 실패했습니다.');
      }

      const result = await response.json();
      setCreateData(result.createData);
      setState('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : '스캔 중 오류가 발생했습니다.');
      setState('error');
    }
  };

  // 이미지 선택 버튼 클릭
  const handlePickImage = async () => {
    const result = await pickImage('both');

    if (result.cancelled) {
      return;
    }

    if (!result.success) {
      setError(result.error || '이미지 선택에 실패했습니다.');
      setState('error');
      return;
    }

    if (result.base64) {
      const file = base64ToFile(result.base64, result.fileName || 'inbody.jpg');
      await handleScanImage(file, result.base64);
    }
  };

  // 저장 처리
  const handleSave = async () => {
    if (!createData) return;

    setState('saving');
    try {
      await createInBody.mutateAsync(createData);
      onSuccess?.();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
      setState('error');
    }
  };

  // 데이터 수정 처리
  const handleDataChange = (newData: InBodyCreateData) => {
    setCreateData(newData);
  };

  // 다시 스캔
  const handleRetry = () => {
    setState('idle');
    setError(null);
    setCreateData(null);
    setImagePreview(null);
  };

  // idle 상태는 하단 시트, 나머지는 중앙 모달
  const modalPosition = state === 'idle' ? 'bottom' : 'center';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="인바디 스캔"
      size="lg"
      closeOnBackdrop={state === 'idle' || state === 'error'}
      position={modalPosition}
      enableSwipe={state === 'idle'}
    >
      <ModalBody className="min-h-[300px]">
        {/* 초기 상태: 이미지 선택 */}
        {state === 'idle' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-card-foreground">
                인바디 결과지 사진을 촬영하거나 선택해주세요
              </p>
              <p className="text-sm text-muted-foreground">
                AI가 자동으로 데이터를 추출합니다
              </p>
            </div>

            {/* 사진 선택 버튼 */}
            <button
              type="button"
              onClick={handlePickImage}
              disabled={isPickerOpen}
              className="flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <Camera className="w-8 h-8 text-muted-foreground" />
                <span className="text-muted-foreground">/</span>
                <ImagePlus className="w-8 h-8 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-card-foreground">
                {isPickerOpen ? '선택 중...' : '사진 촬영 또는 앨범에서 선택'}
              </span>
            </button>

            <p className="text-xs text-muted-foreground text-center max-w-xs">
              InBody 결과지가 잘 보이도록 촬영해주세요.
              <br />
              글자가 선명할수록 정확한 추출이 가능합니다.
            </p>
          </div>
        )}

        {/* 스캔 중 */}
        {state === 'scanning' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-lg font-medium text-card-foreground">
                분석 중...
              </p>
              <p className="text-sm text-muted-foreground">
                AI가 인바디 데이터를 추출하고 있습니다
              </p>
            </div>

            {/* 선택한 이미지 미리보기 */}
            {imagePreview && (
              <div className="mt-4 w-32 h-32 rounded-lg overflow-hidden border border-border">
                <img
                  src={imagePreview}
                  alt="Selected"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        )}

        {/* 미리보기 상태 */}
        {state === 'preview' && createData && (
          <InBodyPreview
            data={createData}
            imagePreview={imagePreview}
            onChange={handleDataChange}
          />
        )}

        {/* 저장 중 */}
        {state === 'saving' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-lg font-medium text-card-foreground">
              저장 중...
            </p>
          </div>
        )}

        {/* 에러 상태 */}
        {state === 'error' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <div className="text-center space-y-1">
              <p className="text-lg font-medium text-card-foreground">
                오류가 발생했습니다
              </p>
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        {state === 'idle' && (
          <Button variant="outline" onClick={handleClose} className="flex-1">
            취소
          </Button>
        )}

        {state === 'preview' && (
          <>
            <Button variant="outline" onClick={handleRetry} className="flex-1">
              다시 스캔
            </Button>
            <Button onClick={handleSave} className="flex-1">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              저장하기
            </Button>
          </>
        )}

        {state === 'error' && (
          <>
            <Button variant="outline" onClick={handleClose} className="flex-1">
              닫기
            </Button>
            <Button onClick={handleRetry} className="flex-1">
              다시 시도
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
