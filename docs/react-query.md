# Implémentation React Query

## Vue d'ensemble

React Query a été implémenté dans ce projet pour optimiser la gestion du cache et réduire la charge sur la base de données. Tous les appels API sont maintenant gérés via React Query avec des stratégies de cache intelligentes.

## Architecture

### Provider (`src/components/providers/QueryProvider.tsx`)

Le `QueryProvider` enveloppe l'application et configure React Query avec les paramètres par défaut :

- **staleTime**: 5 minutes - Les données sont considérées comme fraîches pendant 5 min
- **gcTime**: 10 minutes - Garbage collection après 10 min d'inactivité
- **retry**: 1 tentative en cas d'échec
- **refetchOnWindowFocus**: Désactivé pour éviter les requêtes superflues
- **refetchOnMount**: Activé pour garantir des données fraîches au montage
- **refetchOnReconnect**: Activé pour synchroniser après reconnexion

### Hooks API (`src/hooks/api/`)

Tous les appels API sont encapsulés dans des hooks personnalisés :

#### 1. Knowledge Cards (`useKnowledgeCards.ts`)

```typescript
// Récupérer la liste des fiches
const { data: cards, isLoading } = useKnowledgeCards(folderId?);

// Créer une fiche
const createMutation = useCreateKnowledgeCard();
await createMutation.mutateAsync({ title, summary });

// Mettre à jour une fiche
const updateMutation = useUpdateKnowledgeCard();
await updateMutation.mutateAsync({ id, folderId, title, summary });

// Supprimer une fiche
const deleteMutation = useDeleteKnowledgeCard();
await deleteMutation.mutateAsync(id);
```

#### 2. Sections (`useSections.ts`)

```typescript
// Récupérer les sections d'une fiche
const { data: sections } = useSections(cardId);

// Créer une section
const createMutation = useCreateSection();
await createMutation.mutateAsync({ cardId, title, content, contentType });

// Mettre à jour une section
const updateMutation = useUpdateSection();
await updateMutation.mutateAsync({ cardId, sectionId, content });

// Supprimer une section
const deleteMutation = useDeleteSection();
await deleteMutation.mutateAsync({ cardId, sectionId });
```

#### 3. Dossiers (`useFolders.ts`)

```typescript
// Récupérer les dossiers
const { data: folders } = useFolders(parentId?);

// Récupérer un dossier avec son chemin
const { data: folder } = useFolder(id);

// Créer un dossier
const createMutation = useCreateFolder();
await createMutation.mutateAsync({ name, parentId });

// Mettre à jour un dossier
const updateMutation = useUpdateFolder();
await updateMutation.mutateAsync({ id, name, parentId });

// Supprimer un dossier
const deleteMutation = useDeleteFolder();
await deleteMutation.mutateAsync(id);

// Réordonner les dossiers
const reorderMutation = useReorderFolders();
await reorderMutation.mutateAsync({ folderIds, parentId });
```

#### 4. Recherche (`useSearch.ts` et `useReferenceSearchWithDebounce.ts`)

```typescript
// Recherche simple
const { data: results, isLoading } = useSearch(query, enabled);

// Recherche avec debouncing intégré
const { results, loading, error, search, clearResults } = 
  useReferenceSearchWithDebounce(300);
```

#### 5. Références inline (`useInlineReferences.ts`)

```typescript
// Récupérer plusieurs références par IDs
const { data: references } = useInlineReferences(ids);
```

## Avantages de React Query

### 1. Cache intelligent

- Les données sont automatiquement mises en cache
- Évite les appels API redondants
- Déduplication automatique des requêtes identiques

### 2. Invalidation automatique

Lorsqu'une mutation réussit, React Query invalide automatiquement les données concernées :

```typescript
// Exemple : après la création d'une fiche
onSuccess: () => {
  // Invalide toutes les listes de knowledge cards
  queryClient.invalidateQueries({ queryKey: knowledgeCardsKeys.lists() });
}
```

### 3. États de chargement et d'erreur

```typescript
const { data, isLoading, error } = useKnowledgeCards();

if (isLoading) return <Loader />;
if (error) return <Error message={error.message} />;
return <Cards data={data} />;
```

### 4. Optimistic updates possibles

React Query permet de faire des mises à jour optimistes (afficher le changement avant la réponse du serveur) pour une meilleure UX.

### 5. Background refetching

Les données peuvent être rafraîchies en arrière-plan pour rester à jour sans intervention de l'utilisateur.

## Clés de Query

Chaque type de ressource utilise un système de clés hiérarchique :

```typescript
// Exemples de clés
knowledgeCardsKeys.all                    // ["knowledgeCards"]
knowledgeCardsKeys.lists()                // ["knowledgeCards", "list"]
knowledgeCardsKeys.list(folderId)         // ["knowledgeCards", "list", folderId]
knowledgeCardsKeys.detail(id)             // ["knowledgeCards", "detail", id]
```

Cela permet une invalidation granulaire :

```typescript
// Invalide toutes les listes
queryClient.invalidateQueries({ queryKey: knowledgeCardsKeys.lists() });

// Invalide seulement une liste spécifique
queryClient.invalidateQueries({ queryKey: knowledgeCardsKeys.list(folderId) });
```

## Composants mis à jour

Les composants suivants utilisent maintenant React Query :

1. **KnowledgeCardsClient** - Gestion des fiches de connaissances
2. **KnowledgeCardSections** - Gestion des sections
3. **FolderList** - Navigation dans les dossiers avec drag & drop
4. **SearchModal** - Recherche globale
5. **InlineReferenceTool** - Références inline dans l'éditeur

## Configuration personnalisée

Pour des besoins spécifiques, vous pouvez surcharger la configuration par hook :

```typescript
const { data } = useKnowledgeCards(folderId, {
  staleTime: 10 * 60 * 1000, // 10 minutes au lieu de 5
  refetchOnWindowFocus: true, // Réactiver le refetch au focus
});
```

## DevTools (optionnel)

Pour déboguer React Query en développement, installez les DevTools :

```bash
bun add @tanstack/react-query-devtools
```

Puis dans `QueryProvider.tsx` :

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export const QueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
```

## Performance

### Réduction de la charge base de données

- Les requêtes identiques sont dédupliquées
- Le cache évite les appels inutiles
- Les données stale ne sont pas refetchées systématiquement

### Meilleure expérience utilisateur

- Chargements instantanés depuis le cache
- États de chargement et d'erreur cohérents
- Mises à jour automatiques après mutations

## Maintenance

Pour ajouter un nouveau endpoint API :

1. Créer un nouveau fichier dans `src/hooks/api/`
2. Définir les clés de query
3. Créer les hooks useQuery pour les lectures
4. Créer les hooks useMutation pour les écritures
5. Configurer l'invalidation appropriée dans `onSuccess`
6. Exporter depuis `src/hooks/api/index.ts`

## Ressources

- [Documentation React Query](https://tanstack.com/query/latest)
- [Guide des clés de query](https://tanstack.com/query/latest/docs/react/guides/query-keys)
- [Guide des mutations](https://tanstack.com/query/latest/docs/react/guides/mutations)
