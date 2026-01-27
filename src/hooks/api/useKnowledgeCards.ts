import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type KnowledgeCardSummary = {
  id: string;
  title: string;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
  sectionsCount: number;
  color?: string | null;
};

type KnowledgeCard = {
  id: string;
  title: string;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
};

type CreateKnowledgeCardInput = {
  title: string;
  summary?: string;
  templateId?: string;
  folderId?: string | null;
  color?: string | null;
};

type UpdateKnowledgeCardInput = {
  id: string;
  folderId?: string | null;
  title?: string;
  summary?: string;
  color?: string | null;
};

// Clés de query
export const knowledgeCardsKeys = {
  all: ["knowledgeCards"] as const,
  lists: () => [...knowledgeCardsKeys.all, "list"] as const,
  list: (folderId?: string | null) =>
    [...knowledgeCardsKeys.lists(), folderId] as const,
  details: () => [...knowledgeCardsKeys.all, "detail"] as const,
  detail: (id: string) => [...knowledgeCardsKeys.details(), id] as const,
};

// Hook pour récupérer la liste des knowledge cards
export const useKnowledgeCards = (folderId?: string | null) => {
  return useQuery({
    queryKey: knowledgeCardsKeys.list(folderId),
    queryFn: async (): Promise<KnowledgeCardSummary[]> => {
      const url = folderId
        ? `/api/knowledge-cards?folderId=${folderId}`
        : "/api/knowledge-cards";
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la récupération des fiches");
      }

      return (data.cards || []).map((card: any) => ({
        id: card.id,
        title: card.title,
        summary: card.summary ?? null,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
        sectionsCount: card._count?.sections ?? 0,
        color: card.color ?? null,
      }));
    },
  });
};

// Hook pour récupérer une knowledge card spécifique
export const useKnowledgeCard = (id: string) => {
  return useQuery({
    queryKey: knowledgeCardsKeys.detail(id),
    queryFn: async (): Promise<KnowledgeCard> => {
      const response = await fetch(`/api/knowledge-cards/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la récupération de la fiche");
      }

      return data.card;
    },
  });
};

// Hook pour créer une knowledge card
export const useCreateKnowledgeCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateKnowledgeCardInput) => {
      const response = await fetch("/api/knowledge-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création");
      }

      return data.card;
    },
    onSuccess: () => {
      // Invalider toutes les listes de knowledge cards
      queryClient.invalidateQueries({ queryKey: knowledgeCardsKeys.lists() });
    },
  });
};

// Hook pour mettre à jour une knowledge card
export const useUpdateKnowledgeCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateKnowledgeCardInput) => {
      const response = await fetch(`/api/knowledge-cards/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      return data.card;
    },
    onSuccess: (data) => {
      // Invalider les listes et le détail
      queryClient.invalidateQueries({ queryKey: knowledgeCardsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: knowledgeCardsKeys.detail(data.id) });
    },
  });
};

// Hook pour supprimer une knowledge card
export const useDeleteKnowledgeCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/knowledge-cards/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      return data;
    },
    onSuccess: () => {
      // Invalider toutes les listes de knowledge cards
      queryClient.invalidateQueries({ queryKey: knowledgeCardsKeys.lists() });
    },
  });
};

type ReorderKnowledgeCardsInput = {
  cardIds: string[];
  folderId: string | null;
};

// Hook pour réordonner les fiches
export const useReorderKnowledgeCards = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReorderKnowledgeCardsInput) => {
      const response = await fetch("/api/knowledge-cards/reorder", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du réordonnancement");
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalider la liste des fiches pour le dossier concerné
      queryClient.invalidateQueries({
        queryKey: knowledgeCardsKeys.list(variables.folderId),
      });
    },
  });
};

