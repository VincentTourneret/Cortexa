import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

const editorJsBlockSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  data: z.record(z.string(), z.unknown()),
});

const editorJsDataSchema = z.object({
  time: z.number().optional(),
  blocks: z.array(editorJsBlockSchema),
  version: z.string().optional(),
});

const createSectionSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis").max(180),
  content: z.string().max(50000),
  contentType: z.enum(["text", "editorjs"]).optional().default("editorjs"),
});

// GET /api/knowledge-cards/[id]/sections - Récupérer toutes les sections
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

    // Vérifier que la carte appartient à l'utilisateur
    const card = await prisma.knowledgeCard.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Fiche non trouvée" }, { status: 404 });
    }

    // Récupérer toutes les sections de cette carte
    const sections = await prisma.knowledgeSection.findMany({
      where: {
        knowledgeCardId: id,
      },
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
        title: true,
        content: true,
        contentType: true,
        order: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ sections }, { status: 200 });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des sections de fiche:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/knowledge-cards/[id]/sections - Créer une section
export async function POST(
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
    const validatedData = createSectionSchema.parse(body);

    const card = await prisma.knowledgeCard.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Fiche non trouvée" }, { status: 404 });
    }

    // Si le contenu est au format Editor.js, valider sa structure
    if (validatedData.contentType === "editorjs") {
      try {
        const parsedContent = JSON.parse(validatedData.content);
        console.log("Contenu Editor.js reçu (création):", JSON.stringify(parsedContent, null, 2));
        editorJsDataSchema.parse(parsedContent);
      } catch (error) {
        console.error("Erreur de validation Editor.js (création):", error);
        console.error("Contenu reçu:", validatedData.content);
        return NextResponse.json(
          { error: "Format Editor.js invalide", details: error instanceof Error ? error.message : "Erreur inconnue" },
          { status: 400 }
        );
      }
    }

    const lastSection = await prisma.knowledgeSection.findFirst({
      where: { knowledgeCardId: id },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const nextOrder = lastSection ? lastSection.order + 1 : 0;

    const section = await prisma.knowledgeSection.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        contentType: validatedData.contentType,
        order: nextOrder,
        knowledgeCardId: id,
      },
      select: {
        id: true,
        title: true,
        content: true,
        contentType: true,
        order: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ section }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error(
      "Erreur lors de la création d'une section de fiche:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
