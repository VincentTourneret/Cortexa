import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { z } from "zod";

const reorderCardsSchema = z.object({
    cardIds: z.array(z.string().uuid()).min(1),
    folderId: z.string().uuid().nullable().optional(),
});

// PUT /api/knowledge-cards/reorder - Réordonner les fiches
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = reorderCardsSchema.parse(body);

        // Vérifier que toutes les fiches appartiennent à l'utilisateur et ont le même folderId
        const cards = await prisma.knowledgeCard.findMany({
            where: {
                id: { in: validatedData.cardIds },
                userId: session.user.id,
                folderId: validatedData.folderId ?? null,
            },
        });

        if (cards.length !== validatedData.cardIds.length) {
            return NextResponse.json(
                { error: "Certaines fiches n'existent pas ou n'appartiennent pas à l'utilisateur" },
                { status: 404 }
            );
        }

        // Mettre à jour l'order de chaque fiche selon l'ordre dans cardIds
        const updatePromises = validatedData.cardIds.map((cardId, index) =>
            prisma.knowledgeCard.update({
                where: { id: cardId },
                data: { order: index },
            })
        );

        await Promise.all(updatePromises);

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Données invalides", details: error.issues },
                { status: 400 }
            );
        }

        console.error("Erreur lors du réordonnancement des fiches:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
