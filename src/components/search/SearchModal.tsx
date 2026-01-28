"use client";

import { useState, useEffect } from "react";
import { Search, FileText, Hash, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SearchResult } from "@/types/reference";
import { useReferenceSearchWithDebounce } from "@/hooks/api/useReferenceSearchWithDebounce";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  open,
  onOpenChange,
}) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { results, loading: isLoading, error, search, clearResults } = useReferenceSearchWithDebounce();

  // Synchroniser la recherche avec la query
  useEffect(() => {
    search(query);
  }, [query, search]);

  // Réinitialiser l'état quand la modal se ferme
  useEffect(() => {
    if (!open) {
      setQuery("");
      clearResults();
    }
  }, [open, clearResults]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "section" && result.sectionId) {
      router.push(
        `/knowledge/${result.cardId}?section=${result.sectionId}`
      );
    } else {
      router.push(`/knowledge/${result.cardId}`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl">Rechercher</DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher une fiche ou une section..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-12 text-base"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-destructive">
              {error}
            </div>
          )}

          {!isLoading && !error && query.trim() && results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun résultat trouvé pour "{query}"
            </div>
          )}

          {!isLoading && !error && results.length > 0 && (
            <div className="space-y-2 mt-4">
              {results.map((result) => (
                <Button
                  key={`${result.type}-${result.id}`}
                  variant="outline"
                  onClick={() => handleResultClick(result)}
                  className="w-full justify-start h-auto p-4 whitespace-normal text-left bg-card hover:bg-accent border-border"
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="mt-0.5 text-muted-foreground">
                      {result.type === "card" ? (
                        <FileText className="h-5 w-5" />
                      ) : (
                        <Hash className="h-5 w-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground">
                        {result.title}
                      </div>

                      {result.type === "section" && result.cardTitle && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Dans : {result.cardTitle}
                        </div>
                      )}

                      {result.type === "card" && result.summary && (
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {result.summary}
                        </div>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {!query.trim() && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Commencez à taper pour rechercher dans vos fiches
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
