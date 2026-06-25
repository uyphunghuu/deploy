import { ChevronDown, UserRound } from "lucide-react";
import { LinkButton } from "@/components/ui/LinkButton";
import { Logo } from "@/components/ui/Logo";
import { routes } from "@/lib/routes";

export function MarketingHeader() {
  return (
    <header className="marketing-header">
      <Logo />
      <nav aria-label="Marketing">
        <a href="#ai-coach">AI Coach</a>
        <a href="#community">Cộng đồng</a>
        <a href="#about">Về chúng tôi</a>
      </nav>
      <LinkButton className="marketing-login-link" href={routes.login} size="sm" variant="ghost">
        <span>Đăng nhập</span>
        <UserRound aria-hidden="true" size={16} />
        <ChevronDown aria-hidden="true" size={14} />
      </LinkButton>
    </header>
  );
}
