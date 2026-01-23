import { useState, useEffect, useCallback, useRef } from "react";
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
 * avec debouncing et gestion d'état
 */
export function useReferenceSearch(
  debounceMs: number = 300
): UseReferenceSearchResult {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Nettoyer le timeout et l'abort controller au démontage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const performSearch = useCallback(async (query: string) => {
    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Créer un nouveau AbortController pour cette requête
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`,
        {
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors de la recherche");
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      // Ignorer les erreurs d'annulation
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      console.error("Erreur de recherche:", err);
      setError(
        err instanceof Error ? err.message : "Erreur lors de la recherche"
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback(
    (query: string) => {
      // Nettoyer le timeout précédent
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Si la requête est vide, réinitialiser
      if (!query.trim()) {
        setResults([]);
        setError(null);
        setLoading(false);
        return;
      }

      // Debounce: attendre avant de lancer la recherche
      timeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, debounceMs);
    },
    [performSearch, debounceMs]
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setLoading(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  };
}
