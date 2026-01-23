import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { DashboardContent } from "@/components/folders/DashboardContent";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12 pb-32 md:pb-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
          <p className="mt-2 text-muted-foreground">
            Bienvenue, {session.user.email}
          </p>
        </div>

        <DashboardContent />
      </div>
    </div>
  );
}
