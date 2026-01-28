import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations";
import { getUserByEmail, createUser } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/mail";

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName } = validationResult.data;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 409 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(password);

    // Créer un token de vérification
    const verificationToken = crypto.randomUUID();

    // Créer l'utilisateur avec le token
    const user = await createUser(email, hashedPassword, verificationToken, firstName, lastName);

    // Envoyer l'email de vérification
    await sendVerificationEmail(email, verificationToken);

    return NextResponse.json(
      {
        message: "Compte créé avec succès. Veuillez vérifier votre email pour activer votre compte.",
        user: {
          id: user.id,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'inscription" },
      { status: 500 }
    );
  }
};
