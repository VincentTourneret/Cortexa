"use client";

import { useState, FormEvent } from "react";
import { changePasswordSchema } from "@/lib/validations";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";

export const ChangePasswordForm = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    // Validation côté client
    const validationResult = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!validationResult.success) {
      setError((validationResult.error as any).errors[0].message);
      setIsLoading(false);
      return;
    }

    try {
      await api.post("/api/auth/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setSuccess("Mot de passe modifié avec succès");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || "Une erreur est survenue lors du changement de mot de passe");
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

      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
          {success}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="currentPassword" className="text-sm font-medium text-foreground">
          Mot de passe actuel
        </label>
        <input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className="rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          placeholder="••••••••"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="newPassword" className="text-sm font-medium text-foreground">
          Nouveau mot de passe
        </label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          placeholder="••••••••"
        />
        <p className="text-xs text-muted-foreground">
          Au moins 8 caractères, une majuscule, une minuscule et un chiffre
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
          Confirmer le nouveau mot de passe
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          placeholder="••••••••"
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="mt-2 w-full"
      >
        {isLoading ? "Modification..." : "Modifier le mot de passe"}
      </Button>
    </form>
  );
};
