'use client';

import dynamic from 'next/dynamic';
import { DetailLayout } from '@/components/layouts';

const SettingsContent = dynamic(
  () => import('@/components/settings/SettingsContent'),
  { ssr: false }
);

export default function SettingsPage() {
  return (
    <DetailLayout title="설정" centered>
      <SettingsContent />
    </DetailLayout>
  );
}
