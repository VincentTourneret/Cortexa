import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ThemeSettings } from "@/components/account/ThemeSettings";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12 pb-24 md:pb-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mon compte</h1>
            <p className="mt-2 text-muted-foreground">
              Gérez vos paramètres de compte
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="rounded-lg bg-card p-8 shadow-lg border border-border">
          <h2 className="mb-4 text-xl font-semibold text-card-foreground">
            Préférences d'affichage
          </h2>
          <ThemeSettings />
        </div>

        <div className="rounded-lg bg-card p-8 shadow-lg border border-border">
          <h2 className="mb-4 text-xl font-semibold text-card-foreground">
            Modifier mon mot de passe
          </h2>
          <ChangePasswordForm />
        </div>

        <div className="rounded-lg bg-card p-8 shadow-lg border border-border">
          <h2 className="mb-4 text-xl font-semibold text-card-foreground">Informations de session</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Email:</span> {session.user.email}
            </p>
            <p>
              <span className="font-medium text-foreground">ID:</span> {session.user.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
