import { useQuery } from "@tanstack/react-query";
import type { SearchResult } from "@/types/reference";

// Clés de query
export const searchKeys = {
  all: ["search"] as const,
  query: (q: string) => [...searchKeys.all, q] as const,
};

// Hook pour la recherche
export const useSearch = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: searchKeys.query(query),
    queryFn: async (): Promise<SearchResult[]> => {
      if (!query.trim()) {
        return [];
      }

      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la recherche");
      }

      return data.results || [];
    },
    enabled: enabled && !!query.trim(),
    // Configuration spécifique pour la recherche
    staleTime: 2 * 60 * 1000, // 2 minutes - Les résultats de recherche sont valides moins longtemps
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};
