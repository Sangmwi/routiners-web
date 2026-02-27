'use client';

import dynamic from 'next/dynamic';

const BottomNavNoSSR = dynamic(() => import('./BottomNav'), {
  ssr: false,
});

export default function BottomNavClient() {
  return <BottomNavNoSSR />;
}
