# Guide des Liens Inline (Références Inline)

## Vue d'ensemble

Ce guide explique comment utiliser la fonctionnalité de **liens inline** qui permet de créer des connexions entre des passages de texte et des fiches de connaissance.

## Fonctionnalités

### 1. Créer un lien inline

Pour créer un lien vers une fiche depuis n'importe quel texte dans l'éditeur :

1. **Sélectionnez le texte** que vous souhaitez lier
2. Cliquez sur l'icône **"Lier à une fiche"** dans la barre d'outils inline (ou utilisez `Ctrl+K`)
3. Un modal s'ouvre avec :
   - Un champ de recherche pour trouver la fiche cible
   - La liste des fiches disponibles
   - Les sections de chaque fiche (si disponibles)
4. Cliquez sur :
   - **Une fiche** pour lier le texte à la fiche entière
   - **Une section** pour lier le texte à une section spécifique
5. Le texte sélectionné est maintenant surligné et cliquable

### 2. Naviguer vers une référence

Cliquez sur n'importe quel texte surligné (lien inline) pour naviguer vers la fiche ou section référencée.

### 3. Supprimer un lien inline

Pour supprimer un lien :
1. Sélectionnez le texte surligné
2. Cliquez à nouveau sur l'icône "Lier à une fiche"
3. Le lien est supprimé et le texte redevient normal

## Architecture Technique

### Base de données

Une nouvelle table `inline_references` stocke tous les liens :

```prisma
model InlineReference {
  id              String   @id @default(uuid())
  
  // Source (où se trouve le texte surligné)
  sourceCardId    String
  sourceSectionId String?
  
  // Cible (fiche/section référencée)
  targetCardId    String
  targetSectionId String?
  
  // Texte surligné
  highlightedText String
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### API Endpoints

#### `POST /api/inline-references`
Crée un nouveau lien inline.

**Body :**
```json
{
  "sourceCardId": "uuid",
  "sourceSectionId": "uuid", // optionnel
  "targetCardId": "uuid",
  "targetSectionId": "uuid", // optionnel
  "highlightedText": "texte surligné"
}
```

#### `GET /api/inline-references?cardId=xxx&direction=both`
Récupère les liens d'une fiche.

**Paramètres :**
- `cardId` : ID de la fiche
- `sectionId` : ID de la section (optionnel)
- `direction` : `from`, `to`, ou `both` (défaut: `both`)
  - `from` : liens partant de cette fiche
  - `to` : liens pointant vers cette fiche (backlinks)
  - `both` : tous les liens

#### `DELETE /api/inline-references?id=xxx`
Supprime un lien inline.

### Outil EditorJS

Le fichier `src/components/editor/tools/InlineReferenceTool.tsx` contient l'outil EditorJS personnalisé.

**Caractéristiques :**
- Outil inline (comme le marqueur ou le code inline)
- Modal de recherche intégré
- Support des sections
- Sauvegarde automatique dans la base de données
- Navigation au clic

### Styles CSS

Les styles sont définis dans `src/app/editorjs.css` :

```css
.inline-reference {
  background-color: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
  padding: 2px 4px;
  border-radius: 3px;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-style: dotted;
}
```

## Migration de la base de données

Pour appliquer la nouvelle structure de base de données :

```bash
# Générer la migration
npx prisma migrate dev --name add-inline-references

# Ou si vous utilisez directement le client
npx prisma generate
npx prisma db push
```

## Utilisation dans les composants

### Fournir le contexte à l'éditeur

Pour que l'outil puisse enregistrer les liens, vous devez fournir le contexte (cardId et sectionId) :

```tsx
<div 
  className="editorjs-wrapper" 
  data-card-id={cardId}
  data-section-id={sectionId}
>
  <EditorJSWrapper ... />
</div>
```

### Afficher les backlinks

Vous pouvez créer un composant pour afficher les liens entrants (backlinks) :

```tsx
const Backlinks = ({ cardId, sectionId }: { cardId: string, sectionId?: string }) => {
  const [backlinks, setBacklinks] = useState([]);

  useEffect(() => {
    fetch(`/api/inline-references?cardId=${cardId}&direction=to${sectionId ? `&sectionId=${sectionId}` : ''}`)
      .then(res => res.json())
      .then(data => setBacklinks(data.references));
  }, [cardId, sectionId]);

  return (
    <div>
      <h3>Références vers cette fiche</h3>
      {backlinks.map(link => (
        <div key={link.id}>
          <a href={`/knowledge/${link.sourceCardId}`}>
            {link.sourceCard.title}
          </a>
          {link.sourceSection && (
            <span> - {link.sourceSection.title}</span>
          )}
          <p>"{link.highlightedText}"</p>
        </div>
      ))}
    </div>
  );
};
```

## Prochaines étapes

### Fonctionnalités suggérées

1. **Graphe de connaissances** : Visualiser les connexions entre fiches
2. **Suggestions automatiques** : Suggérer des liens lors de la saisie
3. **Statistiques** : Nombre de liens entrants/sortants par fiche
4. **Export** : Exporter le graphe de connaissances
5. **Recherche avancée** : Rechercher par liens

### Améliorations possibles

1. **Performance** : Indexation des liens pour recherche rapide
2. **UX** : Prévisualisation au survol d'un lien
3. **Validation** : Détection des liens cassés
4. **Historique** : Suivi des modifications de liens

## Dépannage

### Les liens ne se créent pas
Vérifiez que :
- Le contexte `data-card-id` est bien fourni à l'éditeur
- L'utilisateur est authentifié
- Les fiches existent et appartiennent à l'utilisateur

### Les liens ne s'affichent pas
Vérifiez que :
- Les styles CSS sont bien chargés
- Le fichier `editorjs.css` est importé dans votre layout

### Erreur de migration Prisma
Si vous rencontrez des erreurs lors de la migration :
```bash
# Réinitialiser la base de données (ATTENTION : efface toutes les données)
npx prisma migrate reset

# Ou créer une nouvelle migration
npx prisma migrate dev
```
