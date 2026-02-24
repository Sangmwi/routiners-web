'use client';

import type { ReactNode } from 'react';

interface SettingsGroupProps {
  title: string;
  children: ReactNode;
}

export default function SettingsGroup({ title, children }: SettingsGroupProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
        {title}
      </h3>
      <div className="bg-card rounded-2xl border border-edge-faint overflow-hidden divide-y divide-edge-divider">
        {children}
      </div>
    </div>
  );
}
