"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Folder as FolderIcon,
  Loader2,
  List,
  Grid,
  EllipsisVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FolderBreadcrumb } from "./FolderBreadcrumb";
import {
  useFolders,
  useFolder,
  useUpdateFolder,
  useDeleteFolder,
  useReorderFolders,
} from "@/hooks/api/useFolders";
import {
  useKnowledgeCards,
  useUpdateKnowledgeCard,
} from "@/hooks/api/useKnowledgeCards";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
  useDraggable,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type ViewMode = "list" | "grid";

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
  children?: Folder[];
}

interface FolderListProps {
  onCreateFolder: (parentId: string | null) => void;
  onParentIdChange?: (parentId: string | null) => void;
  refreshKey?: number;
}

interface KnowledgeCardSummary {
  id: string;
  title: string;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
  sectionsCount: number;
}

interface SortableFolderProps {
  folder: Folder;
  onClick: () => void;
  currentParentId: string | null;
}

interface SortableFolderProps {
  folder: Folder;
  onClick: () => void;
  currentParentId: string | null;
  overDropZone: string | null;
  activeId: string | null;
  viewMode: ViewMode;
  onRename: (folder: Folder) => void;
  onDelete: (folder: Folder) => void;
}

const SortableFolder: React.FC<SortableFolderProps> = ({
  folder,
  onClick,
  currentParentId,
  overDropZone,
  activeId,
  viewMode,
  onRename,
  onDelete,
}) => {
  // Zone de drop séparée pour le changement de parent (avec un ID différent)
  const dropId = `drop-${folder.id}`;
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: dropId,
  });

  // Désactiver le sortable si on survole une zone de drop (n'importe laquelle)
  const isOverAnyDropZone = overDropZone !== null;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: folder.id,
    disabled: isOverAnyDropZone, // Désactiver le réordonnancement quand on survole une zone de drop
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const showDropIndicator = isOver && !isDragging;
  // Activer pointer-events seulement pendant un drag (et pas pour ce dossier)
  const isDraggingOther = activeId !== null && activeId !== folder.id;

  // Rendu en mode liste
  if (viewMode === "list") {
    return (
      <div style={style} className="relative h-full">
        {/* Zone draggable pour le réordonnancement */}
        <div ref={setNodeRef} className="relative h-full z-10">
          <Button
            asChild
            variant="outline"
            className="h-auto w-full flex-row items-center justify-start gap-3 p-4 text-left cursor-grab active:cursor-grabbing touch-none"
          >
            <div
              onClick={onClick}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onClick();
                }
              }}
              {...attributes}
              {...listeners}
            >
            <FolderIcon className="h-5 w-5 shrink-0 text-primary" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{folder.name}</span>
              </div>
              {folder.children && folder.children.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {folder.children.length} sous-dossier
                  {folder.children.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div
              className="shrink-0"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={`Actions pour ${folder.name}`}
                  >
                    <EllipsisVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      onRename(folder);
                    }}
                  >
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      onDelete(folder);
                    }}
                  >
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            </div>
          </Button>
        </div>
        {/* Zone de drop pour le changement de parent - active seulement pendant le drag */}
        <div
          ref={setDroppableRef}
          className={`absolute inset-0 z-20 rounded-lg transition-all ${
            showDropIndicator
              ? "border-primary border-2 bg-accent/50"
              : ""
          }`}
          style={{ pointerEvents: isDraggingOther ? "auto" : "none" }}
        >
          {showDropIndicator && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs text-primary font-medium bg-background px-2 py-1 rounded shadow-md">
                Déposer ici pour déplacer dans ce dossier
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Rendu en mode grid (par défaut)
  return (
    <div style={style} className="relative h-full">
      {/* Zone draggable pour le réordonnancement */}
      <div ref={setNodeRef} className="relative h-full z-10">
        <Button
          asChild
          variant="outline"
          className="h-auto w-full flex-col items-start gap-2 p-4 text-left cursor-grab active:cursor-grabbing touch-none"
        >
          <div
            onClick={onClick}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }}
            {...attributes}
            {...listeners}
          >
          <div className="flex w-full items-center gap-2">
            <FolderIcon className="h-5 w-5 shrink-0 text-primary" />
            <span className="truncate font-medium">{folder.name}</span>
            <div
              className="ml-auto shrink-0"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={`Actions pour ${folder.name}`}
                  >
                    <EllipsisVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      onRename(folder);
                    }}
                  >
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      onDelete(folder);
                    }}
                  >
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {folder.children && folder.children.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {folder.children.length} sous-dossier
              {folder.children.length > 1 ? "s" : ""}
            </span>
          )}
          </div>
        </Button>
      </div>
      {/* Zone de drop pour le changement de parent - active seulement pendant le drag */}
      <div
        ref={setDroppableRef}
        className={`absolute inset-0 z-20 rounded-lg transition-all ${
          showDropIndicator
            ? "border-primary border-2 bg-accent/50"
            : ""
        }`}
        style={{ pointerEvents: isDraggingOther ? "auto" : "none" }}
      >
        {showDropIndicator && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs text-primary font-medium bg-background px-2 py-1 rounded shadow-md">
              Déposer ici pour déplacer dans ce dossier
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

interface KnowledgeCardItemProps {
  card: KnowledgeCardSummary;
  viewMode: ViewMode;
  activeId: string | null;
}

const KnowledgeCardItem: React.FC<KnowledgeCardItemProps> = ({
  card,
  viewMode,
  activeId,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `card-${card.id}`,
    });
  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.6 : 1,
  };
  const isDraggingOther = activeId !== null && activeId !== `card-${card.id}`;

  if (viewMode === "list") {
    return (
      <Button
        ref={setNodeRef}
        style={style}
        asChild
        variant="outline"
        className="h-auto w-full flex-row items-center justify-start gap-3 p-4 text-left cursor-grab active:cursor-grabbing touch-none"
      >
        <Link
          href={`/knowledge/${card.id}`}
          className="w-full"
          {...listeners}
          {...attributes}
          style={{ pointerEvents: isDraggingOther ? "none" : "auto" }}
        >
          <BookOpen className="h-5 w-5 shrink-0 text-primary" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{card.title}</span>
            </div>
            {card.summary ? (
              <span className="text-xs text-muted-foreground">
                {card.summary}
              </span>
            ) : null}
          </div>
          <div className="shrink-0 text-xs text-muted-foreground">
            {card.sectionsCount} section
            {card.sectionsCount > 1 ? "s" : ""}
          </div>
        </Link>
      </Button>
    );
  }

  return (
    <Button
      ref={setNodeRef}
      style={style}
      asChild
      variant="outline"
      className="h-auto w-full flex-col items-start gap-2 p-4 text-left cursor-grab active:cursor-grabbing touch-none"
    >
      <Link
        href={`/knowledge/${card.id}`}
        className="w-full"
        {...listeners}
        {...attributes}
        style={{ pointerEvents: isDraggingOther ? "none" : "auto" }}
      >
        <div className="flex w-full items-center gap-2">
          <BookOpen className="h-5 w-5 shrink-0 text-primary" />
          <span className="truncate font-medium">{card.title}</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {card.sectionsCount}
          </span>
        </div>
        {card.summary ? (
          <p className="mt-2 text-xs text-muted-foreground">{card.summary}</p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            Aucune description.
          </p>
        )}
      </Link>
    </Button>
  );
};

