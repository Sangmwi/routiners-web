import { DetailLayout } from '@/components/layouts';
import { PulseLoader } from '@/components/ui/PulseLoader';

export default function Loading() {
  return (
    <DetailLayout title="식단" centered>
      <PulseLoader />
    </DetailLayout>
  );
}
