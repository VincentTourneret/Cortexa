import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateFolderSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  parentId: z.string().uuid().nullable().optional(),
  order: z.number().int().optional(),
  color: z.string().optional().nullable(),
});

// GET /api/folders/[id] - Récupérer un dossier et son chemin complet (pour le breadcrumb)
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

    // Récupérer le dossier et construire le chemin complet
    const folder = await prisma.folder.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "Dossier non trouvé" }, { status: 404 });
    }

    // Construire le chemin complet (breadcrumb)
    const path: Array<{ id: string; name: string }> = [];
    let currentFolder: typeof folder | null = folder;

    while (currentFolder) {
      path.unshift({ id: currentFolder.id, name: currentFolder.name });
      if (currentFolder.parentId) {
        currentFolder = await prisma.folder.findFirst({
          where: {
            id: currentFolder.parentId,
            userId: session.user.id,
          },
        });
      } else {
        currentFolder = null;
      }
    }

    return NextResponse.json({ folder, path });
  } catch (error) {
    console.error("Erreur lors de la récupération du dossier:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PATCH /api/folders/[id] - Mettre à jour un dossier
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
    const validatedData = updateFolderSchema.parse(body);

    // Récupérer le dossier à déplacer
    const folderToMove = await prisma.folder.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!folderToMove) {
      return NextResponse.json({ error: "Dossier non trouvé" }, { status: 404 });
    }

    // Vérifier qu'on ne déplace pas le dossier dans lui-même
    if (validatedData.parentId === id) {
      return NextResponse.json(
        { error: "Impossible de déplacer un dossier dans lui-même" },
        { status: 400 }
      );
    }

    // Vérifier qu'on ne crée pas de boucle (déplacer un dossier dans ses propres enfants)
    if (validatedData.parentId) {
      const checkForLoop = async (folderId: string): Promise<boolean> => {
        const targetFolder = await prisma.folder.findFirst({
          where: {
            id: folderId,
            userId: session.user.id,
          },
        });

        if (!targetFolder) {
          return false;
        }

        // Si le dossier cible est un enfant du dossier à déplacer, c'est une boucle
        if (targetFolder.parentId === id) {
          return true;
        }

        // Vérifier récursivement les parents
        if (targetFolder.parentId) {
          return checkForLoop(targetFolder.parentId);
        }

        return false;
      };

      const wouldCreateLoop = await checkForLoop(validatedData.parentId);
      if (wouldCreateLoop) {
        return NextResponse.json(
          { error: "Impossible de déplacer un dossier dans ses propres sous-dossiers" },
          { status: 400 }
        );
      }

      // Vérifier que le dossier parent appartient à l'utilisateur
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

    // Si le parentId change, mettre à jour l'order
    let newOrder = folderToMove.order;
    if (validatedData.parentId !== undefined && validatedData.parentId !== folderToMove.parentId) {
      // Trouver le dernier order pour le nouveau parentId
      const lastFolder = await prisma.folder.findFirst({
        where: {
          userId: session.user.id,
          parentId: validatedData.parentId || null,
        },
        orderBy: {
          order: "desc",
        },
      });
      newOrder = lastFolder ? lastFolder.order + 1 : 0;
    } else if (validatedData.order !== undefined) {
      newOrder = validatedData.order;
    }

    // Mettre à jour le parentId, l'order, le nom et/ou la couleur
    const updatedFolder = await prisma.folder.update({
      where: { id },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.parentId !== undefined && {
          parentId: validatedData.parentId ?? null,
        }),
        ...(validatedData.color !== undefined && {
          color: validatedData.color ?? null,
        }),
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

    return NextResponse.json({ folder: updatedFolder });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors du déplacement du dossier:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/folders/[id] - Supprimer un dossier
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

    const folder = await prisma.folder.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "Dossier non trouvé" }, { status: 404 });
    }

    await prisma.folder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression du dossier:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
