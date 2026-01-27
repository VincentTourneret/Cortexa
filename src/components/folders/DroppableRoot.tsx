import { useDroppable } from "@dnd-kit/core";
import React from "react";

interface DroppableRootProps {
    children: React.ReactNode;
}

export const DroppableRoot: React.FC<DroppableRootProps> = ({ children }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: "root",
    });

    return (
        <div
            ref={setNodeRef}
            className={`transition-all rounded-lg ${isOver ? "border-primary border-2 bg-accent" : ""
                }`}
        >
            {children}
        </div>
    );
};
