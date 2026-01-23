"use client";

import Link from "next/link";
import React, { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useKnowledgeCards,
  useCreateKnowledgeCard,
} from "@/hooks/api/useKnowledgeCards";

type KnowledgeCardsClientProps = {
  initialCards?: any[];
};

const KnowledgeCardsClientComponent: React.FC<KnowledgeCardsClientProps> = () => {
  const { data: cards = [], isLoading } = useKnowledgeCards();
  const createMutation = useCreateKnowledgeCard();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void> =
    async (event) => {
      event.preventDefault();
      setErrorMessage(null);

      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        setErrorMessage("Le titre est requis.");
        return;
      }

      try {
        await createMutation.mutateAsync({
          title: trimmedTitle,
          summary: summary.trim() || undefined,
        });

        setTitle("");
        setSummary("");
      } catch (error) {
        console.error("Erreur lors de la création de la fiche:", error);
        setErrorMessage(
          error instanceof Error ? error.message : "Erreur serveur. Réessayez."
        );
      }
    };

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-card-foreground">
          Créer une fiche de connaissances
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ajoutez un titre et un résumé optionnel pour structurer vos
          connaissances.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="title">
              Titre
            </label>
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex : Architecture front-end"
              aria-label="Titre de la fiche"
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="summary"
            >
              Résumé (optionnel)
            </label>
            <textarea
              id="summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Quelques lignes pour décrire la fiche..."
              className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Création..." : "Créer la fiche"}
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Mes fiches de connaissances
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sélectionnez une fiche pour gérer ses sections.
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Chargement...
          </div>
        ) : cards.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Aucune fiche pour le moment. Commencez par en créer une.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <Link
                key={card.id}
                href={`/knowledge/${card.id}`}
                className="group rounded-lg border border-border bg-card p-4 shadow-sm transition hover:border-primary/60 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-card-foreground group-hover:text-primary">
                      {card.title}
                    </h3>
                    {card.summary ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {card.summary}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Aucun résumé disponible.
                      </p>
                    )}
                  </div>
                  <div className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
                    {card.sectionsCount} section
                    {card.sectionsCount > 1 ? "s" : ""}
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Mise à jour le{" "}
                  {new Date(card.updatedAt).toLocaleDateString("fr-FR")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export const KnowledgeCardsClient = memo(KnowledgeCardsClientComponent);
