import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// DELETE /api/shortcuts/[id] - Supprimer un raccourci
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

    const shortcut = await prisma.cardShortcut.findFirst({
      where: {
        id,
        folder: {
          userId: session.user.id,
        },
      },
    });

    if (!shortcut) {
      return NextResponse.json(
        { error: "Raccourci non trouvé ou non autorisé" },
        { status: 404 }
      );
    }

    await prisma.cardShortcut.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression du raccourci:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
