'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { shouldShowBottomTab } from '@/lib/routes';
import { BOTTOM_NAV } from '@/lib/config/theme';

export default function BottomNav() {
  const pathname = usePathname();
  const { items, style } = BOTTOM_NAV;

  // 특정 페이지에서는 탭 숨김
  if (!shouldShowBottomTab(pathname)) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-16 items-center justify-around px-4">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              // URL 미리보기 차단 시도
              onContextMenu={(e) => e.preventDefault()}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive
                  ? style.activeColor
                  : `${style.inactiveColor} hover:text-foreground`
              }`}
            >
              <Icon
                size={style.size}
                weight={isActive ? style.activeWeight : style.inactiveWeight}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
