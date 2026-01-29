
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { sendGroupInvitationEmail } from "@/lib/mail";
import crypto from "crypto";

const createGroupSchema = z.object({
    name: z.string().min(1, "Le nom du groupe est requis").max(255),
    members: z.array(z.string().email()).optional(),
});

// GET /api/groups - List user's groups
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const groups = await prisma.group.findMany({
            where: {
                OR: [
                    { ownerId: session.user.id },
                    { members: { some: { userId: session.user.id } } },
                ],
            },
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
                _count: {
                    select: { members: true, sharedResources: true },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({ groups });
    } catch (error) {
        console.error("Erreur lors de la récupération des groupes:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = createGroupSchema.parse(body);

        // Create the group and add the owner as a member (optional, but good for consistent query)
        // Actually our schema has ownerId, so maybe owner isn't in members explicitly? 
        // Let's add owner to members as ADMIN for simplicity in query.
        // Or just rely on ownerId. 
        // Plan: owner is separate.

        // Transaction to create group and handle invites
        const result = await prisma.$transaction(async (tx) => {
            const group = await tx.group.create({
                data: {
                    name: validatedData.name,
                    ownerId: session.user.id,
                    members: {
                        create: {
                            userId: session.user.id,
                            role: "ADMIN"
                        }
                    }
                },
            });

            const invitationResults = [];

            if (validatedData.members && validatedData.members.length > 0) {
                for (const email of validatedData.members) {
                    // Check if user exists
                    const existingUser = await tx.user.findUnique({ where: { email } });

                    if (existingUser) {
                        // Add directly if not already member
                        // Check if already in group (unlikely for new group but safe to check)
                        await tx.groupMember.create({
                            data: {
                                groupId: group.id,
                                userId: existingUser.id,
                                role: "MEMBER"
                            }
                        })
                    } else {
                        // Create invitation
                        const token = crypto.randomBytes(32).toString("hex");
                        const expiresAt = new Date();
                        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

                        const invitation = await tx.invitation.create({
                            data: {
                                email,
                                token,
                                type: "GROUP_INVITE",
                                groupId: group.id,
                                senderId: session.user.id,
                                expiresAt,
                            },
                        });

                        // Send email (async, don't block transaction usually but here we need to ensure it sends? 
                        // Better to send after transaction. But we need the token.)
                        invitationResults.push({ email, token, groupName: group.name });
                    }
                }
            }

            return { group, invitationResults };
        });

        // Send emails
        for (const invite of result.invitationResults) {
            const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/join?token=${invite.token}`;
            await sendGroupInvitationEmail(invite.email, invite.groupName, inviteLink).catch(console.error);
        }

        return NextResponse.json({ group: result.group }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Données invalides", details: error.flatten() },
                { status: 400 }
            );
        }
        console.error("Erreur lors de la création du groupe:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
