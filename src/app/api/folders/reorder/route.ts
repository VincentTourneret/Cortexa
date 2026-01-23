import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { z } from "zod";

const reorderFoldersSchema = z.object({
  folderIds: z.array(z.string().uuid()).min(1),
  parentId: z.string().uuid().nullable().optional(),
});

// PUT /api/folders/reorder - Réordonner les dossiers
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = reorderFoldersSchema.parse(body);

    // Vérifier que tous les dossiers appartiennent à l'utilisateur et ont le même parentId
    const folders = await prisma.folder.findMany({
      where: {
        id: { in: validatedData.folderIds },
        userId: session.user.id,
        parentId: validatedData.parentId ?? null,
      },
    });

    if (folders.length !== validatedData.folderIds.length) {
      return NextResponse.json(
        { error: "Certains dossiers n'existent pas ou n'appartiennent pas à l'utilisateur" },
        { status: 404 }
      );
    }

    // Mettre à jour l'order de chaque dossier selon l'ordre dans folderIds
    const updatePromises = validatedData.folderIds.map((folderId, index) =>
      prisma.folder.update({
        where: { id: folderId },
        data: { order: index },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erreur lors du réordonnancement des dossiers:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
