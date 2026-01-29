
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { z } from "zod";

const acceptSchema = z.object({
    token: z.string(),
});

// POST /api/invitations/accept - Accept invitation for logged-in user
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = acceptSchema.parse(body);
        const { token } = validatedData;

        const invitation = await prisma.invitation.findUnique({
            where: { token },
        });

        if (!invitation) {
            return NextResponse.json({ error: "Invitation invalide" }, { status: 404 });
        }

        if (invitation.status !== "PENDING") {
            return NextResponse.json({ error: "Invitation déjà traitée ou expirée" }, { status: 400 });
        }

        // Safety check: Is the logged in user email same as invitation?
        // Usually invitations are sent to specific email.
        if (invitation.email.toLowerCase() !== session.user.email?.toLowerCase()) {
            return NextResponse.json({ error: "Cette invitation ne correspond pas à votre adresse email" }, { status: 403 });
        }

        await prisma.$transaction(async (tx) => {
            // Update invitation
            await tx.invitation.update({
                where: { id: invitation.id },
                data: { status: "ACCEPTED" }
            });

            // Apply effect
            if (invitation.type === "GROUP_INVITE" && invitation.groupId) {
                // Check if already member
                const existing = await tx.groupMember.findFirst({
                    where: { groupId: invitation.groupId, userId: session.user.id }
                });
                if (!existing) {
                    await tx.groupMember.create({
                        data: {
                            groupId: invitation.groupId,
                            userId: session.user.id,
                            role: "MEMBER"
                        }
                    });
                }
            } else if (invitation.type === "RESOURCE_SHARE") {
                const shareData: any = {
                    sharedWithUserId: session.user.id,
                    permissions: invitation.permissions || "READ"
                };
                if (invitation.resourceType === "FOLDER") shareData.folderId = invitation.resourceId;
                if (invitation.resourceType === "CARD") shareData.cardId = invitation.resourceId;

                // Check duplicate
                const existing = await tx.sharedResource.findFirst({
                    where: {
                        sharedWithUserId: session.user.id,
                        folderId: shareData.folderId,
                        cardId: shareData.cardId
                    }
                });
                if (!existing) {
                    await tx.sharedResource.create({ data: shareData });
                }
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Données invalides", details: error.flatten() },
                { status: 400 }
            );
        }
        console.error("Erreur acceptation invitation:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
