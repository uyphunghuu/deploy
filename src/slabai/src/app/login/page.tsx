"use client";

import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { AuthEmailForm } from "@/features/auth/AuthEmailForm";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { useLanguage } from "@/lib/LanguageContext";

export default function LoginPage() {
  const { t } = useLanguage();

  return (
    <main className="auth-shell">
      <div style={{ position: "absolute", top: "16px", right: "16px", zIndex: 10 }}>
        <LanguageSelector />
      </div>
      <Card className="auth-card">
        <div className="auth-card__header">
          <Logo compact />
          <h1>{t("auth.loginTitle")}</h1>
          <p className="muted">{t("auth.loginSubtitle")}</p>
        </div>
        <AuthEmailForm intent="login" />
      </Card>
    </main>
  );
}
