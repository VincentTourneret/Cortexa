import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { updateUserTheme } from "@/lib/db";
import { z } from "zod";

const updateThemeSchema = z.object({
  theme: z.enum(["light", "dark"]),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = updateThemeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Thème invalide" },
        { status: 400 }
      );
    }

    const { theme } = validationResult.data;
    const updatedUser = await updateUserTheme(session.user.id, theme);

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du thème" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, theme: updatedUser.theme });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du thème:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
