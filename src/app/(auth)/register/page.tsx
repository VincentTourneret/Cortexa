import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthTemplate } from "@/components/auth/AuthTemplate";

export default function RegisterPage() {
  return (
    <AuthTemplate
      title="Créer un compte"
      subtitle="Inscrivez-vous pour commencer"
    >
      <RegisterForm />

      <p className="text-center text-sm">
        <span className="text-muted-foreground">Déjà un compte ? </span>
        <Link href="/login" className="font-medium text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </AuthTemplate>
  );
}
