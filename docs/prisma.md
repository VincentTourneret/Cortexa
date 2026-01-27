# Configuration de la base de données avec Prisma

## Variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# Database (SQLite par défaut pour le développement)
DATABASE_URL="file:./dev.db"

# Pour PostgreSQL en production :
# DATABASE_URL="postgresql://user:password@localhost:5432/ju_db?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

## Configuration Prisma

### Pour SQLite (développement - par défaut)

SQLite est configuré par défaut et ne nécessite aucune installation supplémentaire. La base de données sera créée dans `prisma/dev.db` lors de la première migration.

### Pour PostgreSQL (production)

1. Installez PostgreSQL sur votre machine
2. Créez une base de données :
   ```sql
   CREATE DATABASE ju_db;
   ```
3. Modifiez `prisma/schema.prisma` :
   ```prisma
   datasource db {
     provider = "postgresql"
   }
   ```
4. Mettez à jour `DATABASE_URL` dans votre `.env`

## Commandes Prisma

- `bun run db:generate` - Génère le client Prisma
- `bun run db:push` - Pousse le schéma vers la base de données (développement)
- `bun run db:migrate` - Crée une migration (production)
- `bun run db:studio` - Ouvre Prisma Studio (interface graphique)
- `bun run db:seed` - Exécute le seed de la base de données

## Première utilisation

1. Configurez votre `.env` avec `DATABASE_URL` (optionnel pour SQLite)
2. Exécutez `bun run db:push` pour créer les tables
3. Le client Prisma sera généré automatiquement lors du build

## Migration depuis le système de fichiers JSON

Les données existantes dans `data/users.json` ne seront pas automatiquement migrées. Vous devrez :

1. Créer manuellement les utilisateurs via l'interface d'inscription
2. Ou créer un script de migration pour importer les données existantes

