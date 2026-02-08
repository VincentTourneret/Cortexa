import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthTemplate } from "@/components/auth/AuthTemplate";
import { Suspense } from "react";

const SuccessMessage = () => (
  <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
    Compte créé avec succès ! Vous pouvez maintenant vous connecter.
  </div>
);

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const params = await searchParams;
  const isRegistered = params?.registered === "true";

  return (
    <AuthTemplate
      title="Connexion"
      subtitle="Connectez-vous à votre compte"
    >
      {isRegistered && <SuccessMessage />}

      <Suspense fallback={<div className="text-muted-foreground">Chargement...</div>}>
        <LoginForm />
      </Suspense>

      <p className="text-center text-sm">
        <span className="text-muted-foreground">Pas encore de compte ? </span>
        <Link href="/register" className="font-medium text-primary hover:underline">
          Créer un compte
        </Link>
      </p>
    </AuthTemplate>
  );
}
