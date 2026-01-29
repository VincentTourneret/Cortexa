import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

const createShortcutSchema = z.object({
  folderId: z.string().uuid(),
  cardId: z.string().uuid(),
});

// GET /api/shortcuts - Récupérer les raccourcis d'un dossier
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const folderId = request.nextUrl.searchParams.get("folderId");

    if (!folderId) {
      return NextResponse.json(
        { error: "folderId est requis" },
        { status: 400 }
      );
    }

    // Vérifier que le dossier appartient à l'utilisateur
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId: session.user.id,
      },
    });

    if (!folder) {
      return NextResponse.json(
        { error: "Dossier non trouvé ou non autorisé" },
        { status: 404 }
      );
    }

    const shortcuts = await prisma.cardShortcut.findMany({
      where: {
        folderId,
      },
      include: {
        card: {
          select: {
            id: true,
            title: true,
            summary: true,
            color: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: { sections: true },
            },
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });

    return NextResponse.json({ shortcuts });
  } catch (error) {
    console.error("Erreur lors de la récupération des raccourcis:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/shortcuts - Créer un raccourci
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createShortcutSchema.parse(body);

    // Vérifier que le dossier appartient à l'utilisateur
    const folder = await prisma.folder.findFirst({
      where: {
        id: validatedData.folderId,
        userId: session.user.id,
      },
    });

    if (!folder) {
      return NextResponse.json(
        { error: "Dossier non trouvé ou non autorisé" },
        { status: 404 }
      );
    }

    // Vérifier que la fiche appartient à l'utilisateur
    const card = await prisma.knowledgeCard.findFirst({
      where: {
        id: validatedData.cardId,
        userId: session.user.id,
      },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Fiche non trouvée ou non autorisée" },
        { status: 404 }
      );
    }

    // Vérifier qu'un raccourci n'existe pas déjà
    const existingShortcut = await prisma.cardShortcut.findFirst({
      where: {
        folderId: validatedData.folderId,
        cardId: validatedData.cardId,
      },
    });

    if (existingShortcut) {
      return NextResponse.json(
        { error: "Ce raccourci existe déjà" },
        { status: 409 }
      );
    }

    // Trouver le prochain ordre
    const lastShortcut = await prisma.cardShortcut.findFirst({
      where: {
        folderId: validatedData.folderId,
      },
      orderBy: {
        order: "desc",
      },
    });

    const nextOrder = lastShortcut ? lastShortcut.order + 1 : 0;

    const shortcut = await prisma.cardShortcut.create({
      data: {
        folderId: validatedData.folderId,
        cardId: validatedData.cardId,
        order: nextOrder,
      },
      include: {
        card: {
          select: {
            id: true,
            title: true,
            summary: true,
            color: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: { sections: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ shortcut }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la création du raccourci:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
