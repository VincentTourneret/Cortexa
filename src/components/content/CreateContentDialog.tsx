"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateFolder } from "@/hooks/api/useFolders";
import { useCreateKnowledgeCard } from "@/hooks/api/useKnowledgeCards";
import { useSectionTemplates } from "@/hooks/api/useSectionTemplates";
import { useCreateShortcut, useShortcuts } from "@/hooks/api/useShortcuts";
import { ColorPicker } from "@/components/ui/color-picker";
import { SelectCardDialog } from "@/components/folders/SelectCardDialog";

type CreateContentType = "folder" | "card" | "shortcut";

type CreateContentDialogProps = {
  parentId: string | null;
  onCreated: () => void;
};

export const CreateContentDialog: React.FC<CreateContentDialogProps> = ({
  parentId,
  onCreated,
}) => {
  const createFolderMutation = useCreateFolder();
  const createCardMutation = useCreateKnowledgeCard();
  const createShortcutMutation = useCreateShortcut();
  const { data: templates = [] } = useSectionTemplates();
  const { data: shortcuts = [] } = useShortcuts(parentId);

  const [open, setOpen] = useState(false);
  const [selectCardOpen, setSelectCardOpen] = useState(false);
  const [contentType, setContentType] = useState<CreateContentType>("folder");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const loading = createFolderMutation.isPending || createCardMutation.isPending;

  const resetForm = () => {
    setName("");
    setTitle("");
    setSummary("");
    setColor(null);
    setSelectedTemplateId("");
    setError(null);
    setContentType("folder");
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const handleCardSelect = async (cardId: string) => {
    if (!parentId) {
      setError("Impossible de créer un raccourci sans dossier parent");
      return;
    }

    try {
      await createShortcutMutation.mutateAsync({
        folderId: parentId,
        cardId,
      });
      setSelectCardOpen(false);
      resetForm();
      onCreated();
    } catch (error) {
      console.error("Erreur lors de la création du raccourci:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erreur lors de la création du raccourci"
      );
    }
  };

  const handleShortcutClick = () => {
    if (!parentId) {
      setError("Vous devez être dans un dossier pour créer un raccourci");
      return;
    }
    setOpen(false); // Fermer le dialogue principal
    setSelectCardOpen(true); // Ouvrir le dialogue de sélection
  };

  const handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void> =
    async (event) => {
      event.preventDefault();
      setError(null);

      if (contentType === "folder") {
        const trimmedName = name.trim();
        if (!trimmedName) {
          setError("Le nom du dossier est requis");
          return;
        }

        try {
          await createFolderMutation.mutateAsync({
            name: trimmedName,
            parentId,
          });

          handleClose();
          onCreated();
        } catch (error) {
          console.error("Erreur lors de la création du dossier:", error);
          setError(
            error instanceof Error
              ? error.message
              : "Erreur lors de la création du dossier"
          );
        }
        return;
      }

      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        setError("Le titre de la fiche est requis");
        return;
      }

      try {
        await createCardMutation.mutateAsync({
          title: trimmedTitle,
          summary: summary.trim() || undefined,
          templateId: selectedTemplateId || undefined,
          folderId: parentId,
          color: color,
        });

        handleClose();
        onCreated();
      } catch (error) {
        console.error("Erreur lors de la création de la fiche:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Erreur lors de la création de la fiche"
        );
      }
    };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full shadow-lg md:bottom-8 md:right-8"
        aria-label="Créer un dossier ou une fiche"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Créer un contenu</DialogTitle>
            <DialogDescription>
              Choisissez un type puis complétez les informations.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2">
            <Button
              type="button"
              variant={contentType === "folder" ? "default" : "outline"}
              onClick={() => setContentType("folder")}
              disabled={loading}
              className="flex-1"
            >
              Dossier
            </Button>
            <Button
              type="button"
              variant={contentType === "card" ? "default" : "outline"}
              onClick={() => setContentType("card")}
              disabled={loading}
              className="flex-1"
            >
              Fiche
            </Button>
            <Button
              type="button"
              variant={contentType === "shortcut" ? "default" : "outline"}
              onClick={() => {
                setContentType("shortcut");
                handleShortcutClick();
              }}
              disabled={loading || !parentId}
              className="flex-1"
              title={!parentId ? "Vous devez être dans un dossier pour créer un raccourci" : ""}
            >
              Raccourci
            </Button>
          </div>

          {contentType === "shortcut" && selectCardOpen ? null : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                {contentType === "folder" ? (
                  <div className="space-y-2">
                    <label
                      htmlFor="folder-name"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Nom du dossier
                    </label>
                    <Input
                      id="folder-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Mon dossier"
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="card-title"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Titre de la fiche
                      </label>
                      <Input
                        id="card-title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Architecture front-end"
                        disabled={loading}
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="card-summary"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Résumé (optionnel)
                      </label>
                      <textarea
                        id="card-summary"
                        value={summary}
                        onChange={(event) => setSummary(event.target.value)}
                        placeholder="Quelques lignes pour décrire la fiche."
                        className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">
                        Couleur de la fiche
                      </label>
                      <div className="flex items-center gap-2">
                        <ColorPicker value={color} onChange={setColor} />
                        <span className="text-sm text-muted-foreground">
                          {color ? "Couleur personnalisée" : "Couleur par défaut"}
                        </span>
                      </div>
                    </div>
                    {templates.length > 0 && (
                      <div className="space-y-2">
                        <label
                          htmlFor="card-template"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Template de sections (optionnel)
                        </label>
                        <select
                          id="card-template"
                          value={selectedTemplateId}
                          onChange={(event) => setSelectedTemplateId(event.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={loading}
                        >
                          <option value="">Aucun template</option>
                          {templates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name} ({template.items.length} section{template.items.length > 1 ? "s" : ""})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    (contentType === "folder" ? !name.trim() : !title.trim())
                  }
                >
                  {loading ? "Création..." : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <SelectCardDialog
        open={selectCardOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectCardOpen(false);
            resetForm();
          } else {
            setSelectCardOpen(true);
          }
        }}
        onSelect={handleCardSelect}
        excludeCardIds={shortcuts.map((s) => s.card.id)}
      />
    </>
  );
};
