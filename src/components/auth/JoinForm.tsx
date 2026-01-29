
"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const joinSchema = z.object({
    firstName: z.string().min(1, "Le prénom est requis"),
    lastName: z.string().optional(),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
});

interface JoinFormProps {
    token: string;
}

export function JoinForm({ token }: JoinFormProps) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof joinSchema>>({
        resolver: zodResolver(joinSchema),
    });

    const onSubmit = (data: z.infer<typeof joinSchema>) => {
        setError(null);
        startTransition(async () => {
            try {
                const response = await fetch("/api/auth/join", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        token,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        password: data.password,
                    }),
                });

                if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.error || "Une erreur est survenue");
                }

                const result = await response.json();

                // Sign in user
                const signInResult = await signIn("credentials", {
                    email: result.email,
                    password: data.password,
                    redirect: false,
                });

                if (signInResult?.ok) {
                    router.push("/dashboard");
                    router.refresh();
                } else {
                    router.push("/login?email=" + result.email);
                }
            } catch (err: any) {
                setError(err.message);
            }
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                    id="firstName"
                    placeholder="John"
                    {...register("firstName")}
                    disabled={isPending}
                />
                {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="lastName">Nom (Facultatif)</Label>
                <Input
                    id="lastName"
                    placeholder="Doe"
                    {...register("lastName")}
                    disabled={isPending}
                />
                {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                    id="password"
                    type="password"
                    {...register("password")}
                    disabled={isPending}
                />
                {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                    id="confirmPassword"
                    type="password"
                    {...register("confirmPassword")}
                    disabled={isPending}
                />
                {errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                        {errors.confirmPassword.message}
                    </p>
                )}
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Création du compte..." : "Créer mon compte et rejoindre"}
            </Button>
        </form>
    );
}
