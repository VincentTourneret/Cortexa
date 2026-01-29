
"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { MultiEmailSelect } from "@/components/ui/MultiEmailSelect";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ShareModalProps {
    resourceId: string;
    resourceType: "FOLDER" | "CARD";
    resourceName: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

interface GroupOption {
    value: string; // id
    label: string; // name
}

export function ShareModal({ resourceId, resourceType, resourceName, open: controlledOpen, onOpenChange: setControlledOpen }: ShareModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    // Derived state
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? setControlledOpen : setInternalOpen;

    const [emails, setEmails] = useState<string[]>([]);
    const [groups, setGroups] = useState<GroupOption[]>([]);
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
    const [openCombobox, setOpenCombobox] = useState(false);
    const [permission, setPermission] = useState<"READ" | "WRITE">("READ");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Fetch available groups on open? Or once.
    useEffect(() => {
        if (open) {
            fetch("/api/groups")
                .then(res => res.json())
                .then(data => {
                    if (data.groups) {
                        setGroups(data.groups.map((g: any) => ({ value: g.id, label: g.name })));
                    }
                })
                .catch(console.error);
        }
    }, [open]);

    const toggleGroup = (groupId: string) => {
        setSelectedGroupIds(current =>
            current.includes(groupId)
                ? current.filter(id => id !== groupId)
                : [...current, groupId]
        );
    };

    const handleShare = async () => {
        if (emails.length === 0 && selectedGroupIds.length === 0) return;

        setLoading(true);
        try {
            const res = await fetch("/api/shares", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resourceType,
                    resourceId,
                    emails,
                    groupIds: selectedGroupIds,
                    permissions: permission
                })
            });

            if (!res.ok) throw new Error("Erreur");

            if (setOpen) setOpen(false);
            setEmails([]);
            setSelectedGroupIds([]);
            router.refresh();
            // Toast success
        } catch (err) {
            console.error(err);
            // Toast error
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Share2 className="mr-2 h-4 w-4" />
                        Partager
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Partager "{resourceName}"</DialogTitle>
                    <DialogDescription>
                        Invitez des personnes ou des groupes à collaborer.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Personnes (Emails)</Label>
                        <MultiEmailSelect
                            value={emails}
                            onChange={setEmails}
                            placeholder="Ajouter des emails..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Groupes</Label>
                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openCombobox}
                                    className="w-full justify-between"
                                >
                                    {selectedGroupIds.length > 0
                                        ? `${selectedGroupIds.length} groupes sélectionnés`
                                        : "Sélectionner des groupes..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                                <Command>
                                    <CommandInput placeholder="Rechercher un groupe..." />
                                    <CommandEmpty>Aucun groupe trouvé.</CommandEmpty>
                                    <CommandGroup>
                                        {groups.map((group) => (
                                            <CommandItem
                                                key={group.value}
                                                onSelect={() => toggleGroup(group.value)}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedGroupIds.includes(group.value)
                                                            ? "opacity-100"
                                                            : "opacity-0"
                                                    )}
                                                />
                                                {group.label}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {selectedGroupIds.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {selectedGroupIds.map(id => {
                                    const group = groups.find(g => g.value === id);
                                    return group ? (
                                        <div key={id} className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs flex items-center">
                                            {group.label}
                                            <button onClick={() => toggleGroup(id)} className="ml-1 hover:text-destructive"><span className="sr-only">Retirer</span>×</button>
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Permissions</Label>
                        <RadioGroup value={permission} onValueChange={(v: any) => setPermission(v)} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="READ" id="r1" />
                                <Label htmlFor="r1">Lecture seule</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="WRITE" id="r2" />
                                <Label htmlFor="r2">Lecture et Écriture</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleShare} disabled={loading || (emails.length === 0 && selectedGroupIds.length === 0)}>
                        {loading ? "Envoi..." : "Envoyer les invitations"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
