import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/mail";
import { v4 as uuidv4 } from "uuid";

export const POST = async (req: NextRequest) => {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email requis" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Even if user not found, we respond with success to prevent email enumeration
        if (!user) {
            return NextResponse.json(
                { message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé." },
                { status: 200 }
            );
        }

        const resetToken = uuidv4();
        // Sets expiry to 1 hour from now
        const resetTokenExpiry = new Date(Date.now() + 3600000);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });

        await sendPasswordResetEmail(user.email, resetToken);

        return NextResponse.json(
            { message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé." },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error asking for password reset:", error);
        return NextResponse.json(
            { error: "Une erreur est survenue" },
            { status: 500 }
        );
    }
};
