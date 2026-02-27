'use client';

import { usePathname } from 'next/navigation';
import { shouldShowBottomTab } from '@/lib/routes';
import { BOTTOM_NAV } from '@/lib/config/theme';
import { useTabRoutePrefetch } from '@/hooks/navigation/useTabRoutePrefetch';
import AppLink from './AppLink';

export default function BottomNav() {
  const pathname = usePathname();
  const isInWebView =
    typeof window !== 'undefined' && !!window.ReactNativeWebView;

  // 탭 라우트 중앙 집중식 prefetch (뒤로가기 후 정상작동하는 것과 동일한 효과)
  useTabRoutePrefetch();
  const { items, style } = BOTTOM_NAV;

  // 특정 페이지에서는 탭 숨김
  if (isInWebView || !shouldShowBottomTab(pathname)) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md border-t border-border bg-background pb-[var(--safe-bottom)]">
      <div className="flex h-16 items-center">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <AppLink
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl py-2 transition-all duration-200 active:scale-95 active:bg-foreground/5 ${
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
            </AppLink>
          );
        })}
      </div>
    </nav>
  );
}
