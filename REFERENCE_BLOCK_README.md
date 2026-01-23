# Bloc de Référence Editor.js

## Vue d'ensemble

Le bloc de référence permet de créer des liens internes vers des fiches de connaissances ou des sections spécifiques. En mode visualisation, cliquer sur une référence ouvre une modale affichant le contenu complet.

## Fonctionnalités

### Mode Édition

1. **Recherche en temps réel**
   - Tapez dans le champ de recherche pour trouver des fiches ou sections
   - La recherche est debounced (300ms) pour optimiser les performances
   - Recherche dans les titres des fiches et des sections
   - Affiche un badge pour différencier "Fiche" vs "Section"

2. **Sélection**
   - Cliquez sur un résultat pour créer la référence
   - La référence est automatiquement sauvegardée
   - Affiche un aperçu stylisé de la référence sélectionnée

3. **Modification**
   - Cliquez sur le bouton "Modifier" pour changer la référence
   - Retourne à l'interface de recherche

### Mode Lecture

1. **Affichage**
   - Bloc stylisé avec bordure colorée
   - Badge indiquant le type (Fiche/Section)
   - Icône de lien
   - Titre de la référence
   - Pour les sections : affiche aussi le titre de la fiche parente

2. **Interaction**
   - Hover effect pour indiquer le caractère cliquable
   - Click ouvre une modale avec le contenu complet

### Modale de Visualisation

1. **Affichage du contenu**
   - **Fiche complète** : Affiche toutes les sections
   - **Section spécifique** : Affiche uniquement la section sélectionnée
   - Utilise EditorJSWrapper en mode lecture seule
   - Gestion des états de chargement et d'erreur

2. **Navigation**
   - Fermeture avec bouton X
   - Fermeture avec touche Escape
   - Fermeture en cliquant à l'extérieur

## Architecture

```
src/
├── types/
│   └── reference.ts                    # Types TypeScript
├── app/
│   └── api/
│       └── search/
│           └── route.ts                # API de recherche
├── hooks/
│   └── useReferenceSearch.ts          # Hook de recherche (non utilisé par le tool mais disponible)
└── components/
    └── editor/
        ├── EditorJSWrapper.tsx         # Wrapper principal (modifié)
        ├── ReferenceModal.tsx          # Modale de visualisation
        └── tools/
            └── ReferenceTool.tsx       # Outil Editor.js
```

## API

### Endpoint de recherche

**GET** `/api/search?q=terme`

**Réponse:**
```json
{
  "results": [
    {
      "id": "uuid",
      "type": "card" | "section",
      "title": "Titre",
      "cardId": "uuid",
      "sectionId": "uuid",      // Pour les sections uniquement
      "cardTitle": "Titre",     // Pour les sections uniquement
      "summary": "Résumé"       // Pour les fiches uniquement
    }
  ]
}
```

### Structure de données du bloc

```typescript
{
  type: 'card' | 'section',
  cardId: string,
  sectionId?: string,
  title: string,
  cardTitle?: string
}
```

## Utilisation

### 1. Ajouter le bloc dans l'éditeur

Le bloc "Référence" apparaît automatiquement dans la toolbox d'Editor.js avec l'icône de lien.

### 2. Créer une référence

1. Cliquez sur l'icône "Référence" dans la toolbox
2. Tapez dans le champ de recherche
3. Sélectionnez une fiche ou section dans les résultats
4. La référence est créée automatiquement

### 3. Modifier une référence

1. Cliquez sur le bouton "Modifier" (icône crayon) sur le bloc
2. Effectuez une nouvelle recherche
3. Sélectionnez un nouveau résultat

### 4. Visualiser le contenu

En mode lecture, cliquez simplement sur le bloc de référence pour ouvrir la modale.

## Sécurité

- ✅ Authentification requise pour la recherche
- ✅ Filtrage automatique par userId
- ✅ Validation Zod des requêtes API
- ✅ Vérification des permissions d'accès

## Styling

Le bloc utilise :
- Variables CSS du thème pour le mode sombre/clair
- Tailwind CSS pour les composants React
- Styles inline pour le tool Editor.js (nécessaire car dans un contexte isolé)

### Personnalisation

Les couleurs sont basées sur les variables CSS :
- `--primary` : Couleur principale (badges, bordures)
- `--border` : Bordures
- `--card` : Fond des cartes
- `--foreground` : Texte principal
- `--muted-foreground` : Texte secondaire

## Performance

### Optimisations implémentées

1. **Recherche**
   - Debouncing (300ms)
   - Annulation des requêtes précédentes (AbortController)
   - Limite de 15 résultats maximum

2. **Modale**
   - Chargement lazy des données
   - Réinitialisation à la fermeture
   - EditorJSWrapper en mode lecture seule (pas de sauvegarde)

3. **Rendu**
   - Import dynamique du tool
   - Pas de re-render inutile

## Limitations connues

1. La recherche est basique (contains, pas de fuzzy matching)
2. Pas de preview du contenu dans les résultats de recherche
3. Pas de navigation clavier dans les résultats
4. Le hook `useReferenceSearch` n'est pas utilisé par le tool (logique inline pour éviter les dépendances React)

## Évolutions possibles

1. **Recherche avancée**
   - Fuzzy matching
   - Recherche dans le contenu (pas seulement les titres)
   - Filtres par dossier
   - Historique de recherche

2. **UX améliorée**
   - Preview du contenu dans les résultats
   - Navigation clavier (↑↓, Enter, Escape)
   - Auto-complétion intelligente
   - Suggestions basées sur les liens existants

3. **Visualisation**
   - Option pour afficher en sidebar plutôt qu'en modale
   - Navigation entre références liées
   - Graphe de relations entre fiches
   - Breadcrumb dans la modale

4. **Analytics**
   - Tracking des références les plus consultées
   - Détection des liens cassés
   - Suggestions de références pertinentes

## Tests

Pour tester le bloc :

1. ✅ **Recherche** : Tapez dans le champ et vérifiez que les résultats apparaissent
2. ✅ **Sélection** : Cliquez sur un résultat et vérifiez que le bloc est créé
3. ✅ **Sauvegarde** : Rafraîchissez la page et vérifiez que la référence est conservée
4. ✅ **Visualisation** : En mode lecture, cliquez sur le bloc et vérifiez que la modale s'ouvre
5. ✅ **Modification** : Cliquez sur "Modifier" et changez la référence
6. ✅ **Erreurs** : Testez avec des IDs invalides ou des permissions manquantes

## Dépannage

### Le bloc n'apparaît pas dans la toolbox

- Vérifiez que le ReferenceTool est bien importé dans EditorJSWrapper
- Vérifiez la configuration dans `tools.reference`

### La recherche ne retourne pas de résultats

- Vérifiez que l'API `/api/search` est accessible
- Vérifiez l'authentification (session valide)
- Vérifiez que des fiches/sections existent dans la base de données

### La modale ne s'ouvre pas

- Vérifiez que `window.openReferenceModal` est défini
- Vérifiez la console pour des erreurs JavaScript
- Vérifiez que le ReferenceModal est bien rendu dans EditorJSWrapper

### Erreurs de compilation TypeScript

- Vérifiez que tous les types sont importés correctement
- Vérifiez que @editorjs/editorjs est installé
- Lancez `bun install` si nécessaire

## Support

Pour toute question ou problème, consultez :
- Le code source dans `src/components/editor/tools/ReferenceTool.tsx`
- La documentation Editor.js : https://editorjs.io/
- Les types dans `src/types/reference.ts`
