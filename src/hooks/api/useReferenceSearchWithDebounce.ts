import { useState, useEffect } from "react";
import { useSearch } from "./useSearch";
import type { SearchResult } from "@/types/reference";

interface UseReferenceSearchResult {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  search: (query: string) => void;
  clearResults: () => void;
}

/**
 * Hook personnalisé pour la recherche de fiches et sections
 * avec debouncing intégré et gestion du cache via React Query
 */
export const useReferenceSearchWithDebounce = (
  debounceMs: number = 300
): UseReferenceSearchResult => {
  const [inputQuery, setInputQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce de la query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputQuery);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [inputQuery, debounceMs]);

  // Utiliser React Query pour la recherche avec la query debouncée
  const { data, isLoading, error } = useSearch(debouncedQuery, !!debouncedQuery.trim());

  const search = (query: string) => {
    setInputQuery(query);
  };

  const clearResults = () => {
    setInputQuery("");
    setDebouncedQuery("");
  };

  return {
    results: data || [],
    loading: isLoading,
    error: error ? error.message : null,
    search,
    clearResults,
  };
};
