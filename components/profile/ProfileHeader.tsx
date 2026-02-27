'use client';

import { GearSixIcon } from '@phosphor-icons/react';
import { MainTabHeader } from '@/components/layouts';
import AppLink from '@/components/common/AppLink';
import { useWebViewCore } from '@/hooks/webview/useWebViewCore';

export default function ProfileHeader() {
  const { isInWebView, sendMessage } = useWebViewCore();

  const action = isInWebView ? (
    <button
      type="button"
      onClick={() => sendMessage({ type: 'OPEN_NATIVE_SETTINGS' })}
      className="p-1.5 hover:bg-surface-muted rounded-lg transition-colors"
      aria-label="설정"
    >
      <GearSixIcon size={20} className="text-muted-foreground" />
    </button>
  ) : (
    <AppLink
      href="/settings"
      className="p-1.5 hover:bg-surface-muted rounded-lg transition-colors"
      aria-label="설정"
    >
      <GearSixIcon size={20} className="text-muted-foreground" />
    </AppLink>
  );

  return <MainTabHeader title="프로필" action={action} />;
}