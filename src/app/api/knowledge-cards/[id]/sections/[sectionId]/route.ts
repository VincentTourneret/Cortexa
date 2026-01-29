import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
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

const updateSectionSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis").max(180).optional(),
  content: z.string().max(50000).optional(),
  contentType: z.enum(["text", "editorjs"]).optional(),
});

// PUT /api/knowledge-cards/[id]/sections/[sectionId] - Mettre à jour une section
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id, sectionId } = await params;
    const body = await request.json();
    const validatedData = updateSectionSchema.parse(body);

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

    // Vérifier que la section appartient à la carte
    const existingSection = await prisma.knowledgeSection.findFirst({
      where: {
        id: sectionId,
        knowledgeCardId: id,
      },
      select: {
        id: true,
      },
    });

    if (!existingSection) {
      return NextResponse.json({ error: "Section non trouvée" }, { status: 404 });
    }

    // Si le contenu est au format Editor.js, valider sa structure
    if (validatedData.contentType === "editorjs" && validatedData.content) {
      try {
        const parsedContent = JSON.parse(validatedData.content);
        console.log("Contenu Editor.js reçu:", JSON.stringify(parsedContent, null, 2));
        editorJsDataSchema.parse(parsedContent);
      } catch (error) {
        console.error("Erreur de validation Editor.js:", error);
        console.error("Contenu reçu:", validatedData.content);
        return NextResponse.json(
          { error: "Format Editor.js invalide", details: error instanceof Error ? error.message : "Erreur inconnue" },
          { status: 400 }
        );
      }
    }

    // Mettre à jour la section
    const section = await prisma.knowledgeSection.update({
      where: {
        id: sectionId,
      },
      data: {
        ...(validatedData.title !== undefined && { title: validatedData.title }),
        ...(validatedData.content !== undefined && { content: validatedData.content }),
        ...(validatedData.contentType !== undefined && { contentType: validatedData.contentType }),
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

    return NextResponse.json({ section }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.flatten() },
        { status: 400 }
      );
    }

    console.error(
      "Erreur lors de la mise à jour d'une section de fiche:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/knowledge-cards/[id]/sections/[sectionId] - Supprimer une section
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id, sectionId } = await params;

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

    // Vérifier que la section appartient à la carte
    const existingSection = await prisma.knowledgeSection.findFirst({
      where: {
        id: sectionId,
        knowledgeCardId: id,
      },
      select: {
        id: true,
      },
    });

    if (!existingSection) {
      return NextResponse.json({ error: "Section non trouvée" }, { status: 404 });
    }

    // Supprimer la section
    await prisma.knowledgeSection.delete({
      where: {
        id: sectionId,
      },
    });

    return NextResponse.json(
      { message: "Section supprimée avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Erreur lors de la suppression d'une section de fiche:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
