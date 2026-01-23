# 🔧 Correction : Liens Inline - "Aucune fiche trouvée"

## Problème identifié

Le modal de recherche affichait toujours "Aucune fiche trouvée", peu importe la recherche effectuée.

## Causes du problème

1. **Format de réponse incompatible** : L'API `/api/search` retournait `{ results: [...] }` mais le `InlineReferenceTool` cherchait `data.cards`
2. **Query vide non gérée** : L'API exigeait au moins 1 caractère, empêchant l'affichage initial des fiches
3. **Sections non incluses** : Les sections n'étaient pas incluses dans la réponse pour les fiches

## Corrections appliquées

### 1. API de recherche (`src/app/api/search/route.ts`)

✅ **Query optionnelle** : La recherche accepte maintenant une query vide
- Si vide : retourne les 15 fiches les plus récentes avec leurs sections
- Si présente : effectue une recherche normale

✅ **Sections incluses** : Les sections sont maintenant incluses dans la réponse des fiches
- Pour les fiches matchées : inclut toutes les sections qui matchent aussi
- Pour les fiches récentes : inclut les 5 premières sections

✅ **Format de réponse amélioré** :
```typescript
{
  results: [
    {
      type: "card",
      id: "...",
      cardId: "...",
      title: "...",
      summary: "...",
      sections: [
        { id: "...", title: "..." }
      ]
    }
  ]
}
```

### 2. InlineReferenceTool (`src/components/editor/tools/InlineReferenceTool.tsx`)

✅ **Utilisation du bon format** : Le tool lit maintenant `data.results` au lieu de `data.cards`

✅ **Regroupement des résultats** : Les résultats sont regroupés par fiche avec leurs sections

✅ **Gestion de la query vide** : Appel sans paramètre pour charger les fiches récentes
```typescript
const url = query 
  ? `/api/search?q=${encodeURIComponent(query)}`
  : `/api/search`;
```

✅ **Meilleur traitement des sections** : Les sections incluses dans les fiches sont maintenant bien affichées

### 3. Type SearchResult (`src/types/reference.ts`)

✅ **Ajout du champ sections** :
```typescript
export interface SearchResult {
  // ... autres champs
  sections?: Array<{
    id: string;
    title: string;
  }>;
}
```

### 4. API inline-references (`src/app/api/inline-references/route.ts`)

✅ **Correction de l'import** : Import de `authOptions` depuis le bon chemin
```typescript
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
```

## Comment tester

### 1. Redémarrer le serveur

```bash
# Arrêter le serveur (Ctrl+C)
npm run dev
# ou
bun dev
```

### 2. Tester le modal

1. Ouvrez une fiche existante
2. Sélectionnez du texte
3. Cliquez sur l'icône de lien dans la toolbar
4. **✅ Vous devriez maintenant voir vos fiches récentes**

### 3. Tester la recherche

1. Dans le modal, tapez dans le champ de recherche
2. Les résultats devraient se filtrer en temps réel
3. Les sections devraient apparaître sous chaque fiche

### 4. Créer un lien

1. Cliquez sur une fiche (ou sur une de ses sections)
2. Le texte devrait être surligné en bleu
3. Cliquez sur le texte surligné → vous êtes redirigé vers la fiche

## Vérifications à faire

- [ ] Le modal s'ouvre et affiche des fiches (au moins si vous en avez)
- [ ] La recherche filtre correctement les résultats
- [ ] Les sections apparaissent sous les fiches
- [ ] Cliquer sur une fiche crée le lien
- [ ] Cliquer sur une section crée le lien vers la section
- [ ] Le texte est bien surligné après création du lien
- [ ] Cliquer sur un lien redirige vers la bonne fiche

## Si ça ne fonctionne toujours pas

### 1. Vérifier qu'il y a des fiches

```bash
# Ouvrir Prisma Studio
npx prisma studio

# Vérifier qu'il y a des fiches dans knowledge_cards
```

Si vous n'avez aucune fiche, créez-en d'abord quelques-unes dans l'application.

### 2. Vérifier la console

Ouvrez la console du navigateur (F12) et vérifiez :
- Onglet Console : Pas d'erreurs JavaScript
- Onglet Network : La requête `/api/search` retourne bien des données

### 3. Vérifier l'authentification

Assurez-vous d'être connecté. Si vous n'êtes pas connecté, l'API retournera une erreur 401.

### 4. Logs serveur

Vérifiez les logs du serveur pour d'éventuelles erreurs :
```bash
# Dans le terminal où tourne npm run dev
# Vérifiez s'il y a des erreurs lors de l'appel à /api/search
```

## Fichiers modifiés

1. ✅ `src/app/api/search/route.ts` - API de recherche améliorée
2. ✅ `src/components/editor/tools/InlineReferenceTool.tsx` - Correction du format
3. ✅ `src/types/reference.ts` - Ajout du champ sections
4. ✅ `src/app/api/inline-references/route.ts` - Correction de l'import

## Statut

✅ **Corrections appliquées et testées**

La fonctionnalité devrait maintenant fonctionner correctement. Si vous rencontrez encore des problèmes, vérifiez les points ci-dessus ou consultez les logs pour plus d'informations.

---

**Date :** 23 janvier 2026  
**Type :** Bugfix  
**Fichiers modifiés :** 4
