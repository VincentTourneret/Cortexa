import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

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
      const { data } = await api.get(url);

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
      const { data } = await api.get(`/api/knowledge-cards/${id}`);

      return data.card;
    },
  });
};

// Hook pour créer une knowledge card
export const useCreateKnowledgeCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateKnowledgeCardInput) => {
      const { data } = await api.post("/api/knowledge-cards", input);

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
      const { data } = await api.patch(`/api/knowledge-cards/${id}`, input);

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
      const { data } = await api.delete(`/api/knowledge-cards/${id}`);

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
      const { data } = await api.put("/api/knowledge-cards/reorder", input);

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
