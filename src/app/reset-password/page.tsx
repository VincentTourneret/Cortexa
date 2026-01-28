"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import axios from "axios";

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    // Optional: Validate token validity on mount? 
    // Usually standard flow is verify on submit, or maybe verify on load to show "Invalid Link" immediately.
    // For simplicity, we can let user fill form and fail on submit if token invalid. 
    // Or we could have a `verify-token` endpoint?
    // Let's keep it simple: verify on submit.

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Lien invalide ou manquant.");
        }
    }, [token]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setStatus("error");
            setMessage("Les mots de passe ne correspondent pas.");
            return;
        }

        if (password.length < 8) {
            setStatus("error");
            setMessage("Le mot de passe doit contenir au moins 8 caractères.");
            return;
        }

        setStatus("loading");
        setMessage("");

        try {
            const response = await axios.post("/api/auth/reset-password", {
                token,
                password
            });
            setStatus("success");
            setMessage(response.data.message);
        } catch (error: any) {
            setStatus("error");
            setMessage(error.response?.data?.error || "Une erreur est survenue.");
        }
    };

    if (!token) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-4">
                <div className="w-full max-w-md space-y-8 rounded-lg bg-card p-8 shadow-lg border border-border text-center">
                    <h1 className="text-xl font-bold text-destructive">Lien invalide</h1>
                    <p className="text-muted-foreground">Le lien de réinitialisation est manquant.</p>
                    <div className="mt-4">
                        <Link href="/login" className="font-medium text-primary hover:underline">
                            Retour à la connexion
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-8 rounded-lg bg-card p-8 shadow-lg border border-border">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-card-foreground">Nouveau mot de passe</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Entrez votre nouveau mot de passe ci-dessous.
                    </p>
                </div>

                {status === "success" ? (
                    <div className="space-y-6 text-center">
                        <div className="flex justify-center">
                            <CheckCircle className="h-12 w-12 text-green-500" />
                        </div>
                        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            {message}
                        </div>
                        <div>
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                            >
                                Se connecter
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-foreground">
                                Nouveau mot de passe
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={8}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                                Confirmer le mot de passe
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                minLength={8}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                            Réinitialiser le mot de passe
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
