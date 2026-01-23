import { useQuery } from "@tanstack/react-query";

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

      const response = await fetch("/api/inline-references", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la récupération des références");
      }

      return data.references || [];
    },
    enabled: ids.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes - Les références changent rarement
  });
};
