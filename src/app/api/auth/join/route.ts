
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";

const joinSchema = z.object({
    token: z.string(),
    firstName: z.string().min(1, "Prénom requis"),
    lastName: z.string().optional(),
    password: z.string().min(8, "Mot de passe trop court (min 8 caractères)"),
});

// POST /api/auth/join - Finish signup from invitation
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = joinSchema.parse(body);
        const { token, firstName, lastName, password } = validatedData;

        // Validate token
        const invitation = await prisma.invitation.findUnique({
            where: { token },
        });

        if (!invitation) {
            return NextResponse.json({ error: "Invitation invalide ou expirée" }, { status: 400 });
        }

        if (invitation.expiresAt < new Date()) {
            return NextResponse.json({ error: "L'invitation a expiré" }, { status: 400 });
        }

        if (invitation.status === "ACCEPTED") {
            return NextResponse.json({ error: "Invitation déjà acceptée" }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email: invitation.email } });
        if (existingUser) {
            return NextResponse.json({ error: "Un compte existe déjà pour cet email. Veuillez vous connecter." }, { status: 409 });
        }

        const hashedPassword = await hashPassword(password);

        // Transaction: Create User, Accept Invites, Join Group or Share
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create User (Verified automatically)
            const user = await tx.user.create({
                data: {
                    email: invitation.email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    emailVerified: new Date(), // Auto verify
                }
            });

            // 2. Update status of THIS invitation
            await tx.invitation.update({
                where: { id: invitation.id },
                data: { status: "ACCEPTED" }
            });

            // 3. Handle specific invitation action
            if (invitation.type === "GROUP_INVITE" && invitation.groupId) {
                await tx.groupMember.create({
                    data: {
                        groupId: invitation.groupId,
                        userId: user.id,
                        role: "MEMBER"
                    }
                })
            } else if (invitation.type === "RESOURCE_SHARE" && invitation.resourceType) {
                // Create SharedResource
                const shareData: any = {
                    sharedWithUserId: user.id,
                    permissions: invitation.permissions || "READ"
                };
                if (invitation.resourceType === "FOLDER") shareData.folderId = invitation.resourceId;
                if (invitation.resourceType === "CARD") shareData.cardId = invitation.resourceId;

                await tx.sharedResource.create({
                    data: shareData
                });
            }

            // 4. Also find ANY OTHER pending invitations for this email and accept/process them?
            // Or leave them for later? 
            // Best UX: Automatically process all pending invites for this email?
            // For now, let's stick to the one the token belongs to. 
            // But the user might have multiple invites. 
            // Let's just create the user. They can click other links later or we can auto-resolve.
            // Let's keep it simple: consume THIS token.

            return user;
        });

        return NextResponse.json({ success: true, email: result.email }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Données invalides", details: (error as z.ZodError).flatten() },
                { status: 400 }
            );
        }
        console.error("Erreur lors de l'inscription via invitation:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
