"use client";

import React, { useState } from "react";
import { Plus, Trash2, Edit, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useSectionTemplates,
  useCreateSectionTemplate,
  useUpdateSectionTemplate,
  useDeleteSectionTemplate,
} from "@/hooks/api/useSectionTemplates";
import {
  sanitizeEditorJSData,
  type EditorJSData,
} from "@/lib/content-converter";
import dynamic from "next/dynamic";

// Import dynamique d'EditorJS (client-side only)
const EditorJSWrapper = dynamic(
  () =>
    import("@/components/editor/EditorJSWrapper").then(
      (mod) => mod.EditorJSWrapper
    ),
  { ssr: false }
);

type TemplateItem = {
  id?: string;
  title: string;
  content: string;
  contentType: "text" | "editorjs";
  order: number;
};

export const SectionTemplatesManager: React.FC = () => {
  const { data: templates = [], isLoading } = useSectionTemplates();
  const createMutation = useCreateSectionTemplate();
  const updateMutation = useUpdateSectionTemplate();
  const deleteMutation = useDeleteSectionTemplate();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null
  );
  const [templateName, setTemplateName] = useState("");
  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([]);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(
    null
  );
  const [itemTitle, setItemTitle] = useState("");
  const [itemEditorData, setItemEditorData] = useState<EditorJSData>({
    blocks: [],
  });
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTemplateName("");
    setTemplateItems([]);
    setEditingItemIndex(null);
    setItemTitle("");
    setItemEditorData({ blocks: [] });
    setError(null);
  };

  const handleOpenCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const handleOpenEditDialog = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setTemplateName(template.name);
    setTemplateItems(
      template.items.map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        contentType: item.contentType as "text" | "editorjs",
        order: item.order,
      }))
    );
    setEditingTemplateId(templateId);
    setIsCreateDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingTemplateId(null);
    resetForm();
  };

  const handleAddItem = () => {
    let currentItems = templateItems;
    
    // Si une section est en cours d'édition avec du contenu, la sauvegarder d'abord
    if (editingItemIndex !== null && itemTitle.trim()) {
      // Sauvegarder la section en cours avant d'en ajouter une nouvelle
      const sanitizedData = sanitizeEditorJSData(itemEditorData || { blocks: [] });
      const currentItem: TemplateItem = {
        title: itemTitle.trim(),
        content: JSON.stringify(sanitizedData),
        contentType: "editorjs",
        order: editingItemIndex < templateItems.length ? editingItemIndex : templateItems.length,
      };

      if (editingItemIndex < templateItems.length) {
        // Modifier un item existant
        const updatedItems = [...templateItems];
        updatedItems[editingItemIndex] = currentItem;
        currentItems = updatedItems;
      } else {
        // Ajouter un nouvel item
        currentItems = [...templateItems, currentItem];
      }
      
      setTemplateItems(currentItems);
    }
    
    // Ouvrir le formulaire pour une nouvelle section
    setItemTitle("");
    setItemEditorData({ blocks: [] });
    setEditingItemIndex(currentItems.length);
    setError(null);
  };

  const handleSaveItem = () => {
    if (!itemTitle.trim()) {
      setError("Le titre de la section est requis");
      return;
    }

    const sanitizedData = sanitizeEditorJSData(itemEditorData || { blocks: [] });
    const newItem: TemplateItem = {
      title: itemTitle.trim(),
      content: JSON.stringify(sanitizedData),
      contentType: "editorjs",
      order: editingItemIndex ?? templateItems.length,
    };

    if (editingItemIndex !== null && editingItemIndex < templateItems.length) {
      // Modifier un item existant
      const updatedItems = [...templateItems];
      updatedItems[editingItemIndex] = newItem;
      setTemplateItems(updatedItems);
    } else {
      // Ajouter un nouvel item
      setTemplateItems([...templateItems, newItem]);
    }

    setEditingItemIndex(null);
    setItemTitle("");
    setItemEditorData({ blocks: [] });
    setError(null);
  };

  const handleRemoveItem = (index: number) => {
    setTemplateItems(templateItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!templateName.trim()) {
      setError("Le nom du template est requis");
      return;
    }

    if (templateItems.length === 0) {
      setError("Au moins une section est requise");
      return;
    }

    setError(null);

    try {
      if (editingTemplateId) {
        await updateMutation.mutateAsync({
          id: editingTemplateId,
          name: templateName.trim(),
          items: templateItems.map((item, index) => ({
            title: item.title,
            content: item.content,
            contentType: item.contentType,
            order: index,
          })),
        });
      } else {
        await createMutation.mutateAsync({
          name: templateName.trim(),
          items: templateItems.map((item, index) => ({
            title: item.title,
            content: item.content,
            contentType: item.contentType,
            order: index,
          })),
        });
      }

      handleCloseDialog();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du template:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erreur lors de la sauvegarde"
      );
    }
  };

  const handleDelete = async (templateId: string) => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer ce template ? Cette action est irréversible."
      )
    ) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(templateId);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression"
      );
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">
            Templates de sections
          </h3>
          <p className="text-sm text-muted-foreground">
            Créez des templates pour pré-remplir vos fiches avec des sections
            prédéfinies
          </p>
        </div>
        <Button onClick={handleOpenCreateDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            Aucun template créé. Créez votre premier template pour commencer.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div className="flex-1">
                <h4 className="font-medium text-card-foreground">
                  {template.name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {template.items.length} section
                  {template.items.length > 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEditDialog(template.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplateId ? "Modifier le template" : "Nouveau template"}
            </DialogTitle>
            <DialogDescription>
              Définissez les sections qui seront créées automatiquement lors de
              la création d'une fiche avec ce template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label
                htmlFor="template-name"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Nom du template
              </label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ex: Template de cours"
                disabled={
                  createMutation.isPending || updateMutation.isPending
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Sections</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une section
                </Button>
              </div>

              {templateItems.length > 0 && (
                <div className="space-y-2">
                  {templateItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-lg border border-border bg-card p-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-card-foreground">
                          {item.title}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingItemIndex(index);
                          setItemTitle(item.title);
                          try {
                            const parsed = JSON.parse(item.content);
                            setItemEditorData(parsed);
                          } catch {
                            setItemEditorData({ blocks: [] });
                          }
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {editingItemIndex !== null && (
              <div className="space-y-4 rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    {editingItemIndex < templateItems.length
                      ? "Modifier la section"
                      : "Nouvelle section"}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingItemIndex(null);
                      setItemTitle("");
                      setItemEditorData({ blocks: [] });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Input
                    value={itemTitle}
                    onChange={(e) => setItemTitle(e.target.value)}
                    placeholder="Titre de la section"
                  />
                  <EditorJSWrapper
                    data={itemEditorData}
                    onChange={setItemEditorData}
                    readOnly={false}
                    placeholder="Contenu de la section..."
                    minHeight={200}
                  />
                </div>
                <Button onClick={handleSaveItem} size="sm">
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer la section
                </Button>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                !templateName.trim() ||
                templateItems.length === 0
              }
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Enregistrement..."
                : editingTemplateId
                  ? "Modifier"
                  : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
