"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MultiEmailSelect } from "@/components/ui/MultiEmailSelect";
import { Loader2, Trash2, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

const addMembersSchema = z.object({
    members: z.array(z.string().email()).min(1, "Au moins un email est requis"),
});

interface GroupMember {
    id: string; // GroupMember ID
    userId: string;
    role: string;
    user: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
    };
}

interface ManageMembersModalProps {
    group: { id: string; name: string; ownerId: string } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ManageMembersModal({ group, open, onOpenChange }: ManageMembersModalProps) {
    const router = useRouter();
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    // Form for adding members
    const {
        setValue,
        watch,
        handleSubmit,
        reset,
        formState: { isSubmitting },
    } = useForm<z.infer<typeof addMembersSchema>>({
        resolver: zodResolver(addMembersSchema),
        defaultValues: {
            members: [],
        },
    });

    const selectedEmails = watch("members");

    useEffect(() => {
        if (open && group) {
            fetchMembers();
            reset({ members: [] });
        }
    }, [open, group]);

    const fetchMembers = async () => {
        if (!group) return;
        setLoadingMembers(true);
        try {
            const res = await fetch(`/api/groups/${group.id}`);
            if (res.ok) {
                const data = await res.json();
                setMembers(data.group.members);
            }
        } catch (error) {
            console.error("Error fetching members:", error);
        } finally {
            setLoadingMembers(false);
        }
    };

    const onAddMembers = async (data: z.infer<typeof addMembersSchema>) => {
        if (!group) return;
        try {
            const res = await fetch(`/api/groups/${group.id}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error("Erreur lors de l'ajout");

            reset({ members: [] });
            fetchMembers(); // Refresh list
            router.refresh(); // Refresh parent stats if needed
        } catch (error) {
            console.error(error);
            // Toast error
        }
    };

    const removeMember = async (userId: string) => {
        if (!group) return;
        if (!confirm("Voulez-vous vraiment retirer ce membre ?")) return;

        try {
            const res = await fetch(`/api/groups/${group.id}/members?userId=${userId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error || "Erreur lors de la suppression");
                return;
            }

            fetchMembers(); // Refresh list
            router.refresh();
        } catch (error) {
            console.error(error);
        }
    };

    if (!group) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Gérer les membres - {group.name}</DialogTitle>
                    <DialogDescription>
                        Ajoutez ou supprimez des membres de ce groupe.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Add Members Section */}
                    <div className="space-y-3">
                        <Label>Inviter de nouveaux membres</Label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <MultiEmailSelect
                                    value={selectedEmails}
                                    onChange={(vals) => setValue("members", vals)}
                                    placeholder="Emails des utilisateurs..."
                                />
                            </div>
                            <Button
                                onClick={handleSubmit(onAddMembers)}
                                disabled={isSubmitting || selectedEmails.length === 0}
                            >
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ajouter"}
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    {/* Members List */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium">Membres actuels ({members.length})</h4>
                        {(loadingMembers) ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="h-[200px] w-full rounded-md border p-4 overflow-y-auto">
                                <div className="space-y-4">
                                    {members.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                                                    <span className="text-xs font-medium">
                                                        {member.user.firstName?.[0] || member.user.email[0].toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="grid gap-0.5">
                                                    <div className="text-sm font-medium">
                                                        {member.user.firstName ? `${member.user.firstName} ${member.user.lastName || ''}` : member.user.email}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {member.user.email}
                                                    </div>
                                                </div>
                                            </div>

                                            {member.user.id === group.ownerId ? (
                                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Propriétaire</span>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive/90"
                                                    onClick={() => removeMember(member.user.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    {members.length === 0 && !loadingMembers && (
                                        <div className="text-center text-sm text-muted-foreground py-4">
                                            Aucun membre dans ce groupe.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
