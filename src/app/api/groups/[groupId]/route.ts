
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateGroupSchema = z.object({
    name: z.string().min(1, "Le nom du groupe est requis").max(255),
});

// GET /api/groups/[groupId] - Get group details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ groupId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const { groupId } = await params;

        const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        });

        if (!group) {
            return NextResponse.json({ error: "Groupe non trouvé" }, { status: 404 });
        }

        // Check if user is member or owner
        const isMember = group.members.some(m => m.userId === session.user.id);
        const isOwner = group.ownerId === session.user.id;

        if (!isMember && !isOwner) {
            // Technically owner should be a member, but just in case.
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }

        return NextResponse.json({ group });
    } catch (error) {
        console.error("Erreur lors de la récupération du groupe:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}

// PUT /api/groups/[groupId] - Update group
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ groupId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const { groupId } = await params;
        const body = await request.json();
        const validatedData = updateGroupSchema.parse(body);

        const group = await prisma.group.findUnique({
            where: { id: groupId },
        });

        if (!group) {
            return NextResponse.json({ error: "Groupe non trouvé" }, { status: 404 });
        }

        // Only owner or ADMIN members can update? For now, let's say Owner only for Name change.
        if (group.ownerId !== session.user.id) {
            return NextResponse.json({ error: "Seul le propriétaire peut modifier le groupe" }, { status: 403 });
        }

        const updatedGroup = await prisma.group.update({
            where: { id: groupId },
            data: { name: validatedData.name }
        });

        return NextResponse.json({ group: updatedGroup });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Données invalides", details: error.flatten() },
                { status: 400 }
            );
        }
        console.error("Erreur lors de la modification du groupe:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}

// DELETE /api/groups/[groupId] - Delete group
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ groupId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const { groupId } = await params;

        const group = await prisma.group.findUnique({
            where: { id: groupId },
        });

        if (!group) {
            return NextResponse.json({ error: "Groupe non trouvé" }, { status: 404 });
        }

        if (group.ownerId !== session.user.id) {
            return NextResponse.json({ error: "Seul le propriétaire peut supprimer le groupe" }, { status: 403 });
        }

        await prisma.group.delete({
            where: { id: groupId }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Erreur lors de la suppression du groupe:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
