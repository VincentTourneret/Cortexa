import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

/**
 * POST /api/inline-references
 * Crée un lien inline entre une source et une cible
 * OU récupère les informations de plusieurs références par IDs
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Si le body contient un tableau "ids", c'est une requête de récupération d'infos
    if (Array.isArray(body.ids)) {
      const ids = body.ids as string[];
      
      if (ids.length === 0) {
        return NextResponse.json({ references: [] });
      }
      
      // Récupérer les fiches et sections correspondantes
      const [cards, sections] = await Promise.all([
        prisma.knowledgeCard.findMany({
          where: {
            id: { in: ids },
            user: { email: session.user.email },
          },
          select: {
            id: true,
            title: true,
          },
        }),
        prisma.knowledgeSection.findMany({
          where: {
            id: { in: ids },
            knowledgeCard: {
              user: { email: session.user.email },
            },
          },
          select: {
            id: true,
            title: true,
            knowledgeCardId: true,
          },
        }),
      ]);
      
      // Formater les résultats
      const references = [
        ...cards.map(card => ({
          id: card.id,
          type: "card" as const,
          title: card.title,
          cardId: card.id,
        })),
        ...sections.map(section => ({
          id: section.id,
          type: "section" as const,
          title: section.title,
          cardId: section.knowledgeCardId,
          sectionId: section.id,
        })),
      ];
      
      return NextResponse.json({ references });
    }
    
    // Sinon, c'est une création de lien
    const {
      sourceCardId,
      sourceSectionId,
      targetCardId,
      targetSectionId,
      highlightedText,
    } = body;

    // Validation
    if (!sourceCardId || !targetCardId || !highlightedText) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est propriétaire des deux fiches
    const [sourceCard, targetCard] = await Promise.all([
      prisma.knowledgeCard.findFirst({
        where: {
          id: sourceCardId,
          user: { email: session.user.email },
        },
      }),
      prisma.knowledgeCard.findFirst({
        where: {
          id: targetCardId,
          user: { email: session.user.email },
        },
      }),
    ]);

    if (!sourceCard || !targetCard) {
      return NextResponse.json(
        { error: "Fiche non trouvée ou accès refusé" },
        { status: 404 }
      );
    }

    // Créer ou mettre à jour le lien
    const existingReference = await prisma.inlineReference.findFirst({
      where: {
        sourceCardId,
        sourceSectionId: sourceSectionId || null,
        targetCardId,
        targetSectionId: targetSectionId || null,
        highlightedText,
      },
    });

    let reference;
    if (existingReference) {
      // Mettre à jour la date
      reference = await prisma.inlineReference.update({
        where: { id: existingReference.id },
        data: { updatedAt: new Date() },
      });
    } else {
      // Créer un nouveau lien
      reference = await prisma.inlineReference.create({
        data: {
          sourceCardId,
          sourceSectionId: sourceSectionId || null,
          targetCardId,
          targetSectionId: targetSectionId || null,
          highlightedText,
        },
      });
    }

    return NextResponse.json({
      success: true,
      reference,
    });
  } catch (error) {
    console.error("Erreur lors de la création du lien inline:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du lien" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/inline-references?cardId=xxx&sectionId=yyy&direction=from|to
 * Récupère les liens inline d'une fiche ou section
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get("cardId");
    const sectionId = searchParams.get("sectionId");
    const direction = searchParams.get("direction") || "both"; // "from", "to", "both"

    if (!cardId) {
      return NextResponse.json(
        { error: "cardId manquant" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est propriétaire de la fiche
    const card = await prisma.knowledgeCard.findFirst({
      where: {
        id: cardId,
        user: { email: session.user.email },
      },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Fiche non trouvée ou accès refusé" },
        { status: 404 }
      );
    }

    // Construire la requête
    const whereConditions: any = {};

    if (direction === "from" || direction === "both") {
      whereConditions.OR = whereConditions.OR || [];
      whereConditions.OR.push({
        sourceCardId: cardId,
        ...(sectionId ? { sourceSectionId: sectionId } : {}),
      });
    }

    if (direction === "to" || direction === "both") {
      whereConditions.OR = whereConditions.OR || [];
      whereConditions.OR.push({
        targetCardId: cardId,
        ...(sectionId ? { targetSectionId: sectionId } : {}),
      });
    }

    // Récupérer les liens avec les informations des fiches liées
    const references = await prisma.inlineReference.findMany({
      where: whereConditions,
      include: {
        sourceCard: {
          select: {
            id: true,
            title: true,
          },
        },
        sourceSection: {
          select: {
            id: true,
            title: true,
          },
        },
        targetCard: {
          select: {
            id: true,
            title: true,
          },
        },
        targetSection: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      references,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des liens:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des liens" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/inline-references?id=xxx
 * Supprime un lien inline
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id manquant" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est propriétaire de la fiche source
    const reference = await prisma.inlineReference.findFirst({
      where: { id },
      include: {
        sourceCard: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!reference) {
      return NextResponse.json(
        { error: "Lien non trouvé" },
        { status: 404 }
      );
    }

    if (reference.sourceCard.user.email !== session.user.email) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    // Supprimer le lien
    await prisma.inlineReference.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du lien:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du lien" },
      { status: 500 }
    );
  }
}
