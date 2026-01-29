
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { sendShareInvitationEmail } from "@/lib/mail";
import crypto from "crypto";

const shareResourceSchema = z.object({
    resourceType: z.enum(["FOLDER", "CARD"]),
    resourceId: z.string().uuid(),
    emails: z.array(z.string().email()).optional(),
    groupIds: z.array(z.string().uuid()).optional(),
    permissions: z.enum(["READ", "WRITE"]).default("READ"),
});

// POST /api/shares - Share a resource
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = shareResourceSchema.parse(body);

        const { resourceType, resourceId, emails, groupIds, permissions } = validatedData;

        // 1. Verify ownership
        let resource;
        if (resourceType === "FOLDER") {
            resource = await prisma.folder.findUnique({ where: { id: resourceId } });
        } else {
            resource = await prisma.knowledgeCard.findUnique({ where: { id: resourceId } });
        }

        if (!resource) {
            return NextResponse.json({ error: "Ressource non trouvée" }, { status: 404 });
        }

        if (resource.userId !== session.user.id) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
        }

        const results = {
            sharedUsers: 0,
            sharedGroups: 0,
            invitedUsers: 0
        };

        // 2. Share with Groups
        if (groupIds && groupIds.length > 0) {
            for (const groupId of groupIds) {
                // Check if share already exists
                const existingShare = await prisma.sharedResource.findFirst({
                    where: {
                        group: { id: groupId },
                        folderId: resourceType === "FOLDER" ? resourceId : undefined,
                        cardId: resourceType === "CARD" ? resourceId : undefined,
                    }
                });

                if (!existingShare) {
                    await prisma.sharedResource.create({
                        data: {
                            folderId: resourceType === "FOLDER" ? resourceId : undefined,
                            cardId: resourceType === "CARD" ? resourceId : undefined,
                            sharedWithGroupId: groupId,
                            permissions
                        }
                    });
                    results.sharedGroups++;
                }
            }
        }

        // 3. Share with Emails (Users or Invite)
        if (emails && emails.length > 0) {
            for (const email of emails) {
                const user = await prisma.user.findUnique({ where: { email } });

                if (user) {
                    // Share with existing user
                    const existingShare = await prisma.sharedResource.findFirst({
                        where: {
                            user: { id: user.id },
                            folderId: resourceType === "FOLDER" ? resourceId : undefined,
                            cardId: resourceType === "CARD" ? resourceId : undefined,
                        }
                    });

                    if (!existingShare) {
                        await prisma.sharedResource.create({
                            data: {
                                folderId: resourceType === "FOLDER" ? resourceId : undefined,
                                cardId: resourceType === "CARD" ? resourceId : undefined,
                                sharedWithUserId: user.id,
                                permissions
                            }
                        });
                        results.sharedUsers++;

                        // Notify user via email? Maybe. 
                        const resourceName = resourceType === "FOLDER" ? (resource as any).name : (resource as any).title;
                        const link = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${resourceType === "FOLDER" ? 'folders' : 'cards'}/${resourceId}`;
                        // Wait, routing might be different for shared items.
                        // Let's use generic link for now.
                        await sendShareInvitationEmail(email, resourceName, link, resourceType === "FOLDER").catch(console.error);
                    }
                } else {
                    // Invite new user
                    const resourceName = resourceType === "FOLDER" ? (resource as any).name : (resource as any).title;

                    // Check if invite exists
                    const existingInvite = await prisma.invitation.findFirst({
                        where: {
                            email,
                            type: "RESOURCE_SHARE",
                            resourceType: resourceType,
                            resourceId: resourceId
                        }
                    });

                    if (!existingInvite) {
                        const token = crypto.randomBytes(32).toString("hex");
                        const expiresAt = new Date();
                        expiresAt.setDate(expiresAt.getDate() + 7);

                        await prisma.invitation.create({
                            data: {
                                email,
                                token,
                                type: "RESOURCE_SHARE",
                                resourceType: resourceType,
                                resourceId: resourceId,
                                senderId: session.user.id,
                                permissions,
                                expiresAt
                            }
                        });

                        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/join?token=${token}`;
                        await sendShareInvitationEmail(email, resourceName, inviteLink, resourceType === "FOLDER").catch(console.error);

                        results.invitedUsers++;
                    }
                }
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Données invalides", details: error.flatten() },
                { status: 400 }
            );
        }
        console.error("Erreur lors du partage:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
