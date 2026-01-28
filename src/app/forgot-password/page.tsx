"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import axios from "axios";

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
        } catch (error: any) {
            setStatus("error");
            setMessage(error.response?.data?.error || "Une erreur est survenue.");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-8 rounded-lg bg-card p-8 shadow-lg border border-border">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-card-foreground">Mot de passe oublié ?</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Entrez votre email pour recevoir un lien de réinitialisation.
                    </p>
                </div>

                {status === "success" ? (
                    <div className="space-y-4">
                        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            {message}
                        </div>
                        <div className="text-center">
                            <Link
                                href="/login"
                                className="font-medium text-primary hover:underline flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" /> Retour à la connexion
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-foreground">
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
                                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="vous@exemple.com"
                            />
                        </div>

                        {status === "error" && (
                            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status === "loading"}
                            className="group relative flex w-full justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === "loading" && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Envoyer le lien
                        </button>

                        <div className="text-center text-sm">
                            <Link
                                href="/login"
                                className="font-medium text-primary hover:underline"
                            >
                                Retour à la connexion
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
