# Configuration du thème avec sauvegarde en base de données

## Installation des dépendances

Avant de pouvoir utiliser le système de thème, vous devez installer la dépendance manquante :

```bash
bun add @radix-ui/react-switch
```

## Migration de la base de données

Après avoir ajouté le champ `theme` au modèle User, vous devez appliquer la migration :

```bash
# Générer le client Prisma avec le nouveau schéma
bun run db:generate

# Appliquer les changements à la base de données
bun run db:push
```

## Fonctionnalités

1. **Gestion du thème depuis le compte utilisateur** : Les utilisateurs peuvent activer/désactiver le thème sombre depuis la page "Mon compte"

2. **Sauvegarde en base de données** : La préférence de thème est sauvegardée dans la table `users` et synchronisée avec la session

3. **Synchronisation automatique** : Le thème est chargé depuis la session lors de la connexion

4. **Fallback** : Si aucun thème n'est défini en BDD, le système utilise localStorage ou les préférences système

## Utilisation

1. Connectez-vous à votre compte
2. Allez sur la page "Mon compte"
3. Utilisez le switch "Thème sombre" dans la section "Préférences d'affichage"
4. Le thème sera mis à jour immédiatement et sauvegardé en base de données

## Structure

- `prisma/schema.prisma` : Modèle User avec le champ `theme`
- `src/app/api/auth/update-theme/route.ts` : API route pour mettre à jour le thème
- `src/components/account/ThemeSettings.tsx` : Composant avec le switch shadcn
- `src/components/providers/ThemeProvider.tsx` : Provider mis à jour pour charger depuis la session
- `src/components/ui/switch.tsx` : Composant Switch de shadcn
