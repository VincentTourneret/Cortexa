"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import axios from "axios";
import { AuthTemplate } from "@/components/auth/AuthTemplate";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await axios.post("/api/auth/forgot-password", { email });
      setStatus("success");
      setMessage(response.data.message);
    } catch (error: unknown) {
      setStatus("error");
      setMessage(
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          "Une erreur est survenue."
      );
    }
  };

  return (
    <AuthTemplate
      title="Mot de passe oublié ?"
      subtitle="Entrez votre email pour recevoir un lien de réinitialisation."
    >
      {status === "success" ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
            {message}
          </div>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Retour à la connexion
          </Link>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Adresse email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
              placeholder="vous@exemple.com"
            />
          </div>

          {status === "error" && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {message}
            </div>
          )}

          <Button type="submit" disabled={status === "loading"} className="w-full">
            {status === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Envoyer le lien
          </Button>

          <p className="text-center text-sm">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Retour à la connexion
            </Link>
          </p>
        </form>
      )}
    </AuthTemplate>
  );
}
