"use client";

import { Bell, ChevronDown, Menu, X, Users, User, LogOut, ChevronLeft, ChevronRight, Languages } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { copy } from "@/lib/copy";
import { navGroups, routes } from "@/lib/routes";
import { getSession, clearSession } from "@/services/mockRepository";
import { ChatbotLauncher } from "@/components/chatbot/ChatbotLauncher";
import { useLanguage } from "@/lib/LanguageContext";
import { LanguageSelector } from "@/components/layout/LanguageSelector";

const getNavKey = (label: string) => {
  if (label === "Calendar") return "nav.calendar";
  if (label === "Plan Builder") return "nav.planBuilder";
  if (label === "Profiles & Zones") return "nav.profilesZones";
  if (label === "Community Feed") return "nav.communityFeed";
  if (label === "Profile") return "nav.profile";
  if (label === "AI Coach Settings") return "nav.aiCoachSettings";
  if (label === "Devices & Apps") return "nav.devicesApps";
  if (label === "Store") return "nav.billing";
  if (label === "Help Center") return "nav.help";
  return label;
};

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { lang, setLang, t } = useLanguage();

  const handleLogout = async () => {
    try {
      await clearSession();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

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

  const pageTitle = navGroups
    .flatMap((group) => group.items)
    .find((item) => {
      if (item.href === "/plan-builder/sport") {
        return pathname.startsWith("/plan-builder");
      }
      return pathname.startsWith(item.href);
    })?.label;

  return (
    <div className="app-shell" data-collapsed={collapsed}>
      {open && <button aria-label="Đóng menu" className="mobile-scrim" onClick={() => setOpen(false)} type="button" />}
      <aside aria-label="Điều hướng chính" className="sidebar" data-open={open} data-collapsed={collapsed}>
        <div className="sidebar__inner">
          <div className="sidebar__brand-row">
            <Logo compact={collapsed} />
            {!collapsed && (
              <Button aria-label="Đóng menu" className="sidebar__close" iconOnly onClick={() => setOpen(false)} type="button" variant="ghost">
                <X size={18} />
              </Button>
            )}
          </div>
          <nav className="sidebar__nav">
            {navGroups.map((group, groupIndex) => (
              <div className="sidebar__group" key={group.label ?? `group-${groupIndex}`}>
                {group.label && !collapsed && <div className="sidebar__section-title">{t(`nav.${group.label.toLowerCase()}`)}</div>}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    pathname === item.href ||
                    (item.href === "/plan-builder/sport" && pathname.startsWith("/plan-builder")) ||
                    (item.href !== "/plan-builder/sport" && pathname.startsWith(item.href));
                  return (
                    <Link
                      aria-current={active ? "page" : undefined}
                      className="nav-link"
                      href={item.href}
                      key={item.href}
                      title={collapsed ? t(getNavKey(item.label)) : undefined}
                    >
                      <Icon size={18} />
                      {!collapsed && <span>{t(getNavKey(item.label))}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
          <div className="sidebar__footer">
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="sidebar__collapse-btn"
            >
              {collapsed ? (
                <ChevronRight size={18} />
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <ChevronLeft size={16} />
                  <span>{t("nav.collapse")}</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="topbar__inner">
            <div className="topbar__left">
              <Button aria-label="Mở menu" className="topbar__menu" iconOnly onClick={() => setOpen(true)} type="button" variant="ghost">
                <Menu size={20} />
              </Button>
              <div>
                <h1>{pageTitle ? t(getNavKey(pageTitle)) : ""}</h1>
              </div>
            </div>
            <div className="topbar__actions">
              <LanguageSelector />

              <Button aria-label="Thông báo" iconOnly type="button" variant="ghost">
                <Bell size={18} />
              </Button>
              <div
                className="user-menu-wrapper"
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
              >
                <button className="user-menu" type="button" aria-expanded={showDropdown}>
                  <span>{copy.demoName}</span>
                  <span className="user-avatar" aria-hidden="true">
                    LD
                  </span>
                  <ChevronDown size={16} className={`user-menu__arrow ${showDropdown ? "user-menu__arrow--rotated" : ""}`} />
                </button>
                {showDropdown && (
                  <div className="user-dropdown">
                    <Link href={routes.community} className="user-dropdown__item">
                      <Users size={16} />
                      <span>{t("calendar.findFriends")}</span>
                    </Link>
                    <Link href={routes.profile} className="user-dropdown__item">
                      <User size={16} />
                      <span>{t("nav.profile")}</span>
                    </Link>
                    <hr className="user-dropdown__divider" />
                    <button onClick={handleLogout} className="user-dropdown__item user-dropdown__item--danger" type="button">
                      <LogOut size={16} />
                      <span>{t("logout")}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
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
