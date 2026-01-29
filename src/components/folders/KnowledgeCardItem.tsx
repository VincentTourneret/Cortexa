import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BookOpen, Link as LinkIcon, EllipsisVertical } from "lucide-react";
import Link from "next/link";
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
import { useUpdateKnowledgeCard } from "@/hooks/api/useKnowledgeCards";
import { getColorBackgroundClasses, getColorBackgroundStyle, isDarkColor } from "@/lib/color-utils";
import { KnowledgeCardSummary, ViewMode } from "./types";
import { ShareModal } from "@/components/sharing/ShareModal";

interface KnowledgeCardItemProps {
    card: KnowledgeCardSummary;
    viewMode: ViewMode;
    activeId: string | null;
    isShortcut?: boolean;
    onDelete: (cardId: string) => void;
}

export const KnowledgeCardItem: React.FC<KnowledgeCardItemProps> = ({
    card,
    viewMode,
    activeId,
    isShortcut = false,
    onDelete,
}) => {
    const updateCardMutation = useUpdateKnowledgeCard();
    const [isShareOpen, setIsShareOpen] = React.useState(false);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({
            id: isShortcut ? `shortcut-${card.id}` : `card-${card.id}`,
            disabled: isShortcut, // Désactiver le drag pour les raccourcis
        });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 50 : undefined,
    };
    const isDraggingOther = activeId !== null && activeId !== (isShortcut ? `shortcut-${card.id}` : `card-${card.id}`);

    const backgroundClasses = getColorBackgroundClasses(card.color);
    const backgroundStyle = getColorBackgroundStyle(card.color);
    const isDark = isDarkColor(card.color);
    const textColorClass = isDark ? "text-white" : "text-foreground";
    const mutedTextColorClass = isDark ? "text-white/70" : "text-muted-foreground";
    const iconColorClass = isDark ? "text-white" : "text-primary";

    const handleColorChange = async (color: string | null) => {
        try {
            await updateCardMutation.mutateAsync({
                id: card.id,
                color,
            });
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la couleur:", error);
        }
    };

    const actionMenu = (
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
                        aria-label={`Actions pour ${card.title}`}
                    >
                        <EllipsisVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        onSelect={(event) => {
                            event.preventDefault();
                            setIsShareOpen(true);
                        }}
                    >
                        Partager
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5">
                        <div className="text-sm text-muted-foreground mb-1.5">
                            Couleur
                        </div>
                        <ColorPicker
                            value={card.color}
                            onChange={handleColorChange}
                        />
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onSelect={(event) => {
                            event.preventDefault();
                            onDelete(card.id);
                        }}
                    >
                        Supprimer
                    </DropdownMenuItem>
                </DropdownMenuContent>
                <ShareModal
                    resourceId={card.id}
                    resourceType="CARD"
                    resourceName={card.title}
                    open={isShareOpen}
                    onOpenChange={setIsShareOpen}
                />
            </DropdownMenu>
        </div>
    );

    if (viewMode === "list") {
        return (
            <Button
                ref={setNodeRef}
                style={style}
                asChild
                variant="outline"
                className={`h-auto w-full flex-row items-center justify-start gap-3 p-4 text-left ${isShortcut ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"} touch-none ${backgroundClasses} ${textColorClass}`}
            >
                <div
                    className="flex w-full items-center gap-3"
                    {...(!isShortcut ? { ...listeners, ...attributes } : {})}
                    style={{
                        pointerEvents: isDraggingOther ? "none" : "auto",
                        ...backgroundStyle,
                        cursor: isShortcut ? "pointer" : undefined,
                    }}
                >
                    <Link
                        href={`/knowledge/${card.id}`}
                        className="flex-1 flex items-center gap-3 min-w-0"
                    >
                        {isShortcut ? (
                            <LinkIcon className={`h-5 w-5 shrink-0 ${iconColorClass}`} />
                        ) : (
                            <BookOpen className={`h-5 w-5 shrink-0 ${iconColorClass}`} />
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="truncate font-medium">{card.title}</span>
                                {isShortcut && (
                                    <span className={`text-xs ${mutedTextColorClass}`}>(raccourci)</span>
                                )}
                            </div>
                            {card.summary ? (
                                <span className={`text-xs ${mutedTextColorClass}`}>
                                    {card.summary}
                                </span>
                            ) : null}
                        </div>
                        <div className={`shrink-0 text-xs ${mutedTextColorClass} mr-2`}>
                            {card.sectionsCount} section
                            {card.sectionsCount > 1 ? "s" : ""}
                        </div>
                    </Link>
                    {!isShortcut && actionMenu}
                </div>
            </Button>
        );
    }

    return (
        <Button
            ref={setNodeRef}
            style={style}
            asChild
            variant="outline"
            className={`h-auto w-full flex-col items-start gap-2 p-4 text-left ${isShortcut ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"} touch-none ${backgroundClasses} ${textColorClass}`}
        >
            <div
                className="flex w-full flex-col gap-2"
                {...(!isShortcut ? { ...listeners, ...attributes } : {})}
                style={{
                    pointerEvents: isDraggingOther ? "none" : "auto",
                    ...backgroundStyle,
                    cursor: isShortcut ? "pointer" : undefined,
                }}
            >
                <div className="flex w-full items-center gap-2">
                    <Link
                        href={`/knowledge/${card.id}`}
                        className="flex-1 flex items-center gap-2 min-w-0"
                    >
                        {isShortcut ? (
                            <LinkIcon className={`h-5 w-5 shrink-0 ${iconColorClass}`} />
                        ) : (
                            <BookOpen className={`h-5 w-5 shrink-0 ${iconColorClass}`} />
                        )}
                        <span className="truncate font-medium">{card.title}</span>
                        {isShortcut && (
                            <span className={`text-xs ${mutedTextColorClass}`}>(raccourci)</span>
                        )}
                    </Link>

                    {!isShortcut && actionMenu}

                    {isShortcut && (
                        <span className={`ml-auto text-xs ${mutedTextColorClass}`}>
                            {card.sectionsCount}
                        </span>
                    )}
                </div>
                <Link
                    href={`/knowledge/${card.id}`}
                    className="w-full"
                >
                    {card.summary ? (
                        <p className={`mt-2 text-xs ${mutedTextColorClass}`}>{card.summary}</p>
                    ) : (
                        <p className={`mt-2 text-xs ${mutedTextColorClass}`}>
                            Aucune description.
                        </p>
                    )}
                    {!isShortcut && (
                        <div className={`mt-2 text-xs ${mutedTextColorClass}`}>
                            {card.sectionsCount} section{card.sectionsCount > 1 ? "s" : ""}
                        </div>
                    )}
                </Link>
            </div>
        </Button>
    );
};

