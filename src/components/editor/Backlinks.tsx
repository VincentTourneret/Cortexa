"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ExternalLink } from "lucide-react";
import api from "@/lib/axios";

type BacklinkType = {
  id: string;
  sourceCardId: string;
  sourceSectionId: string | null;
  targetCardId: string;
  targetSectionId: string | null;
  highlightedText: string;
  createdAt: string;
  sourceCard: {
    id: string;
    title: string;
  };
  sourceSection?: {
    id: string;
    title: string;
  } | null;
  targetCard: {
    id: string;
    title: string;
  };
  targetSection?: {
    id: string;
    title: string;
  } | null;
};

type BacklinksProps = {
  cardId: string;
  sectionId?: string;
  className?: string;
};

export function Backlinks({ cardId, sectionId, className = "" }: BacklinksProps) {
  const [backlinks, setBacklinks] = useState<BacklinkType[]>([]);
  const [outgoingLinks, setOutgoingLinks] = useState<BacklinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        setLoading(true);
        setError(null);

        // Récupérer les liens entrants (backlinks)
        const backlinkRes = await api.get(
          `/api/inline-references?cardId=${cardId}&direction=to${sectionId ? `&sectionId=${sectionId}` : ""
          }`
        );

        setBacklinks(backlinkRes.data.references || []);

        // Récupérer les liens sortants
        const outgoingRes = await api.get(
          `/api/inline-references?cardId=${cardId}&direction=from${sectionId ? `&sectionId=${sectionId}` : ""
          }`
        );

        setOutgoingLinks(outgoingRes.data.references || []);
      } catch (err: any) {
        console.error("Erreur lors du chargement des liens:", err);
        setError(
          err.response?.data?.error || err.message || "Erreur lors du chargement des liens"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, [cardId, sectionId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Liens de connaissance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Liens de connaissance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (backlinks.length === 0 && outgoingLinks.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Liens de connaissance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aucun lien pour le moment. Surlignez du texte et créez des liens vers
            d'autres fiches.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Liens de connaissance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Liens entrants (backlinks) */}
        {backlinks.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">
                Références vers cette fiche
              </h3>
              <Badge variant="secondary" className="ml-auto">
                {backlinks.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {backlinks.map((link) => (
                <Link
                  key={link.id}
                  href={`/knowledge/${link.sourceCardId}${link.sourceSectionId
                      ? `#section-${link.sourceSectionId}`
                      : ""
                    }`}
                  className="block rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent"
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {link.sourceCard.title}
                      </p>
                      {link.sourceSection && (
                        <p className="text-xs text-muted-foreground">
                          {link.sourceSection.title}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                  </div>
                  <blockquote className="mt-2 border-l-2 border-primary pl-2 text-xs italic text-muted-foreground">
                    "{link.highlightedText}"
                  </blockquote>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Séparateur si les deux sections existent */}
        {backlinks.length > 0 && outgoingLinks.length > 0 && (
          <Separator className="my-4" />
        )}

        {/* Liens sortants */}
        {outgoingLinks.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">
                Références depuis cette fiche
              </h3>
              <Badge variant="secondary" className="ml-auto">
                {outgoingLinks.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {outgoingLinks.map((link) => (
                <Link
                  key={link.id}
                  href={`/knowledge/${link.targetCardId}${link.targetSectionId
                      ? `#section-${link.targetSectionId}`
                      : ""
                    }`}
                  className="block rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent"
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {link.targetCard.title}
                      </p>
                      {link.targetSection && (
                        <p className="text-xs text-muted-foreground">
                          {link.targetSection.title}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                  </div>
                  <blockquote className="mt-2 border-l-2 border-primary pl-2 text-xs italic text-muted-foreground">
                    "{link.highlightedText}"
                  </blockquote>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
