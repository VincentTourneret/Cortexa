
"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Users, MoreVertical, Trash, UserPlus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ManageMembersModal } from "./ManageMembersModal";

interface Group {
    id: string;
    name: string;
    ownerId: string;
    createdAt: string;
    _count: {
        members: number;
        sharedResources: number;
    };
    owner: {
        email: string;
        firstName: string | null;
        lastName: string | null;
    }
}

export function GroupList() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [manageMembersOpen, setManageMembersOpen] = useState(false);

    // Should fetch current user ID to know if Owner
    // For simplicity, we assume we get it or deduce it. 
    // Let's just list them.

    const fetchGroups = async () => {
        try {
            const res = await fetch("/api/groups");
            if (res.ok) {
                const data = await res.json();
                setGroups(data.groups);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []); // Should listen to refresh events but simplistic for now

    const handleDeleteGroup = async (groupId: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce groupe ? Cette action est irréversible.")) return;

        try {
            const res = await fetch(`/api/groups/${groupId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setGroups(groups.filter(g => g.id !== groupId));
            } else {
                alert("Erreur lors de la suppression du groupe");
            }
        } catch (error) {
            console.error("Error deleting group:", error);
            alert("Erreur lors de la suppression du groupe");
        }
    };

    if (loading) return <div>Chargement des groupes...</div>;

    if (groups.length === 0) {
        return <div className="text-muted-foreground">Vous n'avez aucun groupe.</div>
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groups.map((group) => (
                    <div
                        key={group.id}
                        className="rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="rounded-full bg-primary/10 p-2">
                                    <Users className="h-4 w-4 text-primary" />
                                </div>
                                <h3 className="font-semibold">{group.name}</h3>
                            </div>
                            {/* Actions Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                        setSelectedGroup(group);
                                        setManageMembersOpen(true);
                                    }}>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Gérer les membres
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => handleDeleteGroup(group.id)}
                                    >
                                        <Trash className="mr-2 h-4 w-4" />
                                        Supprimer
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                            <div className="flex justify-between">
                                <span>Membres</span>
                                <span className="font-medium text-foreground">{group._count.members}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Partages</span>
                                <span className="font-medium text-foreground">{group._count.sharedResources}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Propriétaire</span>
                                <span className="font-medium text-foreground truncate max-w-[150px]">
                                    {group.owner.firstName ? `${group.owner.firstName} ${group.owner.lastName || ''}` : group.owner.email}
                                </span>
                            </div>
                            <div className="pt-2 text-xs">
                                Créé le {format(new Date(group.createdAt), "d MMMM yyyy", { locale: fr })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <ManageMembersModal
                group={selectedGroup}
                open={manageMembersOpen}
                onOpenChange={(open) => {
                    setManageMembersOpen(open);
                    if (!open) fetchGroups(); // Refresh list on close to update counts
                }}
            />
        </>
    );
}
