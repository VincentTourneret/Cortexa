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

const createSectionTemplateSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(180),
  items: z.array(
    z.object({
      title: z.string().trim().min(1, "Le titre est requis").max(180),
      content: z.string().max(50000),
      contentType: z.enum(["text", "editorjs"]).optional().default("editorjs"),
      order: z.number().int().min(0),
    })
  ),
});

// GET /api/section-templates - Récupérer tous les templates de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const templates = await prisma.sectionTemplate.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ templates }, { status: 200 });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des templates de sections:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/section-templates - Créer un template de sections
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSectionTemplateSchema.parse(body);

    // Valider le contenu Editor.js si nécessaire
    for (const item of validatedData.items) {
      if (item.contentType === "editorjs") {
        try {
          const parsedContent = JSON.parse(item.content);
          editorJsDataSchema.parse(parsedContent);
        } catch (error) {
          return NextResponse.json(
            {
              error: "Format Editor.js invalide",
              details: error instanceof Error ? error.message : "Erreur inconnue",
            },
            { status: 400 }
          );
        }
      }
    }

    const template = await prisma.sectionTemplate.create({
      data: {
        name: validatedData.name,
        userId: session.user.id,
        items: {
          create: validatedData.items.map((item) => ({
            title: item.title,
            content: item.content,
            contentType: item.contentType,
            order: item.order,
          })),
        },
      },
      include: {
        items: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error(
      "Erreur lors de la création du template de sections:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
