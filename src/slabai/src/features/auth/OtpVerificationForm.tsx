"use client";

import { ArrowLeft } from "lucide-react";
import { LinkButton } from "@/components/ui/LinkButton";
import { copy } from "@/lib/copy";
import { useLanguage } from "@/lib/LanguageContext";

interface OtpVerificationFormProps {
  intent: "register" | "login";
}

export function OtpVerificationForm({ intent }: OtpVerificationFormProps) {
  const email = typeof window !== "undefined" ? sessionStorage.getItem("slabai-otp-email") ?? copy.demoEmail : copy.demoEmail;
  const { t } = useLanguage();

  return (
    <div className="form-stack">
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <LinkButton href={intent === "register" ? "/register/email" : "/login"} size="sm" variant="ghost">
          <ArrowLeft size={16} />
          {t("auth.goBack")}
        </LinkButton>
      </div>
      <div style={{ padding: "var(--slabai-space-4) 0", display: "flex", flexDirection: "column", gap: "var(--slabai-space-3)" }}>
        <p className="muted" style={{ fontSize: "var(--slabai-font-md)", lineHeight: "var(--slabai-line-normal)" }}>
          {t("auth.otpSentText")} <strong style={{ color: "var(--slabai-text-primary)" }}>{email}</strong>.
        </p>
        <p className="muted">
          {t("auth.otpCheckEmailPrefix")}{intent === "register" ? t("auth.registerWord") : t("auth.loginWord")}.
        </p>
      </div>
    </div>
  );
}
