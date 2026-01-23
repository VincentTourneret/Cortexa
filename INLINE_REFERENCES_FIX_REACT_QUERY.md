# Correction des références inline avec React Query

## 🐛 Problème identifié

Après l'implémentation de React Query, les liens de référence inline dans l'éditeur ne fonctionnaient plus. Les utilisateurs ne pouvaient plus cliquer sur les liens dans le texte pour naviguer vers d'autres fiches.

### Cause racine

Lorsque le contenu EditorJS est sauvegardé puis rechargé :
1. ✅ Les IDs des références (`data-card-id`, `data-section-id`) sont conservés
2. ❌ Les titres (`data-card-title`, `data-section-title`) sont perdus
3. ❌ Sans les titres, le tooltip ne s'affiche pas et l'utilisateur ne peut pas identifier la destination du lien

## 🔧 Solution implémentée

### 1. Endpoint API amélioré (`/api/inline-references`)

L'endpoint POST supporte maintenant deux modes :

#### Mode A : Créer un lien (comportement existant)
```typescript
POST /api/inline-references
{
  sourceCardId: "...",
  targetCardId: "...",
  highlightedText: "..."
}
```

#### Mode B : Récupérer les informations de références (nouveau)
```typescript
POST /api/inline-references
{
  ids: ["card-id-1", "section-id-1", "card-id-2", ...]
}

// Réponse
{
  references: [
    {
      id: "card-id-1",
      type: "card",
      title: "Titre de la fiche",
      cardId: "card-id-1"
    },
    {
      id: "section-id-1",
      type: "section",
      title: "Titre de la section",
      cardId: "parent-card-id",
      sectionId: "section-id-1"
    }
  ]
}
```

### 2. InlineReferenceTool amélioré

La méthode `reattachClickEvents()` a été modifiée pour :

#### Avant
```typescript
reattachClickEvents() {
  const links = document.querySelectorAll('.inline-reference');
  links.forEach(link => {
    // ❌ Attacher seulement les événements
    // ❌ Pas de récupération des titres
    link.addEventListener('click', ...);
  });
}
```

#### Après
```typescript
async reattachClickEvents() {
  const links = document.querySelectorAll('.inline-reference');
  
  // 1. Collecter tous les IDs
  const allIds = [...cardIds, ...sectionIds];
  
  // 2. Récupérer les infos en une seule requête
  const response = await fetch('/api/inline-references', {
    method: 'POST',
    body: JSON.stringify({ ids: allIds })
  });
  const { references } = await response.json();
  
  // 3. Créer un map pour accès rapide
  const referencesMap = new Map(references.map(ref => [ref.id, ref]));
  
  // 4. Attacher événements ET définir les titres
  links.forEach(link => {
    const cardInfo = referencesMap.get(cardId);
    if (cardInfo?.title) {
      link.setAttribute('data-card-title', cardInfo.title);
    }
    
    const sectionInfo = referencesMap.get(sectionId);
    if (sectionInfo?.title) {
      link.setAttribute('data-section-title', sectionInfo.title);
    }
    
    link.addEventListener('click', ...);
    this.attachTooltipEvents(link);
  });
}
```

## ✅ Avantages de cette approche

### 1. Performance optimisée
- ✅ Une seule requête API pour tous les liens sur la page
- ✅ Plutôt que N requêtes (une par lien)
- ✅ Compatible avec React Query pour le cache futur

### 2. Compatibilité avec React Query
- ✅ L'endpoint utilise déjà le format attendu par `useInlineReferences`
- ✅ Peut être facilement migré vers React Query plus tard
- ✅ Pas d'impact sur les fonctionnalités existantes

### 3. Robustesse
- ✅ Gestion d'erreur en cas de problème API
- ✅ Fonctionne même si certains titres manquent
- ✅ Pas de régression sur la création de liens

## 🎯 Résultat

Les liens de référence inline fonctionnent maintenant correctement :
- ✅ Les tooltips s'affichent avec les titres corrects
- ✅ Les clics sur les liens naviguent vers la bonne page
- ✅ Les événements sont réattachés après le chargement
- ✅ Performance optimisée (1 requête au lieu de N)

## 🔄 Migration future vers React Query

Pour aller plus loin, on pourrait créer un hook React Query pour l'InlineReferenceTool :

```typescript
// Dans EditorJSWrapper.tsx
const allReferenceIds = extractReferenceIds(data);
const { data: references } = useInlineReferences(allReferenceIds);

// Passer references au tool via config
<EditorJS
  tools={{
    reference: {
      class: InlineReferenceTool,
      config: { references }
    }
  }}
/>
```

Cette optimisation pourrait être faite dans un second temps si nécessaire.

## 📝 Fichiers modifiés

1. `src/components/editor/tools/InlineReferenceTool.tsx`
   - Méthode `reattachClickEvents()` modifiée
   - Récupération des titres depuis l'API

2. `src/app/api/inline-references/route.ts`
   - Endpoint POST étendu
   - Support du mode "récupération d'infos"

## ✨ Test

Pour tester la correction :
1. Ouvrez une fiche contenant des références inline
2. Vérifiez que le tooltip s'affiche au survol
3. Cliquez sur un lien pour vérifier la navigation
4. Rechargez la page pour confirmer que ça fonctionne toujours
