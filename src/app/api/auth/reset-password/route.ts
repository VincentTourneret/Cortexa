import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export const POST = async (req: NextRequest) => {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json(
                { error: "Token et mot de passe requis" },
                { status: 400 }
            );
        }

        // Find user with this token and check if it's expired
        // Note: prisma `findFirst` can filter by token. We check expiry manually or in query.
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date(), // Expiry must be greater than now
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Le lien de réinitialisation est invalide ou a expiré." },
                { status: 400 }
            );
        }

        const hashedPassword = await hashPassword(password);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        return NextResponse.json(
            { message: "Mot de passe réinitialisé avec succès." },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error resetting password:", error);
        return NextResponse.json(
            { error: "Une erreur est survenue lors de la réinitialisation du mot de passe." },
            { status: 500 }
        );
    }
};
