import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Folder as FolderIcon, EllipsisVertical } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColorPicker } from "@/components/ui/color-picker";
import { useUpdateFolder } from "@/hooks/api/useFolders";
import { getColorBackgroundClasses, getColorBackgroundStyle, isDarkColor } from "@/lib/color-utils";
import { Folder, ViewMode } from "./types";

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

export const SortableFolder: React.FC<SortableFolderProps> = ({
    folder,
    onClick,
    currentParentId,
    overDropZone,
    activeId,
    viewMode,
    onRename,
    onDelete,
}) => {
    const updateFolderMutation = useUpdateFolder();

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
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const showDropIndicator = isOver && !isDragging;
    // Activer pointer-events seulement pendant un drag (et pas pour ce dossier)
    const isDraggingOther = activeId !== null && activeId !== folder.id;

    const backgroundClasses = getColorBackgroundClasses(folder.color);
    const backgroundStyle = getColorBackgroundStyle(folder.color);
    const isDark = isDarkColor(folder.color);
    const textColorClass = isDark ? "text-white" : "text-foreground";
    const mutedTextColorClass = isDark ? "text-white/70" : "text-muted-foreground";
    const iconColorClass = isDark ? "text-white" : "text-primary";

    const handleColorChange = async (color: string | null) => {
        try {
            await updateFolderMutation.mutateAsync({
                id: folder.id,
                color,
            });
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la couleur:", error);
        }
    };

    // Rendu en mode liste
    if (viewMode === "list") {
        return (
            <div style={style} className="relative h-full">
                {/* Zone draggable pour le réordonnancement */}
                <div ref={setNodeRef} className="relative h-full z-10">
                    <Button
                        asChild
                        variant="outline"
                        className={`h-auto w-full flex-row items-center justify-start gap-3 p-4 text-left cursor-grab active:cursor-grabbing touch-none ${backgroundClasses} ${textColorClass}`}
                        style={backgroundStyle}
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
                            <FolderIcon className={`h-5 w-5 shrink-0 ${iconColorClass}`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="truncate font-medium">{folder.name}</span>
                                </div>
                                {folder.children && folder.children.length > 0 && (
                                    <span className={`text-xs ${mutedTextColorClass}`}>
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
                                            className={`h-8 w-8 ${textColorClass} hover:bg-black/10`}
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
                                        <DropdownMenuSeparator />
                                        <div className="px-2 py-1.5">
                                            <div className="text-sm text-muted-foreground mb-1.5">
                                                Couleur
                                            </div>
                                            <ColorPicker
                                                value={folder.color}
                                                onChange={handleColorChange}
                                            />
                                        </div>
                                        <DropdownMenuSeparator />
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
                    className={`absolute inset-2 z-20 rounded-lg transition-all ${showDropIndicator ? "border-primary border-2 bg-accent/50" : ""
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
                    className={`h-auto w-full flex-col items-start gap-2 p-4 text-left cursor-grab active:cursor-grabbing touch-none ${backgroundClasses} ${textColorClass}`}
                    style={backgroundStyle}
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
                            <FolderIcon className={`h-5 w-5 shrink-0 ${iconColorClass}`} />
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
                                            className={`h-8 w-8 ${textColorClass} hover:bg-black/10`}
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
                                        <DropdownMenuSeparator />
                                        <div className="px-2 py-1.5">
                                            <div className="text-sm text-muted-foreground mb-1.5">
                                                Couleur
                                            </div>
                                            <ColorPicker
                                                value={folder.color}
                                                onChange={handleColorChange}
                                            />
                                        </div>
                                        <DropdownMenuSeparator />
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
                            <span className={`text-xs ${mutedTextColorClass}`}>
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
                className={`absolute inset-2 z-20 rounded-lg transition-all ${showDropIndicator ? "border-primary border-2 bg-accent/50" : ""
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
