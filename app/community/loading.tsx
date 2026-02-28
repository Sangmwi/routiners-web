import { PulseLoader } from '@/components/ui/PulseLoader';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background px-(--layout-padding-x) pt-page pb-nav flex flex-col gap-4">
      <PulseLoader />
    </div>
  );
}
