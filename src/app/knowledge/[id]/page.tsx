import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { KnowledgeCardSections } from "@/components/knowledge/KnowledgeCardSections";

export default async function KnowledgeCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  const card = await prisma.knowledgeCard.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      folder: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!card) {
    notFound();
  }

  const initialCard = {
    id: card.id,
    title: card.title,
    summary: card.summary,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
  };

  const parentFolder = card.folder;

  return (
    <div className="min-h-screen bg-background px-4 py-12 pb-32 md:pb-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {card.title}
            </h1>
          </div>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {parentFolder ? (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/dashboard">{parentFolder.name}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              ) : null}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{card.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <Suspense
          fallback={
            <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
              Chargement de la fiche...
            </div>
          }
        >
          <KnowledgeCardSections card={initialCard} />
        </Suspense>
      </div>
    </div>
  );
}
