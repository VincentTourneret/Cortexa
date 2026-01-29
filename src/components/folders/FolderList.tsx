"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  BookOpen,
  Folder as FolderIcon,
  Grid,
  List,
  Loader2,
  Link as LinkIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import {
  useDeleteFolder,
  useFolder,
  useFolders,
  useReorderFolders,
  useUpdateFolder,
} from "@/hooks/api/useFolders";
import {
  useKnowledgeCards,
  useUpdateKnowledgeCard,
  useDeleteKnowledgeCard,
  useReorderKnowledgeCards,
} from "@/hooks/api/useKnowledgeCards";
import { useShortcuts } from "@/hooks/api/useShortcuts";
import { DroppableEmptyState } from "./DroppableEmptyState";
import { DroppableRoot } from "./DroppableRoot";
import { FolderBreadcrumb } from "./FolderBreadcrumb";
import { KnowledgeCardItem } from "./KnowledgeCardItem";
import { SortableFolder } from "./SortableFolder";
import { Folder, ViewMode } from "./types";

interface FolderListProps {
  onCreateFolder: (parentId: string | null) => void;
  onParentIdChange?: (parentId: string | null) => void;
  refreshKey?: number;
}

export const FolderList: React.FC<FolderListProps> = ({
  onCreateFolder,
  onParentIdChange,
  refreshKey,
}) => {
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);

  // Utiliser React Query pour les dossiers et les knowledge cards
  const {
    data: folders = [],
    isLoading: foldersLoading,
    refetch: refetchFolders,
  } = useFolders(currentParentId);
  const { data: knowledgeCards = [], isLoading: cardsLoading } =
    useKnowledgeCards(currentParentId);
  const { data: currentFolderData } = useFolder(currentParentId || "");
  const { data: shortcuts = [], isLoading: shortcutsLoading } =
    useShortcuts(currentParentId);

  // Mutations
  const updateFolderMutation = useUpdateFolder();
  const deleteFolderMutation = useDeleteFolder();
  const reorderMutation = useReorderFolders();
  const reorderCardsMutation = useReorderKnowledgeCards();
  const updateCardMutation = useUpdateKnowledgeCard();
  const deleteCardMutation = useDeleteKnowledgeCard();

  const loading = foldersLoading || cardsLoading || shortcutsLoading;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const [overDropZone, setOverDropZone] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("folderViewMode") as ViewMode | null;
      return saved || "grid";
    }
    return "grid";
  });
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isCardDeleteOpen, setIsCardDeleteOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Extraire le breadcrumb path et le current folder depuis currentFolderData
  const breadcrumbPath = currentFolderData?.path?.slice(0, -1) || [];
  const currentFolder =
    currentFolderData?.path?.[currentFolderData.path.length - 1] || null;

  const openRenameDialog = (folder: Folder) => {
    setSelectedFolder(folder);
    setRenameValue(folder.name);
    setIsRenameOpen(true);
  };

  const closeRenameDialog = () => {
    setIsRenameOpen(false);
    setSelectedFolder(null);
    setRenameValue("");
  };

  const openDeleteDialog = (folder: Folder) => {
    setSelectedFolder(folder);
    setIsDeleteOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteOpen(false);
    setSelectedFolder(null);
  };

  const openCardDeleteDialog = (cardId: string) => {
    setSelectedCardId(cardId);
    setIsCardDeleteOpen(true);
  };

  const closeCardDeleteDialog = () => {
    setIsCardDeleteOpen(false);
    setSelectedCardId(null);
  };

  const handleConfirmRename = async () => {
    if (!selectedFolder) {
      return;
    }

    const trimmedName = renameValue.trim();
    if (!trimmedName) {
      alert("Le nom du dossier ne peut pas être vide.");
      return;
    }

    if (trimmedName === selectedFolder.name) {
      closeRenameDialog();
      return;
    }

    try {
      await updateFolderMutation.mutateAsync({
        id: selectedFolder.id,
        name: trimmedName,
      });
      closeRenameDialog();
    } catch (error) {
      console.error("Erreur lors du renommage:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Erreur lors du renommage du dossier"
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedFolder) {
      return;
    }

    try {
      await deleteFolderMutation.mutateAsync(selectedFolder.id);
      closeDeleteDialog();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression du dossier"
      );
    }
  };

  const handleConfirmCardDelete = async () => {
    if (!selectedCardId) {
      return;
    }

    try {
      await deleteCardMutation.mutateAsync(selectedCardId);
      closeCardDeleteDialog();
    } catch (error) {
      console.error("Erreur lors de la suppression de la fiche:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression de la fiche"
      );
    }
  };

  const handleNavigate = (folderId: string | null) => {
    setCurrentParentId(folderId);
    onParentIdChange?.(folderId);
  };

  const handleFolderClick = async (folder: Folder) => {
    if (hasDragged) {
      setHasDragged(false);
      return;
    }
    await handleNavigate(folder.id);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    if (
      typeof event.active.id === "string" &&
      event.active.id.startsWith("card-")
    ) {
      setActiveCardId(event.active.id);
    } else {
      setActiveCardId(null);
    }
    setHasDragged(false);
    setOverDropZone(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setActiveCardId(null);
    setOverDropZone(null);

    if (!over) {
      return;
    }

    const draggedFolderId = active.id as string;
    const targetId = over.id as string;

    if (draggedFolderId.startsWith("card-")) {
      const cardId = draggedFolderId.replace("card-", "");

      // Déplacement vers un dossier, la racine ou le breadcrumb
      if (targetId === "root" || targetId.startsWith("drop-") || targetId.startsWith("breadcrumb-")) {
        let nextFolderId: string | null = null;

        if (targetId === "root" || targetId === "breadcrumb-root") {
          nextFolderId = null;
        } else if (targetId.startsWith("drop-")) {
          nextFolderId = targetId.replace("drop-", "");
        } else if (targetId.startsWith("breadcrumb-")) {
          nextFolderId = targetId.replace("breadcrumb-", "");
        }

        try {
          await updateCardMutation.mutateAsync({
            id: cardId,
            folderId: nextFolderId,
          });
        } catch (error) {
          console.error("Erreur lors du déplacement de la fiche:", error);
          alert(
            error instanceof Error
              ? error.message
              : "Erreur lors du déplacement de la fiche"
          );
        }
        return;
      }

      // Réordonnancement entre fiches
      if (targetId.startsWith("card-")) {
        const activeCardId = draggedFolderId.replace("card-", "");
        const targetCardId = targetId.replace("card-", "");

        const activeIndex = knowledgeCards.findIndex((c) => c.id === activeCardId);
        const targetIndex = knowledgeCards.findIndex((c) => c.id === targetCardId);

        if (activeIndex !== -1 && targetIndex !== -1 && activeIndex !== targetIndex) {
          const newCards = arrayMove(knowledgeCards, activeIndex, targetIndex);
          setHasDragged(true);

          try {
            await reorderCardsMutation.mutateAsync({
              cardIds: newCards.map((c) => c.id),
              folderId: currentParentId,
            });
          } catch (error) {
            console.error("Erreur lors du réordonnancement des fiches:", error);
            alert(
              error instanceof Error
                ? error.message
                : "Erreur lors du réordonnancement des fiches"
            );
          } finally {
            setTimeout(() => {
              setHasDragged(false);
            }, 100);
          }
        }
        return;
      }
      return;
    }

    if (draggedFolderId === targetId) {
      return;
    }

    const draggedFolder = folders.find((f) => f.id === draggedFolderId);
    if (!draggedFolder) return;

    // Si on dépose sur "root" ou un élément du breadcrumb, c'est un changement de parent vers un ancêtre
    if (targetId === "root" || targetId.startsWith("breadcrumb-")) {
      const nextParentId = targetId === "root" || targetId === "breadcrumb-root"
        ? null
        : targetId.replace("breadcrumb-", "");

      setHasDragged(true);

      try {
        await updateFolderMutation.mutateAsync({
          id: draggedFolderId,
          parentId: nextParentId,
        });
      } catch (error) {
        console.error("Erreur lors du déplacement du dossier:", error);
        alert(
          error instanceof Error
            ? error.message
            : "Erreur lors du déplacement du dossier"
        );
      } finally {
        setTimeout(() => {
          setHasDragged(false);
        }, 100);
      }
      return;
    }

    // Si le target commence par "drop-", c'est un changement de parent
    if (targetId.startsWith("drop-")) {
      const targetFolderId = targetId.replace("drop-", "");

      // Vérifier que ce n'est pas le même dossier
      if (targetFolderId === draggedFolderId) {
        return;
      }

      setHasDragged(true);

      try {
        await updateFolderMutation.mutateAsync({
          id: draggedFolderId,
          parentId: targetFolderId,
        });
      } catch (error) {
        console.error("Erreur lors du déplacement du dossier:", error);
        alert(
          error instanceof Error
            ? error.message
            : "Erreur lors du déplacement du dossier"
        );
      } finally {
        setTimeout(() => {
          setHasDragged(false);
        }, 100);
      }
      return;
    }

    // Sinon, c'est un réordonnancement (targetId est l'ID d'un dossier dans SortableContext)
    const targetFolder = folders.find((f) => f.id === targetId);

    if (targetFolder && targetFolder.parentId === draggedFolder.parentId) {
      // Réordonnancement au même niveau
      const oldIndex = folders.findIndex((f) => f.id === draggedFolderId);
      const newIndex = folders.findIndex((f) => f.id === targetId);

      if (oldIndex !== newIndex && newIndex !== -1) {
        const newFolders = arrayMove(folders, oldIndex, newIndex);
        setHasDragged(true);

        try {
          await reorderMutation.mutateAsync({
            folderIds: newFolders.map((f) => f.id),
            parentId: currentParentId,
          });
        } catch (error) {
          console.error("Erreur lors du réordonnancement:", error);
          alert(
            error instanceof Error
              ? error.message
              : "Erreur lors du réordonnancement"
          );
          // React Query va automatiquement refetch les données
        } finally {
          setTimeout(() => {
            setHasDragged(false);
          }, 100);
        }
      }
    }
  };

  const handleDragOver = (event: any) => {
    const { over } = event;
    if (over && typeof over.id === "string" && over.id.startsWith("drop-")) {
      setOverDropZone(over.id);
    } else {
      setOverDropZone(null);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setActiveCardId(null);
    setOverDropZone(null);
  };

  useEffect(() => {
    onParentIdChange?.(currentParentId);
  }, [currentParentId, onParentIdChange]);

  // Rafraîchir les données quand refreshKey change
  useEffect(() => {
    if (refreshKey !== undefined) {
      refetchFolders();
    }
  }, [refreshKey, refetchFolders]);

  const activeFolder = activeId
    ? folders.find((folder) => folder.id === activeId)
    : null;
  const activeCard = activeCardId
    ? knowledgeCards.find((card) => `card-${card.id}` === activeCardId)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const folderIds = folders.map((f) => f.id);
  const cardIds = knowledgeCards.map((c) => `card-${c.id}`);
  const combinedIds = [...cardIds, ...folderIds];

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("folderViewMode", mode);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0">
            <DroppableRoot>
              <FolderBreadcrumb
                items={breadcrumbPath}
                currentFolder={currentFolder}
                onNavigate={handleNavigate}
              />
            </DroppableRoot>
          </div>

          {/* Toggle de vue */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1 shrink-0">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("grid")}
              className="h-8 w-8 p-0"
              aria-label="Vue grille"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("list")}
              className="h-8 w-8 p-0"
              aria-label="Vue liste"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {folders.length === 0 &&
          knowledgeCards.length === 0 &&
          shortcuts.length === 0 ? (
          <DroppableEmptyState activeId={activeId} />
        ) : (
          <SortableContext
            items={combinedIds}
            strategy={
              viewMode === "list"
                ? verticalListSortingStrategy
                : rectSortingStrategy
            }
          >
            <div
              className={
                viewMode === "list"
                  ? "flex flex-col gap-2"
                  : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
              }
            >
              {knowledgeCards.map((card) => (
                <KnowledgeCardItem
                  key={card.id}
                  card={card}
                  viewMode={viewMode}
                  activeId={activeId}
                  onDelete={openCardDeleteDialog}
                />
              ))}
              {shortcuts.map((shortcut) => (
                <KnowledgeCardItem
                  key={`shortcut-${shortcut.id}`}
                  card={{
                    id: shortcut.card.id,
                    title: shortcut.card.title,
                    summary: shortcut.card.summary,
                    createdAt: shortcut.card.createdAt,
                    updatedAt: shortcut.card.updatedAt,
                    sectionsCount: shortcut.card._count.sections,
                    color: shortcut.card.color,
                  }}
                  viewMode={viewMode}
                  activeId={activeId}
                  isShortcut={true}
                  onDelete={() => { }} // Les raccourcis ne sont pas gérés ici pour l'instant
                />
              ))}
              {folders.map((folder) => (
                <SortableFolder
                  key={folder.id}
                  folder={folder}
                  currentParentId={currentParentId}
                  overDropZone={overDropZone}
                  activeId={activeId}
                  viewMode={viewMode}
                  onRename={openRenameDialog}
                  onDelete={openDeleteDialog}
                  onClick={() => handleFolderClick(folder)}
                />
              ))}
            </div>
          </SortableContext>
        )}

        <DragOverlay>
          {activeFolder ? (
            <div className="rounded-lg border-2 border-primary bg-card p-4 shadow-xl opacity-90">
              <div className="flex items-center gap-2">
                <FolderIcon className="h-5 w-5 shrink-0 text-primary" />
                <span className="font-medium">{activeFolder.name}</span>
              </div>
            </div>
          ) : null}
          {!activeFolder && activeCard ? (
            <div className="rounded-lg border-2 border-primary bg-card p-4 shadow-xl opacity-90">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 shrink-0 text-primary" />
                <span className="font-medium">{activeCard.title}</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </div>
      <Dialog
        open={isRenameOpen}
        onOpenChange={(open) => {
          if (open) {
            setIsRenameOpen(true);
            return;
          }
          closeRenameDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renommer le dossier</DialogTitle>
            <DialogDescription>
              Saisissez un nouveau nom pour ce dossier.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              placeholder="Nom du dossier"
              aria-label="Nom du dossier"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeRenameDialog}>
              Annuler
            </Button>
            <Button onClick={handleConfirmRename}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          if (open) {
            setIsDeleteOpen(true);
            return;
          }
          closeDeleteDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le dossier</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le dossier sera supprimé
              définitivement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDeleteDialog}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isCardDeleteOpen}
        onOpenChange={(open) => {
          if (open) {
            setIsCardDeleteOpen(true);
            return;
          }
          closeCardDeleteDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la fiche</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. La fiche sera supprimée
              définitivement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={closeCardDeleteDialog}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleConfirmCardDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DndContext>
  );
};
