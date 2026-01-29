
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { JoinForm } from "@/components/auth/JoinForm";
import { Loader2 } from "lucide-react";

import { Suspense } from "react";

function JoinContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    const { data: session, status } = useSession();
    const [error, setError] = useState<string | null>(null);
    const [accepting, setAccepting] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("Lien d'invitation invalide.");
            return;
        }

        if (status === "authenticated") {
            setAccepting(true);
            // Auto accept
            fetch("/api/invitations/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            })
                .then(async (res) => {
                    if (res.ok) {
                        router.push("/dashboard");
                        router.refresh();
                    } else {
                        const data = await res.json();
                        setError(data.error || "Erreur lors de l'acceptation de l'invitation.");
                        setAccepting(false);
                    }
                })
                .catch(() => {
                    setError("Erreur de connexion.");
                    setAccepting(false);
                });
        }
    }, [token, status, router]);

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-destructive font-bold">{error || "Token manquant"}</div>
            </div>
        );
    }

    if (status === "loading" || accepting) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Traitement de l'invitation...</span>
            </div>
        );
    }

    if (status === "authenticated") {
        // Should have redirected or shown error
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4">
                {error && <div className="text-destructive font-bold">{error}</div>}
                <button onClick={() => router.push("/dashboard")} className="text-primary hover:underline">
                    Retour au tableau de bord
                </button>
            </div>
        );
    }

    // Not authenticated -> Show Join Form
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-8 rounded-lg bg-card p-8 shadow-lg border border-border">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-card-foreground">Bienvenue sur Cortexa</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Créez votre compte pour accepter l'invitation
                    </p>
                </div>

                {error && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive text-center">
                        {error}
                    </div>
                )}

                <JoinForm token={token} />

                <div className="text-center text-sm mt-4">
                    <p className="text-muted-foreground">
                        Vous avez déjà un compte ?{" "}
                        <button onClick={() => router.push(`/login?callbackUrl=/join?token=${token}`)} className="font-medium text-primary hover:underline">
                            Connectez-vous pour accepter
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function JoinPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <JoinContent />
        </Suspense>
    );
}
