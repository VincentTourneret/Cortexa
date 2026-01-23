import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { Suspense } from "react";

const SuccessMessage = () => {
  return (
    <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
      Compte créé avec succès ! Vous pouvez maintenant vous connecter.
    </div>
  );
};

const LoginFormWrapper = () => {
  return <LoginForm />;
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const params = await searchParams;
  const isRegistered = params?.registered === "true";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-card p-8 shadow-lg border border-border">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-card-foreground">Connexion</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connectez-vous à votre compte
          </p>
        </div>

        {isRegistered && <SuccessMessage />}

        <Suspense fallback={<div className="text-muted-foreground">Chargement...</div>}>
          <LoginFormWrapper />
        </Suspense>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">
            Pas encore de compte ?{" "}
          </span>
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
