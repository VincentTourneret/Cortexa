"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { registerSchema } from "@/lib/validations";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";

export const RegisterForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validation côté client
    const validationResult = registerSchema.safeParse({ email, password, firstName, lastName });
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      setError(firstError?.message || "Erreur de validation");
      setIsLoading(false);
      return;
    }

    try {
      await api.post("/api/auth/register", { email, password, firstName, lastName });

      // Rediriger vers la page de login après inscription réussie
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.response?.data?.error || "Une erreur est survenue lors de l'inscription");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="firstName" className="text-sm font-medium text-foreground">
            Prénom
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            placeholder="Jean"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="lastName" className="text-sm font-medium text-foreground">
            Nom
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            placeholder="Dupont"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          placeholder="vous@exemple.com"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          placeholder="••••••••"
        />
        <p className="text-xs text-muted-foreground">
          Au moins 8 caractères, une majuscule, une minuscule et un chiffre
        </p>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="mt-2 w-full"
      >
        {isLoading ? "Création..." : "Créer un compte"}
      </Button>
    </form>
  );
};
