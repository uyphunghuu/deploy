"use client";

import { ChevronDown, UserRound } from "lucide-react";
import { LinkButton } from "@/components/ui/LinkButton";
import { Logo } from "@/components/ui/Logo";
import { routes } from "@/lib/routes";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { useLanguage } from "@/lib/LanguageContext";

export function MarketingHeader() {
  const { t } = useLanguage();

  return (
    <header className="marketing-header container-base">
      <Logo />
      <nav aria-label="Marketing">
        <a href="#ai-coach">AI Coach</a>
        <a href="#community">{t("nav.community")}</a>
        <a href="#about">{t("nav.about")}</a>
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <LanguageSelector />
        <LinkButton className="marketing-login-link" href={routes.login} size="sm" variant="ghost">
          <span>{t("login")}</span>
          <UserRound aria-hidden="true" size={16} />
          <ChevronDown aria-hidden="true" size={14} />
        </LinkButton>
      </div>
    </header>
  );
}
