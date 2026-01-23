/**
 * Script d'initialisation du thème
 * 
 * Ce script s'exécute avant l'hydratation React pour éviter le flash
 * de contenu non stylé (FOUC - Flash of Unstyled Content).
 * 
 * Il applique le thème depuis localStorage ou les préférences système
 * avant que React ne prenne le contrôle du DOM.
 */
export const ThemeScript = () => {
  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var theme = localStorage.getItem('theme');
              var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              var initialTheme = theme || systemTheme;
              if (initialTheme === 'dark') {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch (e) {
              // Fallback silencieux si localStorage n'est pas disponible
            }
          })();
        `,
      }}
    />
  );
};
