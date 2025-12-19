"use client";

import { createClient } from "@/utils/supabase/client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import GoogleLogo from "@/assets/logos/google.svg";
import logoImage from "@/assets/images/splash-image-md.png";

function LoginContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use production URL for OAuth callback
      // In development, use localhost. In production/app, use the deployed URL
      const isLocalhost = window.location.hostname === 'localhost' ||
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname === '10.0.2.2';

      const redirectUrl = isLocalhost
        ? `${window.location.origin}/auth/callback`
        : 'https://routiners-web.vercel.app/auth/callback';

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error logging in with Google:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Logo & Branding */}
        <div className="mb-24 flex flex-col items-center">
          <Image
            src={logoImage}
            alt="루티너스 로고"
            width={200}
            height={200}
            className="object-contain"
            priority
          />
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-destructive/10 p-3 text-center text-sm text-destructive ring-1 ring-destructive/20">
            {error}
          </div>
        )}

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-card px-6 py-4 text-sm font-medium text-card-foreground shadow-md ring-1 ring-border transition-all duration-200 hover:shadow-lg hover:ring-primary/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <>
              <GoogleLogo className="h-5 w-5" />
              <span>Google로 계속하기</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-muted-foreground leading-relaxed">
          로그인 시{" "}
          <span className="text-foreground/70 underline underline-offset-2">
            서비스 이용약관
          </span>{" "}
          및{" "}
          <span className="text-foreground/70 underline underline-offset-2">
            개인정보 처리방침
          </span>
          에 동의합니다.
        </p>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground/60">
          © 2024 루티너스. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
