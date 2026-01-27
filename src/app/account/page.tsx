import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AccountNavigation } from "@/components/account/AccountNavigation";

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
        </div>

        <AccountNavigation session={session} />
      </div>
    </div>
  );
}
