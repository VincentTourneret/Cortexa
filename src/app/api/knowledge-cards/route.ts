import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

const createKnowledgeCardSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis").max(180),
  summary: z.string().trim().max(500).optional(),
  folderId: z.string().uuid().optional().nullable(),
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
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        summary: true,
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

    const card = await prisma.knowledgeCard.create({
      data: {
        title: validatedData.title,
        summary: validatedData.summary || null,
        folderId: validatedData.folderId ?? null,
        userId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        summary: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ card }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
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
