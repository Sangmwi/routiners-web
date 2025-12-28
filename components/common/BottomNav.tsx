"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Home, Bot, Users, User } from "lucide-react";
import { shouldShowBottomTab } from "@/lib/routes";

const NAV_ITEMS = [
  { label: "홈", href: "/", icon: Home },
  { label: "AI", href: "/ai", icon: Bot },
  { label: "커뮤니티", href: "/community", icon: Users },
  { label: "프로필", href: "/profile", icon: User },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  // 프리패치 적용
  useEffect(() => {
    NAV_ITEMS.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router]);

  // 특정 페이지에서는 탭 숨김
  if (!shouldShowBottomTab(pathname)) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-16 items-center justify-around px-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <button
              key={item.href}
              type="button"
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

