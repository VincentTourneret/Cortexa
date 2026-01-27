import { useDroppable } from "@dnd-kit/core";
import { Folder as FolderIcon } from "lucide-react";
import React from "react";

interface DroppableEmptyStateProps {
    activeId: string | null;
}

export const DroppableEmptyState: React.FC<DroppableEmptyStateProps> = ({
    activeId,
}) => {
    const { setNodeRef, isOver } = useDroppable({
        id: "root",
    });

    return (
        <div
            ref={setNodeRef}
            className={`rounded-lg border border-dashed p-12 text-center transition-all ${isOver ? "border-primary border-2 bg-accent" : "border-border"
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
