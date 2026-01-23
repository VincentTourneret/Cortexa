"use client";

import { ReactNode, useEffect, useState, createContext, useContext } from "react";
import { useSession } from "next-auth/react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { data: session } = useSession();
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Priorité : session > localStorage > préférences système
    let newTheme: Theme = "light";
    
    if (session?.user?.theme) {
      newTheme = session.user.theme as Theme;
    } else {
      const storedTheme = localStorage.getItem("theme") as Theme | null;
      if (storedTheme) {
        newTheme = storedTheme;
      } else {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
        newTheme = systemTheme;
      }
    }
    
    // Toujours appliquer le thème et mettre à jour l'état
    setTheme(newTheme);
    applyTheme(newTheme);
  }, [session?.user?.theme, mounted]);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const toggleTheme = () => {
    const newTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    // Sauvegarder dans localStorage comme fallback
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  // Éviter le flash de contenu non stylé
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
