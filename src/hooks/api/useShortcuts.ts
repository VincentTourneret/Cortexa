import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type CardShortcut = {
  id: string;
  folderId: string;
  cardId: string;
  order: number;
  card: {
    id: string;
    title: string;
    summary: string | null;
    color: string | null;
    createdAt: string;
    updatedAt: string;
    _count: {
      sections: number;
    };
  };
};

type CreateShortcutInput = {
  folderId: string;
  cardId: string;
};

// Clés de query
export const shortcutsKeys = {
  all: ["shortcuts"] as const,
  lists: () => [...shortcutsKeys.all, "list"] as const,
  list: (folderId: string | null) =>
    [...shortcutsKeys.lists(), folderId] as const,
};

// Hook pour récupérer les raccourcis d'un dossier
export const useShortcuts = (folderId: string | null) => {
  return useQuery({
    queryKey: shortcutsKeys.list(folderId),
    queryFn: async (): Promise<CardShortcut[]> => {
      if (!folderId) {
        return [];
      }

      const response = await fetch(`/api/shortcuts?folderId=${folderId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la récupération des raccourcis");
      }

      return data.shortcuts || [];
    },
    enabled: !!folderId,
  });
};

// Hook pour créer un raccourci
export const useCreateShortcut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateShortcutInput) => {
      const response = await fetch("/api/shortcuts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création du raccourci");
      }

      return data.shortcut;
    },
    onSuccess: (_, variables) => {
      // Invalider les raccourcis du dossier
      queryClient.invalidateQueries({
        queryKey: shortcutsKeys.list(variables.folderId),
      });
      // Invalider aussi les knowledge cards pour mettre à jour l'affichage
      queryClient.invalidateQueries({
        queryKey: ["knowledgeCards", "list"],
      });
    },
  });
};

// Hook pour supprimer un raccourci
export const useDeleteShortcut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, folderId }: { id: string; folderId: string }) => {
      const response = await fetch(`/api/shortcuts/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la suppression du raccourci");
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalider les raccourcis du dossier
      queryClient.invalidateQueries({
        queryKey: shortcutsKeys.list(variables.folderId),
      });
      // Invalider aussi les knowledge cards pour mettre à jour l'affichage
      queryClient.invalidateQueries({
        queryKey: ["knowledgeCards", "list"],
      });
    },
  });
};
