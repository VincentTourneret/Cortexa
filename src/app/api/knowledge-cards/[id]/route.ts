import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

const updateKnowledgeCardSchema = z.object({
  title: z.string().trim().min(1).max(180).optional(),
  summary: z.string().trim().max(500).nullable().optional(),
  folderId: z.string().uuid().nullable().optional(),
  color: z.string().optional().nullable(),
});

// GET /api/knowledge-cards/[id] - Récupérer une fiche et ses sections
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    const card = await prisma.knowledgeCard.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        sections: {
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            title: true,
            content: true,
            order: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Fiche non trouvée" }, { status: 404 });
    }

    return NextResponse.json({ card });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de la fiche de connaissances:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/knowledge-cards/[id] - Mettre à jour une fiche
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateKnowledgeCardSchema.parse(body);

    const existingCard = await prisma.knowledgeCard.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingCard) {
      return NextResponse.json({ error: "Fiche non trouvée" }, { status: 404 });
    }

    if (validatedData.folderId !== undefined) {
      if (validatedData.folderId) {
        const targetFolder = await prisma.folder.findFirst({
          where: {
            id: validatedData.folderId,
            userId: session.user.id,
          },
        });

        if (!targetFolder) {
          return NextResponse.json(
            { error: "Dossier cible non trouvé ou non autorisé" },
            { status: 404 }
          );
        }
      }
    }

    const card = await prisma.knowledgeCard.update({
      where: { id },
      data: {
        ...(validatedData.title !== undefined && { title: validatedData.title }),
        ...(validatedData.summary !== undefined && {
          summary: validatedData.summary ?? null,
        }),
        ...(validatedData.folderId !== undefined && {
          folderId: validatedData.folderId ?? null,
        }),
        ...(validatedData.color !== undefined && {
          color: validatedData.color ?? null,
        }),
      },
      select: {
        id: true,
        title: true,
        summary: true,
        color: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ card });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error(
      "Erreur lors de la mise à jour de la fiche de connaissances:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/knowledge-cards/[id] - Supprimer une fiche
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    const existingCard = await prisma.knowledgeCard.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingCard) {
      return NextResponse.json({ error: "Fiche non trouvée" }, { status: 404 });
    }

    await prisma.knowledgeCard.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Erreur lors de la suppression de la fiche de connaissances:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
