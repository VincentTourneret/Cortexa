
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { FolderIcon, FileText, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export async function SharedContent() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return null; // Or handle empty state appropriately
    }

    // Fetch shared resources directly for user or via groups
    const sharedResources = await prisma.sharedResource.findMany({
        where: {
            OR: [
                { sharedWithUserId: session.user.id },
                { group: { members: { some: { userId: session.user.id } } } },
            ],
        },
        include: {
            folder: {
                include: { user: { select: { firstName: true, lastName: true, email: true } } }
            },
            card: {
                include: { user: { select: { firstName: true, lastName: true, email: true } } }
            },
            group: true, // to know if it was shared via group
        },
        orderBy: { createdAt: "desc" }
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-card-foreground">Partagé avec moi</h2>
                <p className="text-muted-foreground text-sm">
                    Les dossiers et documents que d'autres utilisateurs ont partagés avec vous.
                </p>
            </div>

            {sharedResources.length === 0 ? (
                <div className="text-muted-foreground p-8 text-center border border-border rounded-lg bg-card">
                    Vous n'avez aucun élément partagé pour le moment.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sharedResources.map(share => {
                        const isFolder = !!share.folderId;
                        const item: any = isFolder ? share.folder : share.card;
                        if (!item) return null; // Should not happen

                        const typeLabel = isFolder ? "Dossier" : "Fiche";
                        const href = isFolder ? `/dashboard/folders/${item.id}` : `/dashboard/cards/${item.id}`;

                        return (
                            <Link href={href} key={share.id} className="block group">
                                <div className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className={`p-2 rounded-lg ${isFolder ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"}`}>
                                                {isFolder ? <FolderIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold group-hover:text-primary transition-colors text-card-foreground">{item.name || item.title}</h3>
                                                <p className="text-xs text-muted-foreground">{typeLabel}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground space-y-1">
                                        <div className="flex justify-between">
                                            <span>Par :</span>
                                            <span className="font-medium text-foreground">{item.user.firstName || item.user.email}</span>
                                        </div>
                                        {share.group && (
                                            <div className="flex justify-between text-xs">
                                                <span>Via le groupe :</span>
                                                <span className="bg-secondary px-1 rounded">{share.group.name}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center pt-1 text-xs">
                                            <div className="flex items-center">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {format(new Date(share.createdAt), "d MMM yyyy", { locale: fr })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
