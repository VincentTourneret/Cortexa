
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { sendGroupInvitationEmail } from "@/lib/mail";
import crypto from "crypto";

const addMembersSchema = z.object({
    members: z.array(z.string().email()).min(1, "Au moins email est requis"),
});

// POST /api/groups/[groupId]/members - Add members
export async function POST(
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
        const validatedData = addMembersSchema.parse(body);

        const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: { members: true } // Need to check if user is admin/owner
        });

        if (!group) {
            return NextResponse.json({ error: "Groupe non trouvé" }, { status: 404 });
        }

        // Check permissions: Owner or existing Member? Just owner for now or logic can be complex.
        // Let's allow owner and any member to invite for simplicity, 
        // or strictly owner? Request says "Partage de documents et Gestion de Groupes".
        // Usually admin/owner.
        const isOwner = group.ownerId === session.user.id;
        // const isAdmin = group.members.some(m => m.userId === session.user.id && m.role === "ADMIN");

        if (!isOwner) {
            // Also allow if user is a member with ADMIN role? Schema has role.
            const memberRecord = group.members.find(m => m.userId === session.user.id);
            if (!memberRecord || memberRecord.role !== "ADMIN") {
                return NextResponse.json({ error: "Non autorisé à inviter des membres" }, { status: 403 });
            }
        }

        const invitationResults = [];

        // Process invitations
        for (const email of validatedData.members) {
            // Check if user exists
            const existingUser = await prisma.user.findUnique({ where: { email } });

            if (existingUser) {
                // Check if already member
                const isMember = await prisma.groupMember.findUnique({
                    where: {
                        groupId_userId: {
                            groupId: group.id,
                            userId: existingUser.id
                        }
                    }
                });

                if (!isMember) {
                    await prisma.groupMember.create({
                        data: {
                            groupId: group.id,
                            userId: existingUser.id,
                            role: "MEMBER"
                        }
                    });
                }
            } else {
                // Create invitation
                const token = crypto.randomBytes(32).toString("hex");
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 7);

                // Check if invite exists?
                // Upsert or create?
                // Just create. If unique constraint on token fails, retry? 
                // Better check email+groupId? Schema has unique token. 
                // Should add unique constraint on invitation email+type+target?
                // For now, create new token.

                await prisma.invitation.create({
                    data: {
                        email,
                        token,
                        type: "GROUP_INVITE",
                        groupId: group.id,
                        senderId: session.user.id,
                        expiresAt,
                    },
                });

                invitationResults.push({ email, token, groupName: group.name });
            }
        }

        // Send emails
        for (const invite of invitationResults) {
            const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/join?token=${invite.token}`;
            await sendGroupInvitationEmail(invite.email, invite.groupName, inviteLink).catch(console.error);
        }

        return NextResponse.json({ success: true, invited: invitationResults.length });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Données invalides", details: error.flatten() },
                { status: 400 }
            );
        }
        console.error("Erreur lors de l'ajout de membres:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}

// DELETE /api/groups/[groupId]/members - Remove member (Leave or Kick)
// Requires ?userId=... query param to kick, or empty to leave?
// Let's implement Kick for now.
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
        const { searchParams } = new URL(request.url);
        const targetUserId = searchParams.get("userId");

        if (!targetUserId) {
            return NextResponse.json({ error: "Utilisateur cible requis" }, { status: 400 });
        }

        const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: { members: true }
        });

        if (!group) {
            return NextResponse.json({ error: "Groupe non trouvé" }, { status: 404 });
        }

        const isOwner = group.ownerId === session.user.id;
        const isSelf = targetUserId === session.user.id;

        // Validation logic:
        // 1. Owner can remove anyone.
        // 2. User can remove themselves (leave).
        // 3. Owner cannot leave if they are the last one? Or ownership transfer needed?
        //    For now, assume Owner cannot delete themselves via this route, must Delete Group.

        if (isOwner && isSelf) {
            return NextResponse.json({ error: "Le propriétaire ne peut pas quitter le groupe. Supprimez le groupe ou transférez la propriété." }, { status: 400 });
        }

        if (!isOwner && !isSelf) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
        }

        await prisma.groupMember.delete({
            where: {
                groupId_userId: {
                    groupId,
                    userId: targetUserId
                }
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Erreur lors de la suppression du membre:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
