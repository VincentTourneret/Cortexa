/**
 * Utilitaires de conversion de contenu entre format texte et Editor.js
 */

export type EditorJSBlock = {
  type: string;
  data: Record<string, any>;
};

export type EditorJSData = {
  time?: number;
  blocks: EditorJSBlock[];
  version?: string;
};

/**
 * Convertit un texte simple en format Editor.js
 */
export const textToEditorJS = (text: string): EditorJSData => {
  if (!text || text.trim() === "") {
    return {
      time: Date.now(),
      blocks: [],
      version: "2.31.1",
    };
  }

  // Séparer le texte par paragraphes (double saut de ligne ou simple)
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const blocks: EditorJSBlock[] = paragraphs.map((paragraph) => {
    // Détecter si c'est une liste (commence par - ou *)
    if (/^[\-\*]\s/.test(paragraph)) {
      const items = paragraph
        .split(/\n/)
        .map((line) => line.replace(/^[\-\*]\s/, "").trim())
        .filter((line) => line.length > 0);

      return {
        type: "list",
        data: {
          style: "unordered",
          items,
        },
      };
    }

    // Détecter si c'est une liste numérotée
    if (/^\d+\.\s/.test(paragraph)) {
      const items = paragraph
        .split(/\n/)
        .map((line) => line.replace(/^\d+\.\s/, "").trim())
        .filter((line) => line.length > 0);

      return {
        type: "list",
        data: {
          style: "ordered",
          items,
        },
      };
    }

    // Détecter si c'est un titre (commence par #)
    const headerMatch = paragraph.match(/^(#{1,6})\s(.+)$/);
    if (headerMatch) {
      const level = Math.min(headerMatch[1].length, 6);
      const text = headerMatch[2];
      return {
        type: "header",
        data: {
          text,
          level,
        },
      };
    }

    // Par défaut, c'est un paragraphe
    return {
      type: "paragraph",
      data: {
        text: paragraph.replace(/\n/g, "<br>"),
      },
    };
  });

  return {
    time: Date.now(),
    blocks,
    version: "2.31.1",
  };
};

/**
 * Convertit un format Editor.js en texte simple
 */
export const editorJSToText = (data: EditorJSData): string => {
  if (!data || !data.blocks || data.blocks.length === 0) {
    return "";
  }

  const lines: string[] = [];

  data.blocks.forEach((block) => {
    switch (block.type) {
      case "paragraph":
        if (block.data.text) {
          lines.push(block.data.text.replace(/<br\s*\/?>/gi, "\n"));
        }
        break;

      case "header":
        if (block.data.text) {
          const level = block.data.level || 1;
          lines.push("#".repeat(level) + " " + block.data.text);
        }
        break;

      case "list":
        if (block.data.items && Array.isArray(block.data.items)) {
          const prefix = block.data.style === "ordered" ? "1. " : "- ";
          block.data.items.forEach((item: string, index: number) => {
            if (block.data.style === "ordered") {
              lines.push(`${index + 1}. ${item}`);
            } else {
              lines.push(`${prefix}${item}`);
            }
          });
        }
        break;

      case "quote":
        if (block.data.text) {
          lines.push(`> ${block.data.text}`);
          if (block.data.caption) {
            lines.push(`— ${block.data.caption}`);
          }
        }
        break;

      case "code":
        if (block.data.code) {
          lines.push("```");
          lines.push(block.data.code);
          lines.push("```");
        }
        break;

      case "delimiter":
        lines.push("* * *");
        break;

      case "warning":
        if (block.data.message) {
          lines.push(`⚠️ ${block.data.title || "Attention"}`);
          lines.push(block.data.message);
        }
        break;

      case "table":
        if (block.data.content && Array.isArray(block.data.content)) {
          block.data.content.forEach((row: string[]) => {
            lines.push(row.join(" | "));
          });
        }
        break;

      case "accordion":
        if (block.data.title) {
          lines.push(`[Accordéon: ${block.data.title}]`);
        }
        if (block.data.content && block.data.content.blocks) {
          // Utilisation récursive simplifiée pour le contenu de l'accordéon
          const nestedText = editorJSToText(block.data.content);
          if (nestedText) {
            lines.push(nestedText.split('\n').map(l => `  ${l}`).join('\n'));
          }
        }
        break;

      default:
        // Pour les autres types (image, embed, etc.), on ignore ou on ajoute un placeholder
        if (block.data.text) {
          lines.push(block.data.text);
        }
    }

    // Ajouter une ligne vide après chaque bloc
    lines.push("");
  });

  return lines.join("\n").trim();
};

/**
 * Détecte si le contenu est au format Editor.js
 */
export const isEditorJSFormat = (content: string): boolean => {
  if (!content || content.trim() === "") {
    return false;
  }

  try {
    const parsed = JSON.parse(content);
    // Vérifier que c'est un objet avec un tableau de blocks
    return (
      typeof parsed === "object" &&
      parsed !== null &&
      Array.isArray(parsed.blocks)
    );
  } catch {
    return false;
  }
};

/**
 * Parse le contenu Editor.js de manière sécurisée
 */
export const parseEditorJSContent = (content: string): EditorJSData | null => {
  if (!isEditorJSFormat(content)) {
    return null;
  }

  try {
    return JSON.parse(content) as EditorJSData;
  } catch {
    return null;
  }
};

/**
 * Valide et nettoie le contenu Editor.js
 */
export const sanitizeEditorJSData = (data: EditorJSData): EditorJSData => {
  return {
    time: data.time || Date.now(),
    blocks: Array.isArray(data.blocks) ? data.blocks : [],
    version: data.version || "2.31.1",
  };
};
