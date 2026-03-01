'use client';

import { useState, useRef, useEffect } from 'react';
import { ErrorIcon, SuccessIcon, LoadingSpinner } from '@/components/ui/icons';
import Modal, { ModalBody } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import GradientFooter from '@/components/ui/GradientFooter';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { ImageSourceDrawer } from '@/components/drawers';
import { InBodyCreateData } from '@/lib/types/inbody';
import { useCreateInBody, useInBodyScanStream } from '@/hooks/inbody';
import { useNativeImagePicker } from '@/hooks/webview';
import type { ImagePickerSource } from '@/lib/webview';
import InBodyPreview from './InBodyPreview';
import { ImageWithFallback } from '@/components/ui/image';
import type { BaseModalProps } from '@/lib/types/modal';

// ============================================================
// Types & Constants
// ============================================================

interface InBodyScanModalProps extends BaseModalProps {
  /** 저장 성공 시 콜백 */
  onSuccess?: () => void;
  /** 미리 선택된 이미지 (제공 시 idle 건너뛰고 바로 스캔 시작) */
  initialFile?: File;
  initialPreview?: string;
}

type ScanState = 'idle' | 'scanning' | 'preview' | 'error';

// ============================================================
// Component
// ============================================================

export default function InBodyScanModal({
  isOpen,
  onClose,
  onSuccess,
  initialFile,
  initialPreview,
}: InBodyScanModalProps) {
  const [state, setState] = useState<ScanState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [createData, setCreateData] = useState<InBodyCreateData | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageSourceOpen, setIsImageSourceOpen] = useState(false);

  const createInBody = useCreateInBody();
  const { pickImage, base64ToFile, isPickerOpen } = useNativeImagePicker();

  const isSaving = createInBody.isPending;
  const autoStartedRef = useRef(false);

  const { start: startScan, abort: abortScan, progress: scanProgress, message: scanMessage } = useInBodyScanStream({
    onComplete: (data) => {
      setCreateData(data);
      setState('preview');
    },
    onError: (msg) => {
      setError(msg);
      setState('error');
    },
  });

  // initialFile 제공 시 모달 열릴 때 바로 스캔 시작
  useEffect(() => {
    if (!isOpen) {
      autoStartedRef.current = false;
      return;
    }
    if (initialFile && initialPreview && !autoStartedRef.current) {
      autoStartedRef.current = true;
      handleScanImage(initialFile, initialPreview);
    }
  }, [isOpen, initialFile, initialPreview]);

  // 모달 닫기 시 상태 초기화
  const handleClose = () => {
    if (isSaving) return;
    abortScan();
    setState('idle');
    setError(null);
    setCreateData(null);
    setImagePreview(null);
    setIsImageSourceOpen(false);
    onClose();
  };

  // 이미지 스캔 시작
  const handleScanImage = async (file: File, previewUrl: string) => {
    setImagePreview(previewUrl);
    setError(null);
    setState('scanning');
    await startScan(file);
  };

  // 이미지 선택 처리
  const handleSelectSource = async (source: ImagePickerSource) => {
    setIsImageSourceOpen(false);

    const result = await pickImage(source);

    if (result.cancelled) {
      return;
    }

    if (!result.success) {
      setError(result.error || '이미지 선택에 실패했어요.');
      setState('error');
      return;
    }

    if (result.base64) {
      const file = base64ToFile(result.base64, result.fileName || 'inbody.jpg');
      await handleScanImage(file, result.base64);
    }
  };

  // 저장 처리
  const handleSave = () => {
    if (!createData) return;

    createInBody.mutate(createData, {
      onSuccess: () => {
        onSuccess?.();
        handleClose();
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : '저장에 실패했어요.');
        setState('error');
      },
    });
  };

  // 데이터 수정 처리
  const handleDataChange = (newData: InBodyCreateData) => {
    setCreateData(newData);
  };

  // 다시 스캔 (바로 이미지 소스 선택 열기)
  const handleRetry = () => {
    abortScan();
    setState('idle');
    setError(null);
    setCreateData(null);
    setImagePreview(null);
    setIsImageSourceOpen(true);
  };

  return (
  <>
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="인바디 스캔"
      closeOnBackdrop={state === 'idle' || state === 'error'}
      position="bottom"
      enableSwipe={state === 'idle' || state === 'error'}
      stickyFooter={
        (state === 'preview' || state === 'error') ? (
          <GradientFooter variant="sheet" className="flex gap-3">
            {state === 'preview' && (
              <>
                <Button variant="outline" onClick={handleRetry} className="flex-1" disabled={isSaving}>
                  다시 스캔
                </Button>
                <Button onClick={handleSave} className="flex-1" isLoading={isSaving}>
                  <SuccessIcon size="sm" className="mr-2" />
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
          </GradientFooter>
        ) : undefined
      }
    >
      <ModalBody className="relative p-6 min-h-[300px]">
        {/* 저장 중 오버레이 (preview 콘텐츠 유지) */}
        {isSaving && <LoadingOverlay message="저장 중..." />}

        {/* 초기 상태: 이미지 선택 */}
        {state === 'idle' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-card-foreground">
                인바디 결과지 사진을 촬영하거나 선택해주세요
              </p>
              <p className="text-sm text-muted-foreground">
                AI가 자동으로 데이터를 추출해요
              </p>
            </div>

            {/* 사진 선택 버튼 */}
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsImageSourceOpen(true)}
              disabled={isPickerOpen}
              className="px-8"
            >
              {isPickerOpen ? '선택 중...' : '사진 선택하기'}
            </Button>

            <p className="text-xs text-muted-foreground text-center max-w-xs">
              InBody 결과지가 잘 보이도록 촬영해주세요.
              <br />
              글자가 선명할수록 정확한 추출이 가능해요.
            </p>
          </div>
        )}

        {/* 스캔 중: 프로그레스 바 + SSE 메시지 */}
        {state === 'scanning' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            {/* 이미지 미리보기 (소형) */}
            {imagePreview && (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                <ImageWithFallback
                  src={imagePreview}
                  alt="Selected"
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* 프로그레스 영역 */}
            <div className="w-full max-w-xs space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-card-foreground">분석 중</span>
                <span className="text-muted-foreground">{scanProgress}%</span>
              </div>

              {/* 프로그레스 바 */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>

              {/* 서버 메시지 */}
              <div className="flex items-center gap-2">
                <LoadingSpinner size="xs" />
                <p className="text-xs text-muted-foreground">
                  {scanMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 미리보기 상태 (저장 중에도 state는 'preview' 유지, 위에 오버레이) */}
        {state === 'preview' && createData && (
          <InBodyPreview
            data={createData}
            imagePreview={imagePreview}
            onChange={handleDataChange}
          />
        )}

        {/* 에러 상태 */}
        {state === 'error' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <ErrorIcon size="2xl" className="text-destructive" />
            <div className="text-center space-y-1">
              <p className="text-lg font-medium text-card-foreground">
                스캔에 실패했어요
              </p>
              <p className="text-sm text-destructive">{error}</p>
            </div>

            {/* 해결 안내 */}
            <div className="bg-surface-secondary rounded-xl p-4 text-sm text-muted-foreground space-y-2 w-full max-w-sm">
              <p className="font-medium text-card-foreground">이렇게 해보세요</p>
              <ul className="list-disc list-inside space-y-1">
                <li>결과지 글자가 선명하게 보이도록 촬영</li>
                <li>그림자나 반사가 없는 환경에서 촬영</li>
                <li>인바디 결과지 전체가 사진에 포함되도록</li>
              </ul>
            </div>
          </div>
        )}
      </ModalBody>
    </Modal>

    {/* 이미지 소스 선택 드로어 */}
    <ImageSourceDrawer
      isOpen={isImageSourceOpen}
      onClose={() => setIsImageSourceOpen(false)}
      onSelectCamera={() => handleSelectSource('camera')}
      onSelectGallery={() => handleSelectSource('gallery')}
      isLoading={isPickerOpen}
    />
  </>
  );
}
