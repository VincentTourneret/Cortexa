"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import axios from "axios";
import { Suspense } from "react";
import { AuthTemplate } from "@/components/auth/AuthTemplate";
import { Button } from "@/components/ui/button";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Vérification de votre email en cours...");
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de vérification manquant.");
      return;
    }

    if (verifiedRef.current) return;
    verifiedRef.current = true;

    const verifyEmail = async () => {
      try {
        const url = email
          ? `/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`
          : `/api/auth/verify-email?token=${token}`;

        await axios.get(url);
        setStatus("success");
        setMessage("Votre email a été vérifié avec succès !");
      } catch (error: unknown) {
        setStatus("error");
        setMessage(
          (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
            "Le lien de vérification est invalide ou a expiré."
        );
      }
    };

    verifyEmail();
  }, [token, email]);

  if (status === "loading") {
    return (
      <AuthTemplate title="Vérification..." subtitle="Vérification de votre email en cours.">
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      </AuthTemplate>
    );
  }

  if (status === "success") {
    return (
      <AuthTemplate title="Email vérifié !" subtitle="Merci d'avoir confirmé votre adresse email.">
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <p className="text-muted-foreground">{message}</p>
          <Button asChild className="w-full">
            <Link href="/login">Se connecter</Link>
          </Button>
        </div>
      </AuthTemplate>
    );
  }

  return (
    <AuthTemplate title="Échec de la vérification" subtitle={message}>
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <XCircle className="h-16 w-16 text-destructive" />
        </div>
        <Button asChild variant="outline">
          <Link href="/login">Retour à la connexion</Link>
        </Button>
      </div>
    </AuthTemplate>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
