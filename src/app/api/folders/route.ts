import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createFolderSchema = z.object({
  name: z.string().min(1, "Le nom du dossier est requis").max(255),
  parentId: z.string().uuid().optional().nullable(),
});

// GET /api/folders - Récupérer les dossiers d'un utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const parentId = request.nextUrl.searchParams.get("parentId");

    const folders = await prisma.folder.findMany({
      where: {
        userId: session.user.id,
        parentId: parentId || null,
      },
      include: {
        children: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        {
          order: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });

    return NextResponse.json({ folders });
  } catch (error) {
    console.error("Erreur lors de la récupération des dossiers:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST /api/folders - Créer un nouveau dossier
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que l'utilisateur existe dans la base de données
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      console.error("Utilisateur non trouvé:", {
        sessionUserId: session.user.id,
        sessionEmail: session.user.email,
      });
      return NextResponse.json(
        { 
          error: "Votre compte n'existe pas dans la base de données. Veuillez vous déconnecter et vous reconnecter.",
          code: "USER_NOT_FOUND"
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = createFolderSchema.parse(body);

    // Vérifier que le dossier parent appartient à l'utilisateur si parentId est fourni
    if (validatedData.parentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: validatedData.parentId,
          userId: session.user.id,
        },
      });

      if (!parentFolder) {
        return NextResponse.json(
          { error: "Dossier parent non trouvé ou non autorisé" },
          { status: 404 }
        );
      }
    }

    // Trouver le dernier order pour ce parentId
    const lastFolder = await prisma.folder.findFirst({
      where: {
        userId: session.user.id,
        parentId: validatedData.parentId || null,
      },
      orderBy: {
        order: "desc",
      },
    });

    const newOrder = lastFolder ? lastFolder.order + 1 : 0;

    const folder = await prisma.folder.create({
      data: {
        name: validatedData.name,
        userId: user.id,
        parentId: validatedData.parentId || null,
        order: newOrder,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    // Gestion spécifique des erreurs Prisma
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; meta?: unknown };
      if (prismaError.code === "P2003") {
        console.error("Erreur de contrainte de clé étrangère:", prismaError);
        return NextResponse.json(
          { 
            error: "Erreur de référence : l'utilisateur ou le dossier parent n'existe pas",
            details: process.env.NODE_ENV === "development" ? prismaError.meta : undefined
          },
          { status: 400 }
        );
      }
    }

    console.error("Erreur lors de la création du dossier:", error);
    return NextResponse.json(
      { 
        error: "Erreur serveur",
        details: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
