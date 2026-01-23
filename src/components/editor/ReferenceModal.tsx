"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EditorJSWrapper } from "@/components/editor/EditorJSWrapper";
import type { CardContent, SectionContent } from "@/types/reference";
import type { EditorJSData } from "@/lib/content-converter";

interface ReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  sectionId?: string;
}

export function ReferenceModal({
  isOpen,
  onClose,
  cardId,
  sectionId,
}: ReferenceModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<CardContent | null>(null);
  const [section, setSection] = useState<SectionContent | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const fetchContent = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/knowledge-cards/${cardId}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || "Erreur lors du chargement du contenu"
          );
        }

        const data = await response.json();
        setCard(data.card);

        // Si on veut afficher une section spécifique, la trouver
        if (sectionId && data.card.sections) {
          const foundSection = data.card.sections.find(
            (s: SectionContent) => s.id === sectionId
          );
          setSection(foundSection || null);
        }
      } catch (err) {
        console.error("Erreur lors du chargement:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement du contenu"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [isOpen, cardId, sectionId]);

  // Réinitialiser l'état lors de la fermeture
  useEffect(() => {
    if (!isOpen) {
      setCard(null);
      setSection(null);
      setError(null);
      setLoading(true);
    }
  }, [isOpen]);

  // Préparer le contenu à afficher
  const getDisplayContent = (): {
    title: string;
    description?: string;
    editorData?: EditorJSData;
  } | null => {
    if (!card) return null;

    // Afficher une section spécifique
    if (section) {
      try {
        const editorData = JSON.parse(section.content) as EditorJSData;
        return {
          title: section.title,
          description: `Section de la fiche : ${card.title}`,
          editorData,
        };
      } catch (err) {
        console.error("Erreur de parsing du contenu de section:", err);
        return {
          title: section.title,
          description: `Section de la fiche : ${card.title}`,
        };
      }
    }

    // Afficher toute la fiche
    return {
      title: card.title,
      description: card.summary || undefined,
    };
  };

  const displayContent = getDisplayContent();

  // Construire l'URL de navigation
  const getNavigationUrl = (): string | null => {
    if (!cardId) return null;
    
    // Si on affiche une section spécifique, ajouter l'ancre
    if (sectionId) {
      return `/knowledge/${cardId}#${sectionId}`;
    }
    
    // Sinon, simplement la page de la fiche
    return `/knowledge/${cardId}`;
  };

  const navigationUrl = getNavigationUrl();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl">
                {loading ? "Chargement..." : displayContent?.title || "Contenu"}
              </DialogTitle>
              {displayContent?.description && (
                <DialogDescription className="text-base mt-1.5">
                  {displayContent.description}
                </DialogDescription>
              )}
            </div>
            {!loading && navigationUrl && (
              <Link
                href={navigationUrl}
                onClick={onClose}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                title={sectionId ? "Ouvrir la section" : "Ouvrir la fiche"}
              >
                <span className="hidden sm:inline">Ouvrir</span>
                <ExternalLink className="h-4 w-4" />
              </Link>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
                <p className="text-sm text-muted-foreground">
                  Chargement du contenu...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {!loading && !error && displayContent && (
            <>
              {/* Afficher le contenu de la section */}
              {displayContent.editorData && (
                <div className="mt-4">
                  <EditorJSWrapper
                    data={displayContent.editorData}
                    readOnly={true}
                    minHeight={200}
                  />
                </div>
              )}

              {/* Afficher toutes les sections de la fiche */}
              {!section && card && card.sections && card.sections.length > 0 && (
                <div className="mt-4 space-y-6">
                  {card.sections.map((sec) => {
                    try {
                      const sectionData = JSON.parse(
                        sec.content
                      ) as EditorJSData;
                      return (
                        <div
                          key={sec.id}
                          className="rounded-lg border border-border bg-card/50 p-4"
                        >
                          <h3 className="mb-3 text-lg font-semibold text-foreground">
                            {sec.title}
                          </h3>
                          <EditorJSWrapper
                            data={sectionData}
                            readOnly={true}
                            minHeight={150}
                          />
                        </div>
                      );
                    } catch (err) {
                      console.error(
                        "Erreur de parsing pour la section:",
                        sec.id,
                        err
                      );
                      return (
                        <div
                          key={sec.id}
                          className="rounded-lg border border-border bg-card/50 p-4"
                        >
                          <h3 className="mb-2 text-lg font-semibold text-foreground">
                            {sec.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Erreur lors du chargement du contenu
                          </p>
                        </div>
                      );
                    }
                  })}
                </div>
              )}

              {/* Message si pas de sections */}
              {!section && card && card.sections.length === 0 && (
                <div className="mt-4 rounded-lg border border-border bg-muted/30 p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Cette fiche ne contient pas encore de sections.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
