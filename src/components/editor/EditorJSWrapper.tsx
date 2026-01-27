"use client";

import React, { memo, useEffect, useRef, useState, useCallback } from "react";
import type { EditorJSData } from "@/lib/content-converter";
import { ReferenceModal } from "@/components/editor/ReferenceModal";

type EditorJSWrapperProps = {
  data?: EditorJSData;
  onChange?: (data: EditorJSData) => void;
  readOnly?: boolean;
  placeholder?: string;
  minHeight?: number;
};

const EditorJSWrapperComponent: React.FC<EditorJSWrapperProps> = ({
  data,
  onChange,
  readOnly = false,
  placeholder = "Commencez à écrire ou appuyez sur Tab pour afficher les commandes...",
  minHeight = 300,
}) => {
  const editorInstanceRef = useRef<any>(null);
  const holderIdRef = useRef(`editorjs-${Math.random().toString(36).substring(7)}`);
  const isInitializingRef = useRef(false);
  const initialDataRef = useRef<EditorJSData | undefined>(data);
  const onChangeRef = useRef(onChange);
  const readOnlyRef = useRef(readOnly);
  const isInternalChangeRef = useRef(false); // Nouveau: suivre si le changement vient de l'éditeur

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // État pour la modale de référence
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCardId, setModalCardId] = useState<string>("");
  const [modalSectionId, setModalSectionId] = useState<string | undefined>();

  // Garder les refs à jour
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    readOnlyRef.current = readOnly;
  }, [readOnly]);

  // Fonction globale pour ouvrir la modale de référence
  useEffect(() => {
    window.openReferenceModal = (cardId: string, sectionId?: string) => {
      setModalCardId(cardId);
      setModalSectionId(sectionId);
      setModalOpen(true);
    };

    return () => {
      delete window.openReferenceModal;
    };
  }, []);

  // Initialisation de l'éditeur (une seule fois)
  useEffect(() => {
    if (isInitializingRef.current || editorInstanceRef.current) {
      return;
    }

    let isMounted = true;
    isInitializingRef.current = true;

    const initEditor: () => Promise<void> = async () => {
      try {
        // Import dynamique des modules Editor.js
        const [
          { default: EditorJS },
          { default: Header },
          { default: List },
          { default: Quote },
          { default: Code },
          { default: LinkTool },
          { default: ImageTool },
          { default: Table },
          { default: Embed },
          { default: Delimiter },
          { default: Warning },
          { default: Marker },
          { default: InlineCode },
          { default: FontSizeTool },
          { default: ReferenceTool },
          { default: InlineReferenceTool },
        ] = await Promise.all([
          import("@editorjs/editorjs"),
          import("@editorjs/header"),
          import("@editorjs/list"),
          import("@editorjs/quote"),
          import("@editorjs/code"),
          import("@editorjs/link"),
          import("@editorjs/image"),
          import("@editorjs/table"),
          import("@editorjs/embed"),
          import("@editorjs/delimiter"),
          import("@editorjs/warning"),
          import("@editorjs/marker"),
          import("@editorjs/inline-code"),
          import("./tools/FontSizeTool"),
          import("./tools/ReferenceTool"),
          import("./tools/InlineReferenceTool"),
        ]);

        if (!isMounted) return;

        const editor = new EditorJS({
          holder: holderIdRef.current,
          data: initialDataRef.current || { blocks: [] },
          readOnly: readOnlyRef.current,
          placeholder,
          minHeight,
          onChange: async () => {
            if (onChangeRef.current && !readOnlyRef.current) {
              try {
                isInternalChangeRef.current = true; // Marquer comme changement interne
                const outputData = await editor.save();
                onChangeRef.current(outputData as EditorJSData);
                // Réinitialiser après un court délai pour permettre au parent de mettre à jour
                setTimeout(() => {
                  isInternalChangeRef.current = false;
                }, 100);
              } catch (error) {
                console.error("Erreur lors de la sauvegarde:", error);
                isInternalChangeRef.current = false;
              }
            }
          },
          tools: {
            header: {
              // @ts-ignore - EditorJS typing issue
              class: Header,
              inlineToolbar: ["marker", "link", "fontSize", "inlineReference"],
              config: {
                placeholder: "Titre",
                levels: [1, 2, 3, 4, 5, 6],
                defaultLevel: 2,
              },
            },
            list: {
              class: List,
              inlineToolbar: ["marker", "link", "fontSize", "inlineReference"],
              config: {
                defaultStyle: "unordered",
                maxLevel: 5,
              },
            },
            quote: {
              class: Quote,
              inlineToolbar: ["marker", "link", "fontSize", "inlineReference"],
              config: {
                quotePlaceholder: "Citation",
                captionPlaceholder: "Auteur",
              },
            },
            code: {
              class: Code,
              config: {
                placeholder: "Entrez votre code ici",
              },
            },
            warning: {
              class: Warning,
              inlineToolbar: true,
              config: {
                titlePlaceholder: "Titre",
                messagePlaceholder: "Message",
              },
            },
            delimiter: Delimiter,
            table: {
              // @ts-ignore - EditorJS typing issue
              class: Table,
              inlineToolbar: true,
              config: {
                rows: 2,
                cols: 3,
              },
            },
            linkTool: {
              class: LinkTool,
              config: {
                endpoint: "/api/fetch-link-metadata",
              },
            },
            image: {
              class: ImageTool,
              config: {
                endpoints: {
                  byFile: "/api/upload-image",
                  byUrl: "/api/fetch-image",
                },
                additionalRequestHeaders: {
                  "X-Requested-With": "XMLHttpRequest",
                },
              },
            },
            embed: {
              class: Embed,
              config: {
                services: {
                  youtube: true,
                  vimeo: true,
                  twitter: true,
                  github: true,
                  instagram: true,
                },
              },
            },
            marker: {
              // @ts-ignore - EditorJS typing issue (inline tool)
              class: Marker,
            },
            inlineCode: {
              class: InlineCode,
            },
            fontSize: {
              // @ts-ignore - EditorJS typing issue (inline tool)
              class: FontSizeTool,
            },
            inlineReference: {
              // @ts-ignore - EditorJS typing issue (inline tool)
              class: InlineReferenceTool,
              config: {
                searchEndpoint: "/api/search",
              },
            },
            reference: {
              class: ReferenceTool,
              config: {
                searchEndpoint: "/api/search",
              },
            },
          },
          i18n: {
            messages: {
              ui: {
                blockTunes: {
                  toggler: {
                    "Click to tune": "Cliquer pour configurer",
                    "or drag to move": "ou glisser pour déplacer",
                  },
                },
                inlineToolbar: {
                  converter: {
                    "Convert to": "Convertir en",
                  },
                },
                toolbar: {
                  toolbox: {
                    Add: "Ajouter",
                  },
                },
              },
              toolNames: {
                Text: "Texte",
                Heading: "Titre",
                List: "Liste",
                Warning: "Avertissement",
                Checklist: "Checklist",
                Quote: "Citation",
                Code: "Code",
                Delimiter: "Séparateur",
                "Raw HTML": "HTML brut",
                Table: "Tableau",
                Link: "Lien",
                Marker: "Marqueur",
                Bold: "Gras",
                Italic: "Italique",
                InlineCode: "Code en ligne",
                Image: "Image",
                Embed: "Intégration",
                "Taille de police": "Taille de police",
                Reference: "Référence",
              },
              tools: {
                warning: {
                  Title: "Titre",
                  Message: "Message",
                },
                link: {
                  "Add a link": "Ajouter un lien",
                },
                stub: {
                  "The block can not be displayed correctly.":
                    "Le bloc ne peut pas être affiché correctement.",
                },
              },
              blockTunes: {
                delete: {
                  Delete: "Supprimer",
                },
                moveUp: {
                  "Move up": "Monter",
                },
                moveDown: {
                  "Move down": "Descendre",
                },
              },
            },
          },
          autofocus: false,
          // @ts-ignore - EditorJS typing issue
          logLevel: process.env.NODE_ENV === "production" ? "ERROR" : "WARN",
        });

        await editor.isReady;

        if (isMounted) {
          editorInstanceRef.current = editor;
          setIsReady(true);

          // En mode lecture seule, réattacher les événements des liens inline
          if (readOnlyRef.current) {
            setTimeout(() => {
              if ((window as any).reattachInlineReferenceEvents) {
                (window as any).reattachInlineReferenceEvents();
              }
            }, 300);
          }
        }
      } catch (err) {
        console.error("Erreur lors de l'initialisation d'Editor.js:", err);
        if (isMounted) {
          setError("Erreur lors du chargement de l'éditeur");
        }
      }
    };

    initEditor();

    return () => {
      isMounted = false;
      if (editorInstanceRef.current?.destroy) {
        try {
          editorInstanceRef.current.destroy();
        } catch (err) {
          console.error("Erreur lors de la destruction de l'éditeur:", err);
        }
        editorInstanceRef.current = null;
      }
      isInitializingRef.current = false;
    };
  }, []); // Empty deps - initialize once

  // Gérer les changements de mode lecture seule
  useEffect(() => {
    if (isReady && editorInstanceRef.current?.readOnly) {
      const currentReadOnlyState = editorInstanceRef.current.readOnly.isEnabled;
      if (currentReadOnlyState !== readOnly) {
        editorInstanceRef.current.readOnly.toggle(readOnly);
      }
    }
  }, [readOnly, isReady]);

  // Méthode pour mettre à jour les données de l'éditeur
  const updateEditorData = useCallback(
    async (newData: EditorJSData) => {
      if (!isReady || !editorInstanceRef.current) {
        return;
      }

      try {
        // Vérifier l'état de lecture seule directement sur l'instance EditorJS
        const isCurrentlyReadOnly = editorInstanceRef.current.readOnly?.isEnabled ?? false;

        // En mode lecture seule, on peut juste render directement
        if (isCurrentlyReadOnly) {
          await editorInstanceRef.current.render(newData);
          // Réattacher les événements des liens inline après le rendu
          setTimeout(() => {
            if ((window as any).reattachInlineReferenceEvents) {
              (window as any).reattachInlineReferenceEvents();
            }
          }, 200);
          return;
        }

        // En mode édition, comparer les données avant de render
        const currentData = await editorInstanceRef.current.save();

        const currentJson = JSON.stringify(currentData);
        const newJson = JSON.stringify(newData);

        if (currentJson !== newJson) {
          // Sauvegarder l'état de focus
          const hadFocus = document.activeElement?.closest(`#${holderIdRef.current}`) !== null;

          await editorInstanceRef.current.render(newData);

          // Restaurer le focus si nécessaire
          if (hadFocus) {
            const firstBlock = document.querySelector(`#${holderIdRef.current} .ce-block`);
            if (firstBlock instanceof HTMLElement) {
              firstBlock.focus();
            }
          }
        }
      } catch (err) {
        console.error("Erreur lors de la mise à jour des données:", err);
      }
    },
    [isReady]
  );

  // Garder une trace des dernières données pour éviter les re-renders inutiles
  const lastDataRef = useRef<string>("");

  // Mettre à jour les données quand elles changent (seulement si le changement vient de l'extérieur)
  useEffect(() => {
    if (!data || !isReady) {
      return;
    }

    // Ignorer les changements internes (générés par l'éditeur lui-même)
    if (isInternalChangeRef.current) {
      return;
    }

    const newDataJson = JSON.stringify(data);
    if (lastDataRef.current !== newDataJson) {
      lastDataRef.current = newDataJson;
      updateEditorData(data);
    }
  }, [data, isReady, updateEditorData]);

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <>
      <div
        id={holderIdRef.current}
        className="editorjs-wrapper rounded-lg border border-border bg-card p-4"
        style={{ minHeight: `${minHeight}px` }}
      />

      {/* Modale pour afficher les références */}
      <ReferenceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        cardId={modalCardId}
        sectionId={modalSectionId}
      />
    </>
  );
};

export const EditorJSWrapper = memo(EditorJSWrapperComponent);
