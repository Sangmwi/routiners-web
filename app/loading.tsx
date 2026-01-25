import { PulseLoader } from '@/components/ui/PulseLoader';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background p-4">
      <PulseLoader />
    </div>
  );
}
