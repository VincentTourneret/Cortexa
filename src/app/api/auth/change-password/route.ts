import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { changePasswordSchema } from "@/lib/validations";
import { getUserById, updateUserPassword } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/auth";

export const POST = async (req: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validationResult = changePasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validationResult.data;

    // Récupérer l'utilisateur
    const user = await getUserById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Vérifier le mot de passe actuel
    const isValidPassword = await verifyPassword(
      currentPassword,
      user.password
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect" },
        { status: 401 }
      );
    }

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await hashPassword(newPassword);

    // Mettre à jour le mot de passe
    await updateUserPassword(session.user.id, hashedNewPassword);

    return NextResponse.json(
      { message: "Mot de passe modifié avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors du changement de mot de passe:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du changement de mot de passe" },
      { status: 500 }
    );
  }
};
