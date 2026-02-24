'use client';

import {
  PaletteIcon,
  BellIcon,
  SignOutIcon,
  UserMinusIcon,
  EnvelopeIcon,
  MegaphoneIcon,
  FileTextIcon,
  ShieldCheckIcon,
  CrownIcon,
  GiftIcon,
  TicketIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react';
import SettingsGroup from './SettingsGroup';
import SettingsRow from './SettingsRow';
import ThemeSelector from './ThemeSelector';
import { useLogout, useWithdrawal } from '@/hooks/webview';
import { useModalStore } from '@/lib/stores/modalStore';

export default function SettingsContent() {
  const { logout, isLoggingOut } = useLogout();
  const { withdraw, isWithdrawing } = useWithdrawal();
  const openModal = useModalStore((s) => s.openModal);

  const handleMockup = () => {
    openModal('alert', {
      title: '준비 중',
      message: '준비 중인 기능이에요.',
      buttonText: '확인',
    });
  };

  return (
    <div className="space-y-6 pb-safe">
      {/* 앱 설정 */}
      <SettingsGroup title="앱 설정">
        <SettingsRow
          icon={PaletteIcon}
          label="테마"
          accessory={<ThemeSelector />}
        />
        <SettingsRow
          icon={BellIcon}
          label="알림"
          description="준비 중"
          accessory="toggle"
          toggleValue={false}
          onToggle={handleMockup}
        />
      </SettingsGroup>

      {/* 계정 */}
      <SettingsGroup title="계정">
        <SettingsRow
          icon={SignOutIcon}
          label="로그아웃"
          onClick={logout}
          accessory={isLoggingOut ? <span className="text-xs text-muted-foreground">처리 중...</span> : 'chevron'}
        />
        <SettingsRow
          icon={UserMinusIcon}
          label="회원 탈퇴"
          onClick={withdraw}
          destructive
          accessory={isWithdrawing ? <span className="text-xs text-muted-foreground">처리 중...</span> : 'chevron'}
        />
        <SettingsRow
          icon={EnvelopeIcon}
          label="문의하기"
          onClick={handleMockup}
        />
      </SettingsGroup>

      {/* 정보 */}
      <SettingsGroup title="정보">
        <SettingsRow
          icon={MegaphoneIcon}
          label="공지사항"
          onClick={handleMockup}
        />
        <SettingsRow
          icon={FileTextIcon}
          label="이용약관"
          onClick={handleMockup}
        />
        <SettingsRow
          icon={ShieldCheckIcon}
          label="개인정보 처리방침"
          onClick={handleMockup}
        />
      </SettingsGroup>

      {/* 프리미엄 */}
      <SettingsGroup title="프리미엄">
        <SettingsRow
          icon={CrownIcon}
          label="구독"
          onClick={handleMockup}
        />
        <SettingsRow
          icon={GiftIcon}
          label="선물"
          onClick={handleMockup}
        />
        <SettingsRow
          icon={TicketIcon}
          label="등록"
          onClick={handleMockup}
        />
        <SettingsRow
          icon={UsersThreeIcon}
          label="친구 초대"
          onClick={handleMockup}
        />
      </SettingsGroup>

      {/* 버전 */}
      <p className="text-center text-xs text-hint py-4">
        v1.0.0
      </p>
    </div>
  );
}
