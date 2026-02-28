import { DetailLayout } from '@/components/layouts';
import { PulseLoader } from '@/components/ui/PulseLoader';

export default function Loading() {
  return (
    <DetailLayout title="프로필 편집">
      <PulseLoader />
    </DetailLayout>
  );
}
