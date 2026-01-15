'use client';

/**
 * Withdrawal Hook
 *
 * 회원탈퇴 로직을 처리합니다.
 * - 확인 모달 표시
 * - API 호출로 사용자 데이터 삭제
 * - WebView/Web 환경에 따라 로그아웃 처리
 */

import { useState } from 'react';
import { useModalStore } from '@/lib/stores/modalStore';
import { useWebViewCore } from './useWebViewCore';
import { useWebViewAuth } from './useWebViewAuth';

// ============================================================================
// Types
// ============================================================================

interface UseWithdrawalResult {
  /** 회원탈퇴 실행 함수 (확인 모달 표시) */
  withdraw: () => void;
  /** 탈퇴 진행 중 여부 */
  isWithdrawing: boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useWithdrawal(): UseWithdrawalResult {
  const { isInWebView } = useWebViewCore();
  const { sendLogout } = useWebViewAuth();
  const openModal = useModalStore((state) => state.openModal);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const withdraw = () => {
    openModal('confirm', {
      title: '회원 탈퇴',
      message: '정말 탈퇴하시겠습니까?\n모든 데이터가 삭제되며 복구할 수 없습니다.',
      confirmText: '탈퇴하기',
      cancelText: '취소',
      onConfirm: async () => {
        setIsWithdrawing(true);

        try {
          const response = await fetch('/api/user/withdraw', {
            method: 'DELETE',
          });

          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || '탈퇴 처리에 실패했습니다.');
          }

          // 탈퇴 완료 후 로그아웃 처리
          if (isInWebView) {
            sendLogout();
          } else {
            window.location.replace('/login');
          }
        } catch (error) {
          console.error('[useWithdrawal] Error:', error);
          openModal('alert', {
            title: '오류',
            message:
              error instanceof Error
                ? error.message
                : '탈퇴 처리 중 오류가 발생했습니다.',
            buttonText: '확인',
          });
          setIsWithdrawing(false);
        }
      },
    });
  };

  return {
    withdraw,
    isWithdrawing,
  };
}
