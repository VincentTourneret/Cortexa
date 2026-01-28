import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

type InlineReference = {
  id: string;
  type: "card" | "section";
  title: string;
  cardId: string;
  sectionId?: string;
};

// Clés de query
export const inlineReferencesKeys = {
  all: ["inlineReferences"] as const,
  lists: () => [...inlineReferencesKeys.all, "list"] as const,
  list: (ids: string[]) => [...inlineReferencesKeys.lists(), ids.sort().join(",")] as const,
};

// Hook pour récupérer les références inline par IDs
export const useInlineReferences = (ids: string[]) => {
  return useQuery({
    queryKey: inlineReferencesKeys.list(ids),
    queryFn: async (): Promise<InlineReference[]> => {
      if (!ids.length) {
        return [];
      }

      const { data } = await api.post("/api/inline-references", { ids });

      return data.references || [];
    },
    enabled: ids.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes - Les références changent rarement
  });
};
