import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-card p-8 shadow-lg border border-border">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-card-foreground">Créer un compte</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Inscrivez-vous pour commencer
          </p>
        </div>

        <RegisterForm />

        <div className="text-center text-sm">
          <span className="text-muted-foreground">
            Déjà un compte ?{" "}
          </span>
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
