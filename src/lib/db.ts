import { PrismaClient, User } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";

const adapter = new PrismaLibSql({
  url: databaseUrl,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Activer les clés étrangères pour SQLite à chaque connexion
// Note: LibSQL devrait les activer automatiquement, mais on s'assure qu'elles sont activées
if (databaseUrl.startsWith("file:")) {
  // Utiliser $connect pour s'assurer que la connexion est établie
  prisma.$connect().then(() => {
    return prisma.$executeRaw`PRAGMA foreign_keys = ON;`;
  }).catch((error) => {
    console.warn("Impossible d'activer les clés étrangères SQLite:", error);
  });
}

// Export du type User depuis Prisma
export type { User };

// Fonctions de base de données
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur par email:", error);
    return null;
  }
};

export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur par ID:", error);
    return null;
  }
};

export const createUser = async (
  email: string,
  hashedPassword: string,
  verificationToken?: string
): Promise<User> => {
  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        verificationToken,
      },
    });
    return user;
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    throw error;
  }
};

export const updateUserPassword = async (
  id: string,
  hashedPassword: string
): Promise<User | null> => {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });
    return user;
  } catch (error) {
    console.error("Erreur lors de la mise à jour du mot de passe:", error);
    return null;
  }
};

export const updateUserTheme = async (
  id: string,
  theme: "light" | "dark"
): Promise<User | null> => {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        theme,
      },
    });
    return user;
  } catch (error) {
    console.error("Erreur lors de la mise à jour du thème:", error);
    return null;
  }
};


