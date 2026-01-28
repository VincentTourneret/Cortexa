import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

type KnowledgeSection = {
  id: string;
  title: string;
  content: string;
  contentType?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

type CreateSectionInput = {
  cardId: string;
  title: string;
  content: string;
  contentType?: string;
};

type UpdateSectionInput = {
  cardId: string;
  sectionId: string;
  title?: string;
  content?: string;
  contentType?: string;
};

type DeleteSectionInput = {
  cardId: string;
  sectionId: string;
};

// Clés de query
export const sectionsKeys = {
  all: ["sections"] as const,
  lists: () => [...sectionsKeys.all, "list"] as const,
  list: (cardId: string) => [...sectionsKeys.lists(), cardId] as const,
  details: () => [...sectionsKeys.all, "detail"] as const,
  detail: (cardId: string, sectionId: string) =>
    [...sectionsKeys.details(), cardId, sectionId] as const,
};

// Hook pour récupérer les sections d'une knowledge card
export const useSections = (cardId: string) => {
  return useQuery({
    queryKey: sectionsKeys.list(cardId),
    queryFn: async (): Promise<KnowledgeSection[]> => {
      const { data } = await api.get(`/api/knowledge-cards/${cardId}/sections`);

      return data.sections || [];
    },
    enabled: !!cardId,
  });
};

// Hook pour créer une section
export const useCreateSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, ...input }: CreateSectionInput) => {
      const { data } = await api.post(`/api/knowledge-cards/${cardId}/sections`, input);

      return { cardId, section: data.section };
    },
    onSuccess: ({ cardId }) => {
      // Invalider la liste des sections pour cette card
      queryClient.invalidateQueries({ queryKey: sectionsKeys.list(cardId) });
    },
  });
};

// Hook pour mettre à jour une section
export const useUpdateSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cardId,
      sectionId,
      ...input
    }: UpdateSectionInput) => {
      const { data } = await api.put(
        `/api/knowledge-cards/${cardId}/sections/${sectionId}`,
        input
      );

      return { cardId, section: data.section };
    },
    onSuccess: ({ cardId, section }) => {
      // Invalider la liste des sections et le détail de cette section
      queryClient.invalidateQueries({ queryKey: sectionsKeys.list(cardId) });
      queryClient.invalidateQueries({
        queryKey: sectionsKeys.detail(cardId, section.id),
      });
    },
  });
};

// Hook pour supprimer une section
export const useDeleteSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, sectionId }: DeleteSectionInput) => {
      await api.delete(
        `/api/knowledge-cards/${cardId}/sections/${sectionId}`
      );

      return { cardId, sectionId };
    },
    onSuccess: ({ cardId }) => {
      // Invalider la liste des sections pour cette card
      queryClient.invalidateQueries({ queryKey: sectionsKeys.list(cardId) });
    },
  });
};
