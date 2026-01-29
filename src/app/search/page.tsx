import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export default async function SearchPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12 pb-24 md:pb-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Recherche</h1>
          <p className="mt-2 text-muted-foreground">
            Recherchez du contenu dans l'application
          </p>
        </div>

        <div className="rounded-lg bg-card p-8 shadow-lg border border-border">
          <p className="text-muted-foreground">
            Fonctionnalité de recherche à venir...
          </p>
        </div>
      </div>
    </div>
  );
}
