"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  X,
  Home,
  UserPlus,
  Gamepad2,
  BarChart2,
  User,
  Moon,
  Sun,
} from "lucide-react";

const navItems = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Create Founder", icon: UserPlus, href: "/create" },
  { label: "Play", icon: Gamepad2, href: "/play" },
  { label: "Results", icon: BarChart2, href: "/results" },
  { label: "Profile", icon: User, href: "/profile" },
];

// Reads saved theme on first render — avoids setState-in-effect lint violations.
// Returns true (dark) if no preference is saved.
function getInitialDark(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const saved = localStorage.getItem("hq-theme");
    if (saved === "light") {
      document.documentElement.classList.remove("dark");
      return false;
    }
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      return true;
    }
  } catch {}
  return document.documentElement.classList.contains("dark");
}

export const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(getInitialDark);
  const router = useRouter();
  const pathname = usePathname();

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("hq-theme", next ? "dark" : "light");
    } catch {}
  };

  const handleNav = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* Amber burger — fixed top-left, always visible */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="fixed top-4 left-4 z-40 border-[3px] border-primary bg-accent p-2.5 shadow-brutal-sm transition-transform hover:-translate-y-[1px] active:translate-y-[1px]"
      >
        <Menu className="w-5 h-5 text-accent-foreground" strokeWidth={2.5} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm transition-opacity"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed top-0 left-0 h-full z-50 w-72 bg-card border-r-[3px] border-primary flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ boxShadow: "4px 0px 0px 0px var(--color-primary)" }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-5 border-b-[2px] border-primary">
          <span className="font-display text-[10px] tracking-[0.25em] text-primary uppercase">
            HatchQuest
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
            className="border-[2px] border-primary p-1.5 transition-colors hover:border-accent"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-4 py-5 space-y-1" aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon, href }) => {
            const active = pathname === href;
            return (
              <button
                key={href}
                onClick={() => handleNav(href)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 font-display text-[10px] tracking-wider transition-colors text-left group ${
                  active
                    ? "bg-accent text-accent-foreground border-[2px] border-primary shadow-brutal-sm"
                    : "text-foreground/60 hover:text-accent hover:bg-muted border-[2px] border-transparent"
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    active ? "text-accent-foreground" : "group-hover:text-accent"
                  }`}
                />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Dark mode toggle */}
        <div className="px-4 pb-8 pt-4 border-t-[2px] border-primary">
          <button
            onClick={toggleDark}
            aria-pressed={dark}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="w-full flex items-center justify-between px-4 py-3.5 font-display text-[10px] tracking-wider text-foreground/60 border-[2px] border-primary hover:border-accent hover:text-foreground transition-colors"
          >
            <span className="uppercase">{dark ? "Dark Mode" : "Light Mode"}</span>
            <div className="flex items-center gap-2.5">
              {dark ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
              {/* Toggle track */}
              <div
                className={`relative w-9 h-5 border-[2px] border-primary transition-colors ${
                  dark ? "bg-accent" : "bg-muted"
                }`}
              >
                {/* Toggle thumb */}
                <div
                  className={`absolute top-0.5 w-3 h-3 bg-accent-foreground transition-transform duration-200 ${
                    dark ? "translate-x-[18px]" : "translate-x-[2px]"
                  }`}
                />
              </div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
