"use client";

import { Facebook, Instagram, Youtube } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { routes } from "@/lib/routes";

interface FooterLink {
  label: string;
  href: string;
  isPlaceholder?: boolean;
}

interface FooterGroup {
  id: string;
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

const footerGroups: FooterGroup[] = [
  {
    id: "product",
    title: "Sản phẩm",
    links: [
      // TODO: Replace placeholder routes when public pages are added.
      { label: "AI Coach", href: "#", isPlaceholder: true },
      { label: "Cộng đồng", href: routes.community },
      { label: "Bảng giá", href: routes.billing },
      { label: "Về chúng tôi", href: "#", isPlaceholder: true }
    ]
  },
  {
    id: "support",
    title: "Hỗ trợ",
    links: [
      { label: "Trung tâm trợ giúp", href: routes.help },
      { label: "Liên hệ", href: "#", isPlaceholder: true },
      { label: "Câu hỏi thường gặp", href: "#", isPlaceholder: true }
    ]
  },
  {
    id: "legal",
    title: "Pháp lý",
    links: [
      { label: "Điều khoản sử dụng", href: "#", isPlaceholder: true },
      { label: "Chính sách quyền riêng tư", href: "#", isPlaceholder: true },
      { label: "Chính sách cookie", href: "#", isPlaceholder: true }
    ]
  }
];

const socialLinks: SocialLink[] = [
  { label: "Facebook", href: "#", icon: Facebook },
  { label: "Instagram", href: "#", icon: Instagram },
  { label: "YouTube", href: "#", icon: Youtube }
];

function PlaceholderLink({ children }: { children: string }) {
  return (
    <a href="#" onClick={(event) => event.preventDefault()}>
      {children}
    </a>
  );
}

export function AuthFooter() {
  return (
    <footer className="auth-footer" aria-label="SLABAI footer">
      <div className="auth-footer__inner container-base">
        <div className="auth-footer__main">
          <div className="auth-footer__brand">
            <Link aria-label="SLABAI home" className="auth-footer__logo" href={routes.register}>
              <Image alt="SLABAI logo" height={40} src="/brand/SLABAI-Logo.png" width={40} />
              <span>SLABAI</span>
            </Link>
            <p>AI Coach cá nhân hóa dành cho người yêu thể thao.</p>
          </div>

          <nav className="auth-footer__nav" aria-label="Liên kết thông tin SLABAI">
            {footerGroups.map((group) => (
              <section className="auth-footer__group" key={group.id} aria-labelledby={`auth-footer-${group.id}`}>
                <h2 id={`auth-footer-${group.id}`}>{group.title}</h2>
                <ul>
                  {group.links.map((item) => (
                    <li key={item.label}>
                      {item.isPlaceholder ? (
                        <PlaceholderLink>{item.label}</PlaceholderLink>
                      ) : (
                        <Link href={item.href}>{item.label}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </nav>
        </div>

        <div className="auth-footer__bottom">
          <p>© 2026 SLABAI. Tất cả quyền được bảo lưu.</p>
          <div className="auth-footer__socials" aria-label="Mạng xã hội SLABAI">
            {socialLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  aria-label={item.label}
                  href={item.href}
                  key={item.label}
                  onClick={(event) => event.preventDefault()}
                >
                  <Icon aria-hidden size={18} />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
