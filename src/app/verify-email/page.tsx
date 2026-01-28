"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import axios from "axios";

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    const router = useRouter();

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
            } catch (error: any) {
                setStatus("error");
                setMessage(
                    error.response?.data?.error ||
                    "Le lien de vérification est invalide ou a expiré."
                );
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-10 shadow-lg text-center">
                {status === "loading" && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="h-16 w-16 animate-spin text-blue-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900">Vérification...</h2>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center">
                        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900">Email Vérifié !</h2>
                        <p className="mt-2 text-gray-600">
                            Merci d'avoir confirmé votre adresse email. Vous pouvez maintenant vous connecter.
                        </p>
                        <div className="mt-6">
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            >
                                Se connecter
                            </Link>
                        </div>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center">
                        <XCircle className="h-16 w-16 text-red-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900">Échec de la vérification</h2>
                        <p className="mt-2 text-gray-600">{message}</p>
                        <div className="mt-6">
                            <Link
                                href="/login"
                                className="text-sm font-semibold text-blue-600 hover:text-blue-500"
                            >
                                Retour à la connexion
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
