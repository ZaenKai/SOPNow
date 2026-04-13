"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartBar,
  SquaresFour,
  PlusCircle,
  Users,
  Gear,
  CaretRight,
  CaretDoubleLeft,
  CaretDoubleRight,
  Moon,
  Sun,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Projects", icon: SquaresFour, href: "/projects" },
  { label: "Analysis Hub", icon: ChartBar, href: "/analysis" },
  { label: "Employee Hub", icon: Users, href: "/employees" },
  { label: "Settings", icon: Gear, href: "/settings" },
];

interface SidebarProps {
  onNewProject?: () => void;
}

type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "sopnow-theme";
const SIDEBAR_COLLAPSE_STORAGE_KEY = "sopnow-sidebar-collapsed";
const THEME_TOKENS: Record<ThemeMode, Record<string, string>> = {
  light: {
    "--bg-canvas": "#f8fafc",
    "--bg-surface": "#ffffff",
    "--brand-primary": "#14b8a6",
    "--brand-secondary": "#0369a1",
    "--text-primary": "#0f172a",
    "--text-muted": "#64748b",
    "--status-success": "#059669",
    "--status-error": "#e11d48",
    "--status-premium": "#fbbf24",
    "--border-subtle": "#e2e8f0",
    "--border-muted": "#f1f5f9",
    "--background": "oklch(1 0 0)",
    "--foreground": "oklch(0.145 0 0)",
  },
  dark: {
    "--bg-canvas": "#020617",
    "--bg-surface": "#0f172a",
    "--brand-primary": "#2dd4bf",
    "--brand-secondary": "#0284c7",
    "--text-primary": "#f8fafc",
    "--text-muted": "#94a3b8",
    "--status-success": "#34d399",
    "--status-error": "#fb7185",
    "--status-premium": "#fcd34d",
    "--border-subtle": "#1e293b",
    "--border-muted": "#0f172a",
    "--background": "oklch(0.145 0 0)",
    "--foreground": "oklch(0.985 0 0)",
  },
};

function resolveInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveInitialSidebarCollapse(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY) === "1";
}

function applyThemeTokens(theme: ThemeMode) {
  const root = document.documentElement;
  Object.entries(THEME_TOKENS[theme]).forEach(([token, value]) => {
    root.style.setProperty(token, value);
  });
  root.style.colorScheme = theme;
}

export function Sidebar({ onNewProject }: SidebarProps) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<ThemeMode>(() => resolveInitialTheme());
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => resolveInitialSidebarCollapse());

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.setAttribute("data-theme", theme);
    applyThemeTokens(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", isCollapsed ? "4.5rem" : "16rem");
    window.localStorage.setItem(SIDEBAR_COLLAPSE_STORAGE_KEY, isCollapsed ? "1" : "0");
  }, [isCollapsed]);

  const toggleTheme = () => {
    setTheme((previousTheme) => (previousTheme === "dark" ? "light" : "dark"));
  };

  return (
    <aside
      className={cn(
        "border-r border-subtle glass h-screen fixed left-0 top-0 flex flex-col z-50 transition-[width] duration-200 overflow-hidden",
        isCollapsed ? "w-[4.5rem]" : "w-64"
      )}
    >
      <div className={cn("pt-6 pb-3", isCollapsed ? "px-3" : "px-6")}>
        <Link
          href="/projects"
          className={cn("flex items-center group", isCollapsed ? "justify-center" : "gap-2")}
          aria-label="Go to projects"
        >
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white font-bold group-hover:scale-105 transition-transform">
            SN
          </div>
          {!isCollapsed && <span className="text-xl font-bold tracking-tight text-brand-secondary">sopnow</span>}
        </Link>
      </div>

      <div className={cn("pb-2", isCollapsed ? "px-2 flex justify-center" : "px-3 flex justify-end")}>
        <button
          onClick={() => setIsCollapsed((current) => !current)}
          className="h-8 w-8 rounded-lg border border-subtle bg-canvas text-text-muted hover:text-text-primary flex items-center justify-center"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <CaretDoubleRight size={14} /> : <CaretDoubleLeft size={14} />}
        </button>
      </div>

      <nav className={cn("flex-1 py-4 space-y-1", isCollapsed ? "px-2" : "px-4")}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              aria-label={item.label}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-colors group",
                isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
                isActive
                  ? "bg-brand-primary/10 text-brand-primary"
                  : "text-text-muted hover:bg-canvas hover:text-text-primary"
              )}
            >
              <item.icon size={20} weight={isActive ? "fill" : "regular"} />
              {!isCollapsed && item.label}
              {isActive && !isCollapsed && <CaretRight size={14} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className={cn("border-t border-subtle", isCollapsed ? "p-2" : "p-4")}>
        <button
          onClick={onNewProject}
          disabled={!onNewProject}
          title={isCollapsed ? "New SOP" : undefined}
          className={cn(
            "w-full flex items-center justify-center bg-brand-primary text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
            isCollapsed ? "px-0" : "gap-2"
          )}
        >
          <PlusCircle size={20} />
          {!isCollapsed && <span>New SOP</span>}
        </button>
      </div>

      <div className={cn("space-y-3", isCollapsed ? "p-2" : "p-4")}>
        <button
          onClick={toggleTheme}
          title={isCollapsed ? (theme === "dark" ? "Dark Mode" : "Light Mode") : undefined}
          className={cn(
            "w-full flex items-center rounded-lg bg-canvas border border-subtle text-text-muted hover:text-text-primary transition-colors py-2",
            isCollapsed ? "justify-center px-2" : "justify-between gap-2 px-3"
          )}
        >
          {!isCollapsed && (
            <span className="text-xs font-bold uppercase tracking-wider">
              {theme === "dark" ? "Dark Mode" : "Light Mode"}
            </span>
          )}
          {theme === "dark" ? <Sun size={18} weight="bold" /> : <Moon size={18} weight="bold" />}
        </button>

        {isCollapsed ? (
          <div className="flex justify-center" title="ZaenKai">
            <div className="w-9 h-9 rounded-full bg-canvas flex items-center justify-center overflow-hidden border border-subtle">
              <span className="text-xs font-bold">ZK</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-canvas flex items-center justify-center overflow-hidden border border-subtle">
              <span className="text-xs font-bold">ZK</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-text-primary">ZaenKai</span>
              <span className="text-[10px] text-text-muted">Pro Administrator</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
