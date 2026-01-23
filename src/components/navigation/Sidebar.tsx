"use client";

import { useState, useEffect } from "react";
import { Home, Search, User, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { SearchModal } from "@/components/search/SearchModal";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Accueil", type: "link" as const },
  { href: "/search", icon: Search, label: "Recherche", type: "button" as const },
  { href: "/account", icon: User, label: "Compte", type: "link" as const },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Raccourci clavier Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Ne pas afficher la sidebar si l'utilisateur n'est pas connecté
  if (status === "loading" || !session) {
    return null;
  }

  return (
    <>
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-40 w-64 flex-col border-r border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="flex flex-col h-full p-4">
          {/* Logo ou titre de l'application */}
          <div className="mb-8 px-4 py-6">
            <h1 className="text-2xl font-bold text-foreground">Ju</h1>
          </div>

          {/* Navigation principale */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              if (item.type === "button") {
                return (
                  <button
                    key={item.href}
                    onClick={() => setSearchModalOpen(true)}
                    className="w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-all text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                  </button>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                    isActive
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Section utilisateur en bas */}
          <div className="mt-auto space-y-2 border-t border-border/50 pt-4">
            <div className="px-4 py-2">
              <p className="text-sm font-medium text-foreground">
                {session.user?.name || session.user?.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {session.user?.email}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-all hover:bg-accent/50 hover:text-accent-foreground"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      <SearchModal open={searchModalOpen} onOpenChange={setSearchModalOpen} />
    </>
  );
};
