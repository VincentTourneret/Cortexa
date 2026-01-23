/**
 * Initialisation du thème côté client
 * 
 * Cette fonction est utilisée pour initialiser le thème avant l'hydratation React.
 * Elle peut être appelée depuis un script inline ou un fichier externe.
 */
export const initTheme = (): void => {
  try {
    const theme = localStorage.getItem("theme");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    const initialTheme = theme || systemTheme;
    
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch (e) {
    // Fallback silencieux si localStorage n'est pas disponible
  }
};
