import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                // Validation avec Zod
                const validationResult = loginSchema.safeParse({
                    email: credentials.email,
                    password: credentials.password,
                });

                if (!validationResult.success) {
                    return null;
                }

                // Vérification de l'utilisateur
                const user = await getUserByEmail(credentials.email);
                if (!user) {
                    return null;
                }

                // Vérification du mot de passe
                const isValidPassword = await verifyPassword(
                    credentials.password,
                    user.password
                );

                if (!isValidPassword) {
                    return null;
                }

                // Vérification de l'email
                console.log("Checking verification for user:", user.email, "emailVerified:", user.emailVerified);

                // Temporaire : Si emailVerified est null, on loggue pour débugger
                if (!user.emailVerified) {
                    console.log("User not verified, blocking login");
                    throw new Error("Veuillez vérifier votre email avant de vous connecter");
                }

                // Retour des informations utilisateur pour la session
                return {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    theme: user.theme || "light",
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 jours
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // Lors de la connexion initiale
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.firstName = user.firstName;
                token.lastName = user.lastName;
                token.theme = user.theme || "light";
            }

            // Lors d'une mise à jour de session (ex: changement de thème)
            if (trigger === "update" && session?.user) {
                // Récupérer les données à jour depuis la base de données
                const updatedUser = await getUserByEmail(token.email as string);
                if (updatedUser) {
                    token.theme = updatedUser.theme || "light";
                    token.firstName = updatedUser.firstName;
                    token.lastName = updatedUser.lastName;
                }
                // Ou utiliser les données passées dans session.update()
                if (session.user.theme !== undefined) {
                    token.theme = session.user.theme;
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.firstName = token.firstName;
                session.user.lastName = token.lastName;
                session.user.theme = (token.theme as string) || "light";
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
