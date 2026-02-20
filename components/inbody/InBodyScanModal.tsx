'use client';

import { useState, useRef } from 'react';
import { LoadingSpinner, ErrorIcon, SuccessIcon } from '@/components/ui/icons';
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { ImageSourceDrawer } from '@/components/drawers';
import { InBodyCreateData } from '@/lib/types/inbody';
import { useCreateInBody } from '@/hooks/inbody';
import { useNativeImagePicker } from '@/hooks/webview';
import type { ImagePickerSource } from '@/lib/webview';
import InBodyPreview from './InBodyPreview';

// ============================================================
// Types & Constants
// ============================================================

interface InBodyScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 저장 성공 시 콜백 */
  onSuccess?: () => void;
}

type ScanState = 'idle' | 'scanning' | 'preview' | 'error';

// ============================================================
// Component
// ============================================================

export default function InBodyScanModal({
  isOpen,
  onClose,
  onSuccess,
}: InBodyScanModalProps) {
  const [state, setState] = useState<ScanState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [createData, setCreateData] = useState<InBodyCreateData | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageSourceOpen, setIsImageSourceOpen] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState('');

  const abortRef = useRef<AbortController | null>(null);

  const createInBody = useCreateInBody();
  const { pickImage, base64ToFile, isPickerOpen } = useNativeImagePicker();

  const isSaving = createInBody.isPending;

  // 모달 닫기 시 상태 초기화
  const handleClose = () => {
    if (isSaving) return;
    abortRef.current?.abort();
    abortRef.current = null;
    setState('idle');
    setError(null);
    setCreateData(null);
    setImagePreview(null);
    setIsImageSourceOpen(false);
    setScanProgress(0);
    setScanMessage('');
    onClose();
  };

  // 이미지 스캔 처리 (SSE 소비)
  const handleScanImage = async (file: File, previewUrl: string) => {
    setImagePreview(previewUrl);
    setState('scanning');
    setScanProgress(0);
    setScanMessage('이미지 업로드 중...');
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/inbody/scan', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '스캔에 실패했어요.');
      }

      if (!response.body) {
        throw new Error('스트리밍 응답을 받을 수 없습니다.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() || '';

        for (const chunk of chunks) {
          if (!chunk.trim()) continue;

          const eventMatch = chunk.match(/^event: (.+)\ndata: (.+)$/m);
          if (!eventMatch) continue;

          const [, event, data] = eventMatch;
          const parsed = JSON.parse(data);

          switch (event) {
            case 'progress':
              setScanProgress(parsed.progress);
              setScanMessage(parsed.message);
              break;
            case 'complete':
              setScanProgress(100);
              setScanMessage('완료!');
              // 완료 애니메이션
              await new Promise((resolve) => setTimeout(resolve, 300));
              setCreateData(parsed.createData);
              setState('preview');
              break;
            case 'error':
              throw new Error(parsed.error);
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : '스캔 중 오류가 발생했어요.');
      setState('error');
    } finally {
      abortRef.current = null;
    }
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

  // 다시 스캔
  const handleRetry = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState('idle');
    setError(null);
    setCreateData(null);
    setImagePreview(null);
    setScanProgress(0);
    setScanMessage('');
  };

  return (
  <>
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="인바디 스캔"
      size="lg"
      closeOnBackdrop={state === 'idle' || state === 'error'}
      position="bottom"
      enableSwipe={state === 'idle' || state === 'error'}
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
              <div className="w-20 h-20 rounded-lg overflow-hidden border border-border">
                <img
                  src={imagePreview}
                  alt="Selected"
                  className="w-full h-full object-cover"
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
            <div className="bg-muted/20 rounded-xl p-4 text-sm text-muted-foreground space-y-2 w-full max-w-sm">
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

      <ModalFooter>
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
      </ModalFooter>
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
