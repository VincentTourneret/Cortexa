import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { KnowledgeCardsClient } from "@/components/knowledge/KnowledgeCardsClient";

export default async function KnowledgePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const cards = await prisma.knowledgeCard.findMany({
    where: { userId: session.user.id },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      summary: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { sections: true },
      },
    },
  });

  const initialCards = cards.map((card) => ({
    id: card.id,
    title: card.title,
    summary: card.summary,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
    sectionsCount: card._count.sections,
  }));

  return (
    <div className="min-h-screen bg-background px-4 py-12 pb-32 md:pb-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Fiches de connaissances
          </h1>
          <p className="mt-2 text-muted-foreground">
            Centralisez vos savoirs et structurez-les par sections.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
              Chargement des fiches...
            </div>
          }
        >
          <KnowledgeCardsClient initialCards={initialCards} />
        </Suspense>
      </div>
    </div>
  );
}
