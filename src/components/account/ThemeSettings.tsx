"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";

export const ThemeSettings: React.FC = () => {
  const { data: session, update } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  
  // Utiliser directement le thème depuis le contexte
  const isDark = theme === "dark";

  const handleThemeChange = async (checked: boolean) => {
    setIsLoading(true);
    const newTheme = checked ? "dark" : "light";
    const previousTheme = theme;

    try {
      // Mettre à jour le thème localement immédiatement pour un feedback instantané
      if (newTheme !== theme) {
        toggleTheme();
      }

      // Mettre à jour en base de données
      const response = await fetch("/api/auth/update-theme", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ theme: newTheme }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors de la mise à jour du thème");
      }

      // Mettre à jour la session pour synchroniser avec la BDD
      // Cela va déclencher le callback JWT avec trigger="update"
      await update();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du thème:", error);
      // Revenir à l'état précédent en cas d'erreur
      if (newTheme !== previousTheme) {
        toggleTheme();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {isDark ? (
          <Moon className="h-5 w-5 text-foreground" />
        ) : (
          <Sun className="h-5 w-5 text-foreground" />
        )}
        <div>
          <p className="text-sm font-medium text-foreground">Thème sombre</p>
          <p className="text-xs text-muted-foreground">
            Activer le mode sombre
          </p>
        </div>
      </div>
      <Switch
        checked={isDark}
        onCheckedChange={handleThemeChange}
        disabled={isLoading}
        aria-label="Basculer le thème"
      />
    </div>
  );
};
