import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { DashboardContent } from "@/components/folders/DashboardContent";
import { SharedContent } from "@/components/folders/SharedContent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
            Bienvenue, {session.user.firstName}
          </p>
        </div>

        <Tabs defaultValue="mine" className="space-y-6">
          <TabsList>
            <TabsTrigger value="mine">Mes contenus</TabsTrigger>
            <TabsTrigger value="shared">Partagé avec moi</TabsTrigger>
          </TabsList>

          <TabsContent value="mine" className="space-y-6">
            <DashboardContent />
          </TabsContent>

          <TabsContent value="shared" className="space-y-6">
            <div className="rounded-lg bg-card p-6 shadow-lg border border-border">
              <SharedContent />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
