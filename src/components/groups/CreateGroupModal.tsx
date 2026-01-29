"use client";

import { useState } from "react";
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
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiEmailSelect } from "@/components/ui/MultiEmailSelect";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

const createGroupSchema = z.object({
    name: z.string().min(1, "Le nom est requis"),
    members: z.array(z.string().email()),
});

export function CreateGroupModal() {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<z.infer<typeof createGroupSchema>>({
        resolver: zodResolver(createGroupSchema),
        defaultValues: {
            members: [],
        },
    });

    const members = watch("members");

    const onSubmit = async (data: z.infer<typeof createGroupSchema>) => {
        try {
            const response = await fetch("/api/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Erreur lors de la création");

            setOpen(false);
            reset();
            router.refresh();
            // Show success toast
        } catch (error) {
            console.error(error);
            // Show error toast
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau Groupe
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Créer un groupe</DialogTitle>
                    <DialogDescription>
                        Créez un groupe pour partager facilement vos dossiers et documents.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom du groupe</Label>
                        <Input id="name" {...register("name")} placeholder="Ex: Marketing" />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>Inviter des membres (Email)</Label>
                        <MultiEmailSelect
                            value={members}
                            onChange={(vals) => setValue("members", vals)}
                            placeholder="Ajouter des emails..."
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Création..." : "Créer le groupe"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
