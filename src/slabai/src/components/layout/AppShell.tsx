"use client";

import { Bell, ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { copy } from "@/lib/copy";
import { navGroups } from "@/lib/routes";
import { getSession } from "@/services/mockRepository";
import { ChatbotLauncher } from "@/components/chatbot/ChatbotLauncher";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    getSession()
      .then((session) => {
        if (!mounted) return;
        if (!session?.authenticated) {
          router.replace("/login");
          return;
        }
        setChecked(true);
      })
      .catch(() => {
        if (mounted) router.replace("/login");
      });
    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => setOpen(false), [pathname]);

  const pageTitle = navGroups.flatMap((group) => group.items).find((item) => pathname.startsWith(item.href))?.label;

  return (
    <div className="app-shell">
      {open && <button aria-label="Đóng menu" className="mobile-scrim" onClick={() => setOpen(false)} type="button" />}
      <aside aria-label="Điều hướng chính" className="sidebar" data-open={open}>
        <div className="sidebar__inner">
          <div className="sidebar__brand-row">
            <Logo />
            <Button aria-label="Đóng menu" className="sidebar__close" iconOnly onClick={() => setOpen(false)} type="button" variant="ghost">
              <X size={18} />
            </Button>
          </div>
          <nav className="sidebar__nav">
            {navGroups.map((group, groupIndex) => (
              <div className="sidebar__group" key={group.label ?? `group-${groupIndex}`}>
                {group.label && <div className="sidebar__section-title">{group.label}</div>}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    pathname === item.href ||
                    (item.href === "/plan-builder/sport" && pathname.startsWith("/plan-builder")) ||
                    (item.href !== "/dashboard" && item.href !== "/plan-builder/sport" && pathname.startsWith(item.href));
                  return (
                    <Link aria-current={active ? "page" : undefined} className="nav-link" href={item.href} key={item.href}>
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
          <div className="sidebar__footer">
            <Button size="sm" variant="ghost" type="button">
              Thu gọn
            </Button>
          </div>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="topbar__left">
            <Button aria-label="Mở menu" className="topbar__menu" iconOnly onClick={() => setOpen(true)} type="button" variant="ghost">
              <Menu size={20} />
            </Button>
            <div>
              <p className="topbar__eyebrow">SLABAI</p>
              <h1>{pageTitle ?? "Dashboard"}</h1>
            </div>
          </div>
          <div className="topbar__actions">
            <Button aria-label="Thông báo" iconOnly type="button" variant="ghost">
              <Bell size={18} />
            </Button>
            <button className="user-menu" type="button">
              <span>{copy.demoName}</span>
              <span className="user-avatar" aria-hidden="true">
                LD
              </span>
              <ChevronDown size={16} />
            </button>
          </div>
        </header>
        <main className="app-content" tabIndex={-1}>
          <div className="app-content__inner">
            {checked ? children : <div className="skeleton app-shell__skeleton" />}
          </div>
        </main>
        {checked && <ChatbotLauncher />}
      </div>
    </div>
  );
}
