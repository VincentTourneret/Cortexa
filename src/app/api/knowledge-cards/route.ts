import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

const createKnowledgeCardSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis").max(180),
  summary: z.string().trim().max(500).optional(),
  folderId: z.string().uuid().optional().nullable(),
  color: z.string().optional().nullable(),
  templateId: z.string().uuid().optional(),
});

// GET /api/knowledge-cards - Récupérer les fiches de connaissances d'un utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const folderId = request.nextUrl.searchParams.get("folderId");

    const cards = await prisma.knowledgeCard.findMany({
      where: {
        userId: session.user.id,
        folderId: folderId || null,
      },
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }, { createdAt: "desc" }],
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
    });

    return NextResponse.json({ cards });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des fiches de connaissances:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/knowledge-cards - Créer une fiche de connaissances
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createKnowledgeCardSchema.parse(body);

    if (validatedData.folderId) {
      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: validatedData.folderId,
          userId: session.user.id,
        },
      });

      if (!parentFolder) {
        return NextResponse.json(
          { error: "Dossier cible non trouvé ou non autorisé" },
          { status: 404 }
        );
      }
    }

    // Vérifier le template si fourni
    let templateItems: Array<{
      title: string;
      content: string;
      contentType: string;
      order: number;
    }> = [];

    if (validatedData.templateId) {
      const template = await prisma.sectionTemplate.findFirst({
        where: {
          id: validatedData.templateId,
          userId: session.user.id,
        },
        include: {
          items: {
            orderBy: {
              order: "asc",
            },
          },
        },
      });

      if (!template) {
        return NextResponse.json(
          { error: "Template non trouvé ou non autorisé" },
          { status: 404 }
        );
      }

      templateItems = template.items.map((item: { title: string; content: string; contentType: string; order: number }) => ({
        title: item.title,
        content: item.content,
        contentType: item.contentType,
        order: item.order,
      }));
    }

    // Trouver l'ordre maximum actuel pour ce dossier/racine
    const maxOrder = await prisma.knowledgeCard.aggregate({
      where: {
        userId: session.user.id,
        folderId: validatedData.folderId ?? null,
      },
      _max: {
        order: true,
      },
    });

    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    const card = await prisma.knowledgeCard.create({
      data: {
        title: validatedData.title,
        summary: validatedData.summary || null,
        folderId: validatedData.folderId ?? null,
        userId: session.user.id,
        order: nextOrder,
        color: validatedData.color || null,
        sections: {
          create: templateItems.map((item) => ({
            title: item.title,
            content: item.content,
            contentType: item.contentType,
            order: item.order,
          })),
        },
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

    return NextResponse.json({ card }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error(
      "Erreur lors de la création de la fiche de connaissances:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
