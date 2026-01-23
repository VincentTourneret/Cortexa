# Fonctionnalité de Liens Inline - Documentation Complète

## 🎉 Nouvelle Fonctionnalité : Liens Inline entre Fiches

Vous pouvez maintenant **surligner du texte** dans n'importe quel bloc de l'éditeur et le **lier à une fiche de connaissance** ou à une section spécifique. Cette fonctionnalité crée des **connexions bidirectionnelles** entre vos fiches, permettant de construire un véritable **graphe de connaissances**.

## ✨ Fonctionnalités

### 1. Création de liens inline
- Sélectionnez n'importe quel texte dans l'éditeur
- Liez-le à une fiche ou une section spécifique
- Le texte est automatiquement surligné et devient cliquable

### 2. Navigation intuitive
- Cliquez sur un texte surligné pour naviguer vers la fiche liée
- Ancrage automatique vers la section spécifique si applicable

### 3. Backlinks (liens entrants)
- Voir automatiquement quelles fiches référencent la fiche actuelle
- Affichage du contexte (texte surligné)
- Navigation facile vers les fiches sources

### 4. Liens sortants
- Voir toutes les fiches référencées depuis la fiche actuelle
- Vue d'ensemble des connexions de votre fiche

## 📦 Ce qui a été créé

### Fichiers principaux

1. **`src/components/editor/tools/InlineReferenceTool.tsx`**
   - Outil EditorJS personnalisé pour créer des liens inline
   - Modal de recherche et sélection de fiches
   - Gestion automatique des événements de clic

2. **`src/components/editor/Backlinks.tsx`**
   - Composant React pour afficher les liens entrants et sortants
   - Design moderne avec badges et cartes
   - Responsive et accessible

3. **`src/app/api/inline-references/route.ts`**
   - API REST pour gérer les liens inline
   - Endpoints : POST, GET, DELETE
   - Authentification et validation

4. **`prisma/schema.prisma`** (modifié)
   - Nouveau modèle `InlineReference`
   - Relations avec `KnowledgeCard` et `KnowledgeSection`
   - Index pour performances optimales

### Composants UI ajoutés

- **`src/components/ui/card.tsx`** - Composant Card avec variants
- **`src/components/ui/badge.tsx`** - Composant Badge pour les compteurs
- **`src/components/ui/separator.tsx`** - Séparateur visuel

### Styles CSS

- **`src/app/editorjs.css`** (modifié)
  - Styles pour les liens inline (`.inline-reference`)
  - Modal de sélection
  - Responsivité mobile

### Documentation

