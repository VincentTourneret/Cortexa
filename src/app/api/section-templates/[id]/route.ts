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

const updateSectionTemplateSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(180).optional(),
  items: z
    .array(
      z.object({
        title: z.string().trim().min(1, "Le titre est requis").max(180),
        content: z.string().max(50000),
        contentType: z.enum(["text", "editorjs"]).optional().default("editorjs"),
        order: z.number().int().min(0),
      })
    )
    .optional(),
});

// GET /api/section-templates/[id] - Récupérer un template spécifique
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

    const template = await prisma.sectionTemplate.findFirst({
      where: {
        id,
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
        { error: "Template non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template }, { status: 200 });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du template de sections:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/section-templates/[id] - Mettre à jour un template
export async function PUT(
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
    const validatedData = updateSectionTemplateSchema.parse(body);

    // Vérifier que le template appartient à l'utilisateur
    const existingTemplate = await prisma.sectionTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template non trouvé" },
        { status: 404 }
      );
    }

    // Valider le contenu Editor.js si nécessaire
    if (validatedData.items) {
      for (const item of validatedData.items) {
        if (item.contentType === "editorjs") {
          try {
            const parsedContent = JSON.parse(item.content);
            editorJsDataSchema.parse(parsedContent);
          } catch (error) {
            return NextResponse.json(
              {
                error: "Format Editor.js invalide",
                details:
                  error instanceof Error ? error.message : "Erreur inconnue",
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // Mettre à jour le template
    const updateData: any = {};
    if (validatedData.name) {
      updateData.name = validatedData.name;
    }

    const template = await prisma.sectionTemplate.update({
      where: { id },
      data: {
        ...updateData,
        ...(validatedData.items && {
          items: {
            deleteMany: {},
            create: validatedData.items.map((item) => ({
              title: item.title,
              content: item.content,
              contentType: item.contentType,
              order: item.order,
            })),
          },
        }),
      },
      include: {
        items: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    return NextResponse.json({ template }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error(
      "Erreur lors de la mise à jour du template de sections:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/section-templates/[id] - Supprimer un template
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

    // Vérifier que le template appartient à l'utilisateur
    const template = await prisma.sectionTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template non trouvé" },
        { status: 404 }
      );
    }

    await prisma.sectionTemplate.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Template supprimé avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Erreur lors de la suppression du template de sections:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