interface DroppableRootProps {
  children: React.ReactNode;
}

const DroppableRoot: React.FC<DroppableRootProps> = ({ children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: "root",
  });

  return (
    <div
      ref={setNodeRef}
      className={`transition-all rounded-lg ${
        isOver ? "border-primary border-2 bg-accent" : ""
      }`}
    >
      {children}
    </div>
  );
};

interface DroppableEmptyStateProps {
  activeId: string | null;
}

const DroppableEmptyState: React.FC<DroppableEmptyStateProps> = ({
  activeId,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: "root",
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border border-dashed p-12 text-center transition-all ${
        isOver ? "border-primary border-2 bg-accent" : "border-border"
      }`}
    >
      <FolderIcon className="mx-auto h-12 w-12 text-muted-foreground" />
      <p className="mt-4 text-sm text-muted-foreground">
        {isOver && activeId
          ? "Déposer ici pour déplacer à la racine"
          : "Aucun dossier dans ce répertoire"}
      </p>
    </div>
  );
};

export const FolderList: React.FC<FolderListProps> = ({
  onCreateFolder,
  onParentIdChange,
  refreshKey,
}) => {
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);

  // Utiliser React Query pour les dossiers et les knowledge cards
  const { data: folders = [], isLoading: foldersLoading, refetch: refetchFolders } = useFolders(currentParentId);
  const { data: knowledgeCards = [], isLoading: cardsLoading } = useKnowledgeCards(currentParentId);
  const { data: currentFolderData } = useFolder(currentParentId || "");
  
  // Mutations
  const updateFolderMutation = useUpdateFolder();
  const deleteFolderMutation = useDeleteFolder();
  const reorderMutation = useReorderFolders();
  const updateCardMutation = useUpdateKnowledgeCard();

  const loading = foldersLoading || cardsLoading;
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
  const currentFolder = currentFolderData?.path?.[currentFolderData.path.length - 1] || null;

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
    if (typeof event.active.id === "string" && event.active.id.startsWith("card-")) {
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
      const targetIsRoot = targetId === "root";
      const targetIsFolder = targetId.startsWith("drop-");

      if (!targetIsRoot && !targetIsFolder) {
        return;
      }

      const nextFolderId = targetIsRoot
        ? null
        : targetId.replace("drop-", "");

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

    if (draggedFolderId === targetId) {
      return;
    }

    const draggedFolder = folders.find((f) => f.id === draggedFolderId);
    if (!draggedFolder) return;

    // Si on dépose sur "root", c'est un changement de parent vers la racine
    if (targetId === "root") {
      setHasDragged(true);

      try {
        await updateFolderMutation.mutateAsync({
          id: draggedFolderId,
          parentId: null,
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

        {folders.length === 0 && knowledgeCards.length === 0 ? (
          <DroppableEmptyState activeId={activeId} />
        ) : (
          <SortableContext
            items={folderIds}
            strategy={
              viewMode === "list"
                ? verticalListSortingStrategy
                : verticalListSortingStrategy
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
    </DndContext>
  );
};
