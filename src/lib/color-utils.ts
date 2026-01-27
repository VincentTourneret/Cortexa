/**
 * Obtient les classes CSS pour appliquer une couleur comme bordure gauche (obsolète)
 */
export const getColorBorderClasses = (color: string | null | undefined): string => {
  if (!color) return "";
  return "";
};

/**
 * Obtient le style inline pour la couleur de bordure (obsolète)
 */
export const getColorBorderStyle = (color: string | null | undefined): React.CSSProperties => {
  return {};
};

/**
 * Obtient les classes CSS pour appliquer une couleur comme background
 */
export const getColorBackgroundClasses = (color: string | null | undefined): string => {
  if (!color) return "";
  return "transition-colors duration-200";
};

/**
 * Obtient le style inline pour la couleur de background
 */
export const getColorBackgroundStyle = (color: string | null | undefined): React.CSSProperties => {
  if (!color) return {};

  return {
    backgroundColor: color,
  };
};

/**
 * Vérifie si la couleur est sombre pour déterminer la couleur du texte
 */
export const isDarkColor = (color: string | null | undefined): boolean => {
  if (!color) return false;

  let r, g, b, a = 1;

  if (color.startsWith('rgba')) {
    const values = color.match(/[\d.]+/g);
    if (values) {
      [r, g, b, a] = values.map(Number);
    }
  } else if (color.startsWith('#')) {
    r = parseInt(color.slice(1, 3), 16);
    g = parseInt(color.slice(3, 5), 16);
    b = parseInt(color.slice(5, 7), 16);
  } else {
    return false;
  }

  if (r === undefined || g === undefined || b === undefined) return false;

  // Calcul de la luminance (formule standard)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Si le fond est très transparent, on considère qu'il est clair (fond blanc de l'app)
  if (a < 0.5) return false;

  return luminance < 0.5;
};

