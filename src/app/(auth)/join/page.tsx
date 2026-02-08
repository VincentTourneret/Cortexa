"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { JoinForm } from "@/components/auth/JoinForm";
import { AuthTemplate } from "@/components/auth/AuthTemplate";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

function JoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const { status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Lien d'invitation invalide.");
      return;
    }

    if (status === "authenticated") {
      setAccepting(true);
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
      <AuthTemplate title="Lien invalide" subtitle={error || "Token manquant"}>
        <p className="text-center text-destructive font-medium">{error}</p>
      </AuthTemplate>
    );
  }

  if (status === "loading" || accepting) {
    return (
      <AuthTemplate title="Invitation" subtitle="Traitement de l'invitation en cours...">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthTemplate>
    );
  }

  if (status === "authenticated") {
    return (
      <AuthTemplate title="Invitation" subtitle="Traitement terminé.">
        <div className="space-y-4 text-center">
          {error && <p className="text-destructive font-medium">{error}</p>}
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="font-medium text-primary hover:underline"
          >
            Retour au tableau de bord
          </button>
        </div>
      </AuthTemplate>
    );
  }

  return (
    <AuthTemplate
      title="Bienvenue sur Cortexa"
      subtitle="Créez votre compte pour accepter l'invitation."
    >
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive text-center">
          {error}
        </div>
      )}

      <JoinForm token={token} />

      <p className="text-center text-sm">
        <span className="text-muted-foreground">Vous avez déjà un compte ? </span>
        <button
          type="button"
          onClick={() => router.push(`/login?callbackUrl=/join?token=${token}`)}
          className="font-medium text-primary hover:underline"
        >
          Connectez-vous pour accepter
        </button>
      </p>
    </AuthTemplate>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <JoinContent />
    </Suspense>
  );
}
