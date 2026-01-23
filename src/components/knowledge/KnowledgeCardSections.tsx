"use client";

import React, { memo, useState, useCallback, useEffect } from "react";
import { Plus, Save, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import dynamic from "next/dynamic";
import {
  textToEditorJS,
  parseEditorJSContent,
  sanitizeEditorJSData,
  type EditorJSData,
} from "@/lib/content-converter";
import {
  useSections,
  useCreateSection,
  useUpdateSection,
} from "@/hooks/api/useSections";

// Import dynamique d'EditorJS (client-side only)
const EditorJSWrapper = dynamic(
  () => import("@/components/editor/EditorJSWrapper").then((mod) => mod.EditorJSWrapper),
  { ssr: false }
);

type KnowledgeCard = {
  id: string;
  title: string;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
};

type KnowledgeSection = {
  id: string;
  title: string;
  content: string;
  contentType?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

type KnowledgeCardSectionsProps = {
  card: KnowledgeCard;
  initialSections?: KnowledgeSection[];
};

const KnowledgeCardSectionsComponent: React.FC<KnowledgeCardSectionsProps> = ({
  card,
}) => {
  const { data: sections = [], isLoading } = useSections(card.id);
  const createMutation = useCreateSection();
  const updateMutation = useUpdateSection();
  const [activeTab, setActiveTab] = useState<string>(sections[0]?.id ?? "");
  const [editingSections, setEditingSections] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [dialogEditorData, setDialogEditorData] = useState<EditorJSData>({ blocks: [] });
  const [sectionEditorDataMap, setSectionEditorDataMap] = useState<Map<string, EditorJSData>>(new Map());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<Map<string, boolean>>(new Map());

  // Mettre à jour l'activeTab quand les sections changent
  useEffect(() => {
    if (sections.length > 0 && !activeTab) {
      setActiveTab(sections[0].id);
    }
  }, [sections, activeTab]);

  // Obtenir les données Editor.js pour une section donnée
  const getSectionEditorData = useCallback((section: KnowledgeSection): EditorJSData => {
    // Si c'est déjà au format Editor.js, parser
    if (section.contentType === "editorjs") {
      const parsed = parseEditorJSContent(section.content);
      return parsed || { blocks: [] };
    }

    // Sinon, convertir le texte en Editor.js
    return textToEditorJS(section.content);
  }, []);

  const handleCreateSection = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setErrorMessage(null);

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setErrorMessage("Le titre est requis.");
      return;
    }

    try {
      // Nettoyer et valider les données avant l'envoi
      const sanitizedData = sanitizeEditorJSData(dialogEditorData || { blocks: [] });
      
      const result = await createMutation.mutateAsync({
        cardId: card.id,
        title: trimmedTitle,
        content: JSON.stringify(sanitizedData),
        contentType: "editorjs",
      });

      setActiveTab(result.section.id);
      setIsDialogOpen(false);
      setTitle("");
      setDialogEditorData({ blocks: [] });
    } catch (error) {
      console.error("Erreur lors de la création de la section:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Erreur serveur. Réessayez."
      );
    }
  };

  const handleSaveSection = async (sectionId: string) => {
    const activeSection = sections.find((s) => s.id === sectionId);
    if (!activeSection) {
      return;
    }

    const currentEditorData = sectionEditorDataMap.get(sectionId);
    if (!currentEditorData) {
      return;
    }

    setErrorMessage(null);

    // Nettoyer et valider les données avant l'envoi
    const sanitizedData = sanitizeEditorJSData(currentEditorData);
    console.log("Données Editor.js à sauvegarder:", sanitizedData);

    try {
      await updateMutation.mutateAsync({
        cardId: card.id,
        sectionId: activeSection.id,
        content: JSON.stringify(sanitizedData),
        contentType: "editorjs",
      });

      setHasUnsavedChanges(prev => {
        const newMap = new Map(prev);
        newMap.set(sectionId, false);
        return newMap;
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la section:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Erreur serveur. Réessayez."
      );
    }
  };

  const handleSectionEditorChange = useCallback((sectionId: string) => 
    (data: EditorJSData) => {
      if (editingSections.has(sectionId)) {
        setSectionEditorDataMap(prev => {
          const newMap = new Map(prev);
          newMap.set(sectionId, data);
          return newMap;
        });
        setHasUnsavedChanges(prev => {
          const newMap = new Map(prev);
          newMap.set(sectionId, true);
          return newMap;
        });
      }
    }, [editingSections]
  );

  const toggleEditMode = useCallback((sectionId: string) => {
    const isCurrentlyEditing = editingSections.has(sectionId);
    const hasChanges = hasUnsavedChanges.get(sectionId);
    
    if (isCurrentlyEditing && hasChanges) {
      const confirmed = window.confirm(
        "Vous avez des modifications non sauvegardées. Voulez-vous continuer ?"
      );
      if (!confirmed) {
        return;
      }
    }
    
    setEditingSections(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyEditing) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
    
    if (isCurrentlyEditing) {
      setHasUnsavedChanges(prev => {
        const newMap = new Map(prev);
        newMap.set(sectionId, false);
        return newMap;
      });
    }
    
    setErrorMessage(null);
  }, [editingSections, hasUnsavedChanges]);

  const handleDialogEditorChange = useCallback((data: EditorJSData) => {
    setDialogEditorData(data);
  }, []);

  const handleTabChange = (value: string) => {
    const currentHasChanges = hasUnsavedChanges.get(activeTab);
    if (currentHasChanges && editingSections.has(activeTab)) {
      const confirmed = window.confirm(
        "Vous avez des modifications non sauvegardées. Voulez-vous continuer ?"
      );
      if (!confirmed) {
        return;
      }
    }
    setActiveTab(value);
    setErrorMessage(null);
  };

  // Initialiser les données de l'éditeur pour chaque section au premier chargement
  useEffect(() => {
    setSectionEditorDataMap(prev => {
      const newMap = new Map(prev);
      let hasChanges = false;
      
      sections.forEach(section => {
        if (!newMap.has(section.id)) {
          const editorData = section.contentType === "editorjs"
            ? parseEditorJSContent(section.content) || { blocks: [] }
            : textToEditorJS(section.content);
          newMap.set(section.id, editorData);
          hasChanges = true;
        }
      });

      return hasChanges ? newMap : prev;
    });
  }, [sections]);

  const handleAddTabClick = () => {
    setIsDialogOpen(true);
    setDialogEditorData({ blocks: [] });
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setErrorMessage(null);
      setTitle("");
      setDialogEditorData({ blocks: [] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Message d'erreur global */}
      {errorMessage && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {/* Sections */}
      <section className="space-y-4">
        {sections.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
            Aucune section pour le moment. Ajoutez-en une pour structurer la
            fiche.
          </div>
        ) : null}

        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="space-y-4"
          >
            <nav className="flex items-center gap-2">
              <TabsList className="w-full justify-start gap-2 overflow-x-auto">
                {sections.map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="shrink-0 max-w-[180px] truncate"
                  >
                    {section.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddTabClick}
                aria-label="Ajouter une nouvelle section"
                title="Ajouter une section"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </nav>

            {sections.map((section) => {
              const sectionData = sectionEditorDataMap.get(section.id) || getSectionEditorData(section);
              const isEditing = editingSections.has(section.id);
              const sectionHasChanges = hasUnsavedChanges.get(section.id) || false;
              
              return (
                <TabsContent key={section.id} value={section.id}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-semibold text-card-foreground">
                          {section.title}
                        </h4>
                        <button
                          onClick={() => toggleEditMode(section.id)}
                          className="rounded-md p-1 hover:bg-muted transition-colors"
                          aria-label={isEditing ? "Mode visualisation" : "Mode édition"}
                          title={isEditing ? "Passer en mode visualisation" : "Passer en mode édition"}
                        >
                          {isEditing ? (
                            <Edit className="h-4 w-4 text-primary" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Modifié le{" "}
                        {new Date(section.updatedAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>

                    {/* Editor.js */}
                    <EditorJSWrapper
                      key={section.id}
                      data={sectionData}
                      onChange={handleSectionEditorChange(section.id)}
                      readOnly={!isEditing}
                      placeholder="Commencez à écrire..."
                      minHeight={400}
                    />

                  {/* Bouton sauvegarder (visible uniquement en mode édition) */}
                  {isEditing && (
                    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/50 p-3">
                      <span className="text-sm text-muted-foreground">
                        {sectionHasChanges
                          ? "⚠️ Modifications non sauvegardées"
                          : "✓ Tout est sauvegardé"}
                      </span>
                      <Button
                        onClick={() => handleSaveSection(section.id)}
                        disabled={updateMutation.isPending || !sectionHasChanges}
                        size="sm"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {updateMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            );
            })}
          </Tabs>

          {/* Dialog pour ajouter une section */}
          <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter une section</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSection} className="mt-2 space-y-4">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="section-title"
                >
                  Titre de la section
                </label>
                <Input
                  id="section-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex : Principes clés"
                  aria-label="Titre de la section"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Contenu
                </label>
                <EditorJSWrapper
                  key="dialog-editor"
                  data={dialogEditorData}
                  onChange={handleDialogEditorChange}
                  readOnly={false}
                  placeholder="Écrivez le contenu de la section..."
                  minHeight={300}
                />
              </div>
              {errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Ajout..." : "Ajouter la section"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
};

export const KnowledgeCardSections = memo(KnowledgeCardSectionsComponent);
