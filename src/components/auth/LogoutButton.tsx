"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export const LogoutButton = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  };

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoading}
      variant="outline"
      className="bg-card hover:bg-accent text-card-foreground hover:text-accent-foreground border-border"
    >
      {isLoading ? "Déconnexion..." : "Se déconnecter"}
    </Button>
  );
};
