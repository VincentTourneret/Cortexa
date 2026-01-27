"use client";

import { usePathname, useRouter } from "next/navigation";
import { Session } from "next-auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ThemeSettings } from "@/components/account/ThemeSettings";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { SectionTemplatesManager } from "@/components/account/SectionTemplatesManager";
import { Lock, Palette, FileText, User } from "lucide-react";

interface AccountNavigationProps {
  session: Session;
}

export const AccountNavigation: React.FC<AccountNavigationProps> = ({
  session,
}) => {
  const pathname = usePathname();
  const router = useRouter();

  // Déterminer l'onglet actif basé sur l'URL
  const getActiveTab = () => {
    if (pathname === "/account/password") return "password";
    if (pathname === "/account/theme") return "theme";
    if (pathname === "/account/sections") return "sections";
    return "profile";
  };

  const handleTabChange = (value: string) => {
    if (value === "profile") {
      router.push("/account");
    } else {
      router.push(`/account/${value}`);
    }
  };

  return (
    <Tabs value={getActiveTab()} onValueChange={handleTabChange} className="w-full">
      <div className="flex items-center justify-between mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Mot de passe</span>
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Thème</span>
          </TabsTrigger>
          <TabsTrigger value="sections" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Sections</span>
          </TabsTrigger>
        </TabsList>
        <div className="hidden md:block">
          <LogoutButton />
        </div>
      </div>

      <TabsContent value="profile" className="mt-6">
        <div className="rounded-lg bg-card p-8 shadow-lg border border-border">
          <h2 className="mb-4 text-xl font-semibold text-card-foreground">
            Informations de session
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Email:</span>{" "}
              {session.user.email}
            </p>
            <p>
              <span className="font-medium text-foreground">ID:</span>{" "}
              {session.user.id}
            </p>
          </div>
        </div>
        <div className="md:hidden mt-6">
          <LogoutButton />
        </div>
      </TabsContent>

      <TabsContent value="password" className="mt-6">
        <div className="rounded-lg bg-card p-8 shadow-lg border border-border">
          <h2 className="mb-4 text-xl font-semibold text-card-foreground">
            Modifier mon mot de passe
          </h2>
          <ChangePasswordForm />
        </div>
      </TabsContent>

      <TabsContent value="theme" className="mt-6">
        <div className="rounded-lg bg-card p-8 shadow-lg border border-border">
          <h2 className="mb-4 text-xl font-semibold text-card-foreground">
            Préférences d'affichage
          </h2>
          <ThemeSettings />
        </div>
      </TabsContent>

      <TabsContent value="sections" className="mt-6">
        <div className="rounded-lg bg-card p-8 shadow-lg border border-border">
          <SectionTemplatesManager />
        </div>
      </TabsContent>
    </Tabs>
  );
};