- **`INLINE_REFERENCES_GUIDE.md`** - Guide technique complet
- **`INLINE_REFERENCES_INTEGRATION.md`** - Guide d'intégration avec exemples
- **`INLINE_REFERENCES_README.md`** - Ce fichier (vue d'ensemble)

### Scripts

- **`scripts/migrate-inline-references.sh`** - Script de migration automatique

## 🚀 Installation et Configuration

### Étape 1 : Migration de la base de données

La migration a déjà été appliquée automatiquement. Si vous rencontrez des problèmes :

```bash
# Générer le client Prisma
npm run db:generate

# Appliquer la migration
npm run db:migrate

# Ou utiliser le script fourni
chmod +x scripts/migrate-inline-references.sh
./scripts/migrate-inline-references.sh
```

### Étape 2 : Vérifier les dépendances

Toutes les dépendances ont été installées :
- ✅ `@radix-ui/react-separator`
- ✅ `class-variance-authority`
- ✅ `lucide-react` (pour les icônes)

### Étape 3 : Redémarrer le serveur

```bash
npm run dev
# ou
bun dev
```

## 📖 Utilisation

### Pour les développeurs

Consultez **`INLINE_REFERENCES_INTEGRATION.md`** pour des exemples complets d'intégration.

**Quick Start :**

```tsx
import { EditorJSWrapper } from "@/components/editor/EditorJSWrapper";
import { Backlinks } from "@/components/editor/Backlinks";

export default function MyCardPage({ params }: { params: { id: string } }) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Éditeur avec contexte */}
      <div className="col-span-2" data-card-id={params.id}>
        <EditorJSWrapper data={data} onChange={onChange} />
      </div>
      
      {/* Widget de backlinks */}
      <div>
        <Backlinks cardId={params.id} />
      </div>
    </div>
  );
}
```

### Pour les utilisateurs finaux

1. **Créer un lien :**
   - Sélectionnez du texte
   - Cliquez sur l'icône "🔗" dans la barre d'outils (ou `Ctrl+K`)
   - Recherchez une fiche
   - Cliquez sur la fiche ou une de ses sections

2. **Naviguer :**
   - Cliquez sur n'importe quel texte surligné

3. **Supprimer un lien :**
   - Sélectionnez le texte surligné
   - Cliquez à nouveau sur l'icône "🔗"

## 🔍 Structure de la base de données

### Nouvelle table : `inline_references`

```sql
CREATE TABLE inline_references (
  id TEXT PRIMARY KEY,
  
  -- Source (où se trouve le lien)
  sourceCardId TEXT NOT NULL,
  sourceSectionId TEXT,
  
  -- Cible (fiche référencée)
  targetCardId TEXT NOT NULL,
  targetSectionId TEXT,
  
  -- Contenu
  highlightedText TEXT NOT NULL,
  
  -- Métadonnées
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME,
  
  FOREIGN KEY (sourceCardId) REFERENCES knowledge_cards(id) ON DELETE CASCADE,
  FOREIGN KEY (sourceSectionId) REFERENCES knowledge_sections(id) ON DELETE CASCADE,
  FOREIGN KEY (targetCardId) REFERENCES knowledge_cards(id) ON DELETE CASCADE,
  FOREIGN KEY (targetSectionId) REFERENCES knowledge_sections(id) ON DELETE CASCADE
);
```

## 🎨 Personnalisation

### Modifier les couleurs des liens

Dans `src/app/editorjs.css` :

```css
.inline-reference {
  background-color: hsl(var(--primary) / 0.1); /* Fond */
  color: hsl(var(--primary));                  /* Texte */
  /* ... */
}
```

### Modifier le style du modal

Dans `InlineReferenceTool.tsx`, méthode `createSelectorModal()` :

```typescript
modal.style.cssText = `
  /* Vos styles personnalisés */
`;
```

## 🔧 API Reference

### Créer un lien

```http
POST /api/inline-references
Content-Type: application/json

{
  "sourceCardId": "uuid",
  "sourceSectionId": "uuid",  // optionnel
  "targetCardId": "uuid",
  "targetSectionId": "uuid",  // optionnel
  "highlightedText": "texte"
}
```

### Récupérer les liens

```http
GET /api/inline-references?cardId=uuid&direction=both&sectionId=uuid
```

Paramètres :
- `cardId` (requis) : ID de la fiche
- `direction` (optionnel) : `from`, `to`, ou `both` (défaut: `both`)
- `sectionId` (optionnel) : ID de la section

### Supprimer un lien

```http
DELETE /api/inline-references?id=uuid
```

## 📊 Prochaines fonctionnalités suggérées

### Court terme
- [ ] Prévisualisation au survol d'un lien
- [ ] Raccourci clavier `Ctrl+K` pour ouvrir le modal
- [ ] Compteur de liens dans la liste des fiches
- [ ] Suggestions de fiches similaires lors de la création

### Moyen terme
- [ ] Graphe de connaissances visuel (avec D3.js ou vis.js)
- [ ] Recherche par connexions ("fiches liées à X")
- [ ] Export du graphe en différents formats
- [ ] Détection et réparation des liens cassés

### Long terme
- [ ] Suggestions automatiques de liens (IA)
- [ ] Analyse de centralité des fiches (PageRank-like)
- [ ] Communautés de fiches (clustering)
- [ ] Timeline des connexions

## 🐛 Dépannage

### Problème : Les liens ne se créent pas

**Solution :**
1. Vérifiez que l'élément wrapper a `data-card-id`
2. Vérifiez la console pour les erreurs
3. Vérifiez que l'utilisateur est authentifié

### Problème : Modal ne s'affiche pas

**Solution :**
1. Vérifiez que le z-index du modal est correct
2. Vérifiez qu'il n'y a pas de conflits CSS
3. Vérifiez la console pour les erreurs

### Problème : Backlinks ne s'affichent pas

**Solution :**
1. Vérifiez que l'API est accessible
2. Vérifiez que la migration Prisma a été appliquée
3. Vérifiez la console réseau pour les erreurs

### Problème : Erreur de migration Prisma

**Solution :**
```bash
# Réinitialiser la base de données (ATTENTION : efface les données)
npm run db:migrate reset

# Ou forcer la mise à jour
npx prisma db push --accept-data-loss
```

## 📚 Documentation complète

- **[INLINE_REFERENCES_GUIDE.md](./INLINE_REFERENCES_GUIDE.md)** - Guide technique détaillé
- **[INLINE_REFERENCES_INTEGRATION.md](./INLINE_REFERENCES_INTEGRATION.md)** - Guide d'intégration avec exemples

## 🤝 Contribution

Pour améliorer cette fonctionnalité :

1. Créez une branche : `git checkout -b feature/improve-inline-refs`
2. Faites vos modifications
3. Testez : créez des liens, naviguez, vérifiez les backlinks
4. Committez : `git commit -am 'Amélioration des liens inline'`
5. Pushez : `git push origin feature/improve-inline-refs`

## 📝 Changelog

### Version 1.0.0 (23/01/2026)
- ✨ Première version des liens inline
- ✨ Composant Backlinks
- ✨ API REST complète
- ✨ Migration Prisma
- 📚 Documentation complète

## 📄 Licence

Ce code fait partie de votre projet et suit la même licence.

---

**Besoin d'aide ?** Consultez les guides ou ouvrez une issue sur GitHub.
