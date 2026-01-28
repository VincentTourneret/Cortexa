import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const GET = async (req: NextRequest) => {
    const token = req.nextUrl.searchParams.get("token");
    const email = req.nextUrl.searchParams.get("email");

    console.log(`[VerifyEmail] Attempting verification. Token: ${token}, Email: ${email}`);

    if (!token) {
        return NextResponse.json(
            { error: "Token manquant" },
            { status: 400 }
        );
    }

    try {
        let user;

        if (email) {
            console.log(`[VerifyEmail] Looking up user by email: ${email}`);
            user = await prisma.user.findUnique({
                where: { email },
            });
        }

        // Fallback: search by token if user not found by email OR email not provided
        if (!user && token) {
            console.log(`[VerifyEmail] Looking up user by token: ${token}`);
            user = await prisma.user.findFirst({
                where: {
                    verificationToken: token,
                },
            });
        }

        if (user) {
            console.log(`[VerifyEmail] User found: ${user.email}. Verified: ${user.emailVerified}, Token: ${user.verificationToken}`);
        } else {
            console.log(`[VerifyEmail] User NOT found.`);
        }

        if (user) {
            // Check if already verified
            if (user.emailVerified) {
                console.log(`[VerifyEmail] User already verified.`);
                return NextResponse.json(
                    { message: "Email déjà vérifié" },
                    { status: 200 }
                );
            }

            // Validate token
            // Note: If we found user by token, this check is redundant but harmless.
            // If we found user by email, this check is crucial.
            if (user.verificationToken !== token) {
                console.log(`[VerifyEmail] Token mismatch. DB: ${user.verificationToken}, Req: ${token}`);
                return NextResponse.json(
                    { error: "Token invalide" },
                    { status: 400 }
                );
            }
        }

        if (!user) {
            return NextResponse.json(
                { error: "Token invalide ou utilisateur non trouvé" },
                { status: 400 }
            );
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: new Date(),
                verificationToken: null,
            },
        });

        console.log(`[VerifyEmail] Success! Email verified for user ${user.email} at ${updatedUser.emailVerified}`);

        return NextResponse.json(
            { message: "Email vérifié avec succès" },
            { status: 200 }
        );
    } catch (error) {
        console.error("[VerifyEmail] Error:", error);
        return NextResponse.json(
            { error: "Une erreur est survenue lors de la vérification", details: String(error) },
            { status: 500 }
        );
    }
};
