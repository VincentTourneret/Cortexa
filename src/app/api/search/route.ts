import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import type { SearchResult } from "@/types/reference";

const searchQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
});

/**
 * GET /api/search?q=...
 * Recherche dans les titres de fiches et sections de connaissances
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    const validatedData = searchQuerySchema.parse({ q: query || undefined });
    const searchTerm = validatedData.q?.toLowerCase();

    // Si aucune recherche, retourner les fiches récentes
    if (!searchTerm) {
      const recentCards = await prisma.knowledgeCard.findMany({
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
          title: true,
          summary: true,
          sections: {
            select: {
              id: true,
              title: true,
            },
            orderBy: {
              order: "asc",
            },
            take: 5,
          },
        },
        take: 15,
        orderBy: {
          updatedAt: "desc",
        },
      });

      // Formater les résultats
      const results: SearchResult[] = recentCards.map((card) => ({
        id: card.id,
        type: "card" as const,
        title: card.title,
        cardId: card.id,
        summary: card.summary || undefined,
        sections: card.sections,
      }));

      return NextResponse.json({ results });
    }

    // Rechercher dans les fiches (SQLite est case-insensitive par défaut pour LIKE)
    const cards = await prisma.knowledgeCard.findMany({
      where: {
        userId: session.user.id,
        title: {
          contains: searchTerm,
        },
      },
      select: {
        id: true,
        title: true,
        summary: true,
        sections: {
          select: {
            id: true,
            title: true,
          },
          where: {
            title: {
              contains: searchTerm,
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
      take: 10,
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Rechercher dans les sections (sections qui ne sont pas déjà incluses)
    const sections = await prisma.knowledgeSection.findMany({
      where: {
        knowledgeCard: {
          userId: session.user.id,
          NOT: {
            id: {
              in: cards.map((c) => c.id),
            },
          },
        },
        title: {
          contains: searchTerm,
        },
      },
      select: {
        id: true,
        title: true,
        knowledgeCardId: true,
        knowledgeCard: {
          select: {
            title: true,
          },
        },
      },
      take: 10,
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Formater les résultats
    const results: SearchResult[] = [
      // Fiches avec leurs sections matchées
      ...cards.map((card) => ({
        id: card.id,
        type: "card" as const,
        title: card.title,
        cardId: card.id,
        summary: card.summary || undefined,
        sections: card.sections,
      })),
      // Sections des autres fiches
      ...sections.map((section) => ({
        id: section.id,
        type: "section" as const,
        title: section.title,
        cardId: section.knowledgeCardId,
        sectionId: section.id,
        cardTitle: section.knowledgeCard.title,
      })),
    ];

    // Trier par pertinence (priorité aux correspondances exactes)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === searchTerm;
      const bExact = b.title.toLowerCase() === searchTerm;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      const aStarts = a.title.toLowerCase().startsWith(searchTerm);
      const bStarts = b.title.toLowerCase().startsWith(searchTerm);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      return 0;
    });

    // Limiter à 15 résultats au total
    const limitedResults = results.slice(0, 15);

    return NextResponse.json({ results: limitedResults });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la recherche:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
