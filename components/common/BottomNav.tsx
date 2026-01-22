'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { shouldShowBottomTab } from '@/lib/routes';
import { BOTTOM_NAV } from '@/lib/config/theme';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
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
            <div key={item.href} className="relative flex flex-col items-center justify-center">
              {/* Link는 prefetch만을 위해 숨김 */}
              <Link
                href={item.href}
                prefetch={true}
                className="absolute inset-0 opacity-0 pointer-events-none"
                aria-hidden="true"
              />
              {/* 실제 클릭 가능한 버튼 레이어 */}
              <button
                type="button"
                onClick={() => router.push(item.href)}
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
                className={`flex flex-col items-center justify-center gap-1 transition-colors select-none [-webkit-touch-callout:none] ${
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
              </button>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
