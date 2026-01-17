"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { shouldShowBottomTab } from "@/lib/routes";
import { BOTTOM_NAV } from "@/lib/config/theme";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { items, style } = BOTTOM_NAV;

  // 프리패치 적용
  useEffect(() => {
    items.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router, items]);

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
            <button
              key={item.href}
              type="button"
              onClick={() => router.push(item.href)}
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
            </button>
          );
        })}
      </div>
    </nav>
  );
}
