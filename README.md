# 🧠 Cortexa

![Cortexa Logo](/public/logo.png)

**Cortexa** est un système de gestion des connaissances moderne, conçu comme un "second cerveau" pour organiser, lier et explorer vos idées. Inspiré par les outils de pensée en réseau, il permet de créer une base de connaissances structurée et interconnectée.

## ✨ Fonctionnalités Clés

- **📁 Organisation Hiérarchique** : Organisez vos fiches dans des dossiers et sous-dossiers avec des couleurs personnalisées.
- **📄 Cartes de Connaissances** : Créez des fiches riches avec un éditeur de bloc moderne (Editor.js).
- **🔗 Liens Bidirectionnels** : Surlignez du texte pour créer des références directes vers d'autres fiches et visualisez les backlinks.
- **📋 Templates de Sections** : Réutilisez des structures de fiches communes pour gagner en efficacité.
- **🔍 Recherche Instantanée** : Trouvez rapidement l'information grâce à un système de recherche global (Cmd+K).
- **🌗 Design Premium** : Interface élégante avec support des thèmes clair et sombre, optimisée pour la concentration.

## 🚀 Installation Rapide

### Prérequis
- Node.js (v18+)
- Bun (recommandé) ou npm/yarn

### Configuration

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd cortexa
   ```

2. **Installer les dépendances**
   ```bash
   bun install
   # ou
   npm install
   ```

3. **Variables d'environnement**
   Créez un fichier `.env` à la racine :
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="votre_secret_ici"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Initialiser la base de données**
   ```bash
   bun run db:push
   bun run db:seed # Facultatif : données d'exemple
   ```

5. **Lancer le serveur**
   ```bash
   bun dev
   ```

## 🛠️ Stack Technique

- **Framework** : [Next.js 15](https://nextjs.org/) (App Router)
- **Base de données** : [Prisma](https://www.prisma.io/) avec SQLite
- **Authentification** : [NextAuth.js](https://next-auth.js.org/)
- **Éditeur** : [Editor.js](https://editorjs.io/) (personnalisé)
- **Styling** : [Tailwind CSS](https://tailwindcss.com/) & [Radix UI](https://www.radix-ui.com/)
- **Gestion du state** : [TanStack Query v5](https://tanstack.com/query)
- **Validation** : [Zod](https://zod.dev/)

## 📂 Structure du Projet

```text
src/
├── app/            # Routage Next.js et API
├── components/     # Composants UI (navigation, editor, folders)
├── hooks/          # Hooks React personnalisés
├── lib/            # Utilitaires et configuration (Prisma, Auth)
└── types/          # Définitions TypeScript
```

## 📖 Documentation Détaillée

Pour approfondir certains aspects techniques :
- [Éditeur & Correction de bugs](EDITORJS_README.md)
- [Système de Liens Inline](INLINE_REFERENCES_README.md)
- [Guide d'Authentification](AUTH_README.md)
- [Configuration Prisma](PRISMA_SETUP.md)

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---
Développé avec ❤️ pour une meilleure organisation des connaissances.
