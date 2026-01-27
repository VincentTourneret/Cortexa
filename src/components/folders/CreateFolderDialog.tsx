"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
import { ColorPicker } from "@/components/ui/color-picker";
import { useCreateFolder } from "@/hooks/api/useFolders";

interface CreateFolderDialogProps {
  parentId: string | null;
  onFolderCreated: () => void;
}

export const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({
  parentId,
  onFolderCreated,
}) => {
  const createMutation = useCreateFolder();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Le nom du dossier est requis");
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        parentId: parentId,
        color: color,
      });

      setName("");
      setColor(null);
      setOpen(false);
      setError(null);
      onFolderCreated();
    } catch (error) {
      console.error("Erreur lors de la création du dossier:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erreur lors de la création du dossier"
      );
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full shadow-lg md:bottom-8 md:right-8"
        aria-label="Créer un dossier"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Créer un nouveau dossier</DialogTitle>
            <DialogDescription>
              Entrez le nom du dossier à créer.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label
                  htmlFor="folder-name"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Nom du dossier
                </label>
                <Input
                  id="folder-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mon dossier"
                  disabled={createMutation.isPending}
                  autoFocus
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Couleur du dossier
                </label>
                <div className="flex items-center gap-2">
                  <ColorPicker value={color} onChange={setColor} />
                  <span className="text-sm text-muted-foreground">
                    {color ? "Couleur personnalisée" : "Couleur par défaut"}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setName("");
                  setColor(null);
                  setError(null);
                }}
                disabled={createMutation.isPending}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
                {createMutation.isPending ? "Création..." : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
