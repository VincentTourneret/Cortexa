"use client";

import { useState } from "react";
import { Home, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { SearchModal } from "@/components/search/SearchModal";

const navItems = [
  { href: "/account", icon: User, label: "Compte", type: "link" as const },
  { href: "/dashboard", icon: Home, label: "Accueil", type: "link" as const },
  { href: "/search", icon: Search, label: "Recherche", type: "button" as const },
];

export const MobileNavbar: React.FC = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Ne pas afficher la navbar si l'utilisateur n'est pas connecté
  if (status === "loading" || !session) {
    return null;
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="mx-auto max-w-md">
          <div className="mx-4 mb-4 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg">
            <div className="flex items-center justify-around px-4 py-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                if (item.type === "button") {
                  return (
                    <button
                      key={item.href}
                      onClick={() => setSearchModalOpen(true)}
                      className="flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                      aria-label={item.label}
                    >
                      <Icon className="h-6 w-6" />
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all ${
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                    }`}
                    aria-label={item.label}
                  >
                    <Icon className="h-6 w-6" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      <SearchModal open={searchModalOpen} onOpenChange={setSearchModalOpen} />
    </>
  );
};
