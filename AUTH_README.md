# Système d'authentification NextAuth.js

Système d'authentification complet pour Next.js (App Router) utilisant NextAuth.js avec Credentials Provider et JWT.

## Fonctionnalités

- ✅ Création de compte utilisateur avec email et mot de passe
- ✅ Hashage sécurisé des mots de passe avec bcrypt (12 rounds)
- ✅ Connexion utilisateur via email et mot de passe
- ✅ Changement de mot de passe pour utilisateur authentifié
- ✅ Protection des routes privées avec middleware
- ✅ Redirections intelligentes selon l'état de session
- ✅ Validation des formulaires avec Zod
- ✅ Gestion de session JWT

## Installation

1. Installer les dépendances :
```bash
bun install
```

2. Créer le fichier `.env.local` à partir de `.env.example` :
```bash
cp .env.example .env.local
```

3. Générer une clé secrète pour NextAuth :
```bash
openssl rand -base64 32
```

4. Mettre à jour `.env.local` avec votre clé secrète :
```env
NEXTAUTH_SECRET=votre-clé-secrète-générée
NEXTAUTH_URL=http://localhost:3000
```

## Structure du projet

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/route.ts    # Configuration NextAuth
│   │       ├── register/route.ts          # API route pour l'inscription
│   │       └── change-password/route.ts   # API route pour changer le mot de passe
│   ├── dashboard/page.tsx                 # Page protégée (dashboard)
│   ├── login/page.tsx                     # Page de connexion
│   └── register/page.tsx                  # Page d'inscription
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx                  # Formulaire de connexion
│   │   ├── RegisterForm.tsx               # Formulaire d'inscription
│   │   ├── ChangePasswordForm.tsx         # Formulaire de changement de mot de passe
│   │   └── LogoutButton.tsx               # Bouton de déconnexion
│   └── providers/
│       └── AuthProvider.tsx                # Provider NextAuth
├── lib/
│   ├── auth.ts                            # Utilitaires de hashage/verification
│   ├── auth-helpers.ts                    # Helpers pour l'authentification
│   ├── db.ts                              # Gestion de la base de données (JSON)
│   └── validations.ts                     # Schémas de validation Zod
├── middleware.ts                          # Middleware de protection des routes
└── types/
    └── next-auth.d.ts                     # Types TypeScript pour NextAuth
```

## Utilisation

### Routes publiques
- `/login` - Page de connexion
- `/register` - Page d'inscription

### Routes protégées
- `/dashboard` - Tableau de bord (nécessite une authentification)

### Redirections automatiques
- Utilisateur authentifié accédant à `/login` ou `/register` → redirigé vers `/dashboard`
- Utilisateur non authentifié accédant à `/dashboard` → redirigé vers `/login`

## Sécurité

### Mots de passe
- Hashage avec bcrypt (12 rounds de salt)
- Validation stricte : minimum 8 caractères, au moins une majuscule, une minuscule et un chiffre
- Vérification du mot de passe actuel avant changement

### Sessions
- Utilisation de JWT pour les sessions
- Durée de session : 30 jours
- Pas de session créée si l'authentification échoue

### Protection des routes
- Middleware Next.js pour protéger toutes les routes sauf les routes publiques
- Vérification de session côté serveur pour les pages protégées

## Base de données

Le système utilise actuellement un fichier JSON (`data/users.json`) pour le stockage. Pour la production, il est recommandé d'utiliser une vraie base de données (PostgreSQL, MongoDB, etc.).

Pour migrer vers une vraie base de données :
1. Modifier les fonctions dans `src/lib/db.ts`
2. Adapter les requêtes selon votre ORM/ODM

## Développement

```bash
# Démarrer le serveur de développement
bun dev

# Build pour la production
bun build

# Démarrer en production
bun start
```

## Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NEXTAUTH_SECRET` | Clé secrète pour signer les JWT | Générée avec `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL de base de l'application | `http://localhost:3000` |

## Notes importantes

- Les mots de passe sont hashés avec bcrypt avant stockage
- Aucune session n'est créée si l'authentification échoue
- Le middleware protège automatiquement toutes les routes sauf `/login` et `/register`
- Les redirections sont gérées automatiquement selon l'état de session
- Toutes les variables sensibles doivent être dans `.env.local` (non versionné)
