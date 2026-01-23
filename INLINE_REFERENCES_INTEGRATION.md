# Intégration des Liens Inline dans votre Application

## Vue d'ensemble

Ce document explique comment intégrer la fonctionnalité de liens inline dans vos pages de fiches de connaissance.

## Étapes d'intégration

### 1. Wrapper l'éditeur avec le contexte

Pour que l'outil InlineReferenceTool puisse enregistrer les liens, vous devez fournir le contexte (cardId et sectionId) à l'éditeur.

#### Option A : Wrapper dans une div (recommandé)

```tsx
// Dans votre composant de page de fiche
export default function KnowledgeCardPage({ params }: { params: { id: string } }) {
  const cardId = params.id;
  
  return (
    <div>
      {/* Autres éléments de la page */}
      
      {/* Wrapper avec le contexte */}
      <div
        data-card-id={cardId}
        data-section-id={sectionId} // optionnel, si vous éditez une section spécifique
      >
        <EditorJSWrapper
          data={editorData}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
```

#### Option B : Modifier EditorJSWrapper (alternative)

Si vous préférez, vous pouvez ajouter ces props directement au composant EditorJSWrapper :

```tsx
// Dans EditorJSWrapper.tsx
type EditorJSWrapperProps = {
  data?: EditorJSData;
  onChange?: (data: EditorJSData) => void;
  readOnly?: boolean;
  placeholder?: string;
  minHeight?: number;
  cardId?: string;        // Nouveau
  sectionId?: string;     // Nouveau
};

// Et dans le render :
return (
  <>
    <div
      id={holderIdRef.current}
      className="editorjs-wrapper"
      data-card-id={cardId}
      data-section-id={sectionId}
      style={{ minHeight: `${minHeight}px` }}
    />
    {/* ... */}
  </>
);
```

### 2. Ajouter le composant Backlinks

Importez et utilisez le composant Backlinks pour afficher les liens entrants et sortants :

```tsx
import { Backlinks } from "@/components/editor/Backlinks";

export default function KnowledgeCardPage({ params }: { params: { id: string } }) {
  const cardId = params.id;
  
  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale : Contenu de la fiche */}
        <div className="lg:col-span-2">
          <div data-card-id={cardId}>
            <EditorJSWrapper
              data={editorData}
              onChange={handleChange}
            />
          </div>
        </div>
        
        {/* Sidebar : Backlinks et autres métadonnées */}
        <div className="space-y-4">
          <Backlinks cardId={cardId} />
          
          {/* Autres composants de sidebar */}
        </div>
      </div>
    </div>
  );
}
```

### 3. Pour les sections individuelles

Si vous avez des pages/onglets pour éditer des sections individuelles :

```tsx
export default function KnowledgeSectionPage({
  params,
}: {
  params: { cardId: string; sectionId: string };
}) {
  const { cardId, sectionId } = params;
  
  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div
            data-card-id={cardId}
            data-section-id={sectionId}
          >
            <EditorJSWrapper
              data={sectionData}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Backlinks spécifiques à cette section */}
          <Backlinks
            cardId={cardId}
            sectionId={sectionId}
          />
        </div>
      </div>
    </div>
  );
}
```

## Exemple complet

Voici un exemple complet d'une page de fiche avec toutes les fonctionnalités :

```tsx
"use client";

import { useState, useEffect } from "react";
import { EditorJSWrapper } from "@/components/editor/EditorJSWrapper";
import { Backlinks } from "@/components/editor/Backlinks";
import { Button } from "@/components/ui/button";
import { EditorJSData } from "@/lib/content-converter";

export default function KnowledgeCardPage({
  params,
}: {
  params: { id: string };
}) {
  const cardId = params.id;
  const [card, setCard] = useState<any>(null);
  const [editorData, setEditorData] = useState<EditorJSData>({ blocks: [] });
  const [loading, setLoading] = useState(true);

  // Charger les données de la fiche
  useEffect(() => {
    const fetchCard = async () => {
      try {
        const res = await fetch(`/api/knowledge-cards/${cardId}`);
        const data = await res.json();
        setCard(data.card);
        
        // Charger le contenu de l'éditeur
        if (data.card.sections[0]?.content) {
          setEditorData(JSON.parse(data.card.sections[0].content));
        }
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCard();
  }, [cardId]);

  // Sauvegarder les modifications
  const handleSave = async () => {
    try {
      await fetch(`/api/knowledge-cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: [
            {
              id: card.sections[0].id,
              content: JSON.stringify(editorData),
            },
          ],
        }),
      });
      
      alert("Fiche sauvegardée !");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{card.title}</h1>
        <Button onClick={handleSave}>Enregistrer</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Éditeur principal */}
        <div className="lg:col-span-2">
          <div
            data-card-id={cardId}
            data-section-id={card.sections[0]?.id}
          >
            <EditorJSWrapper
              data={editorData}
              onChange={setEditorData}
              placeholder="Commencez à écrire..."
            />
          </div>
        </div>

        {/* Sidebar avec backlinks */}
        <div className="space-y-4">
          <Backlinks
            cardId={cardId}
            sectionId={card.sections[0]?.id}
          />
          
          {/* Ajoutez d'autres widgets ici */}
        </div>
      </div>
    </div>
  );
}
```

## Utilisation de la fonctionnalité

Une fois intégré, vos utilisateurs peuvent :

1. **Créer un lien** :
   - Sélectionner du texte dans l'éditeur
   - Cliquer sur l'icône "Lier à une fiche" dans la barre d'outils
   - Rechercher et sélectionner une fiche/section cible

2. **Naviguer** :
   - Cliquer sur un texte surligné pour accéder à la fiche liée

3. **Voir les connexions** :
   - Consulter le widget Backlinks pour voir :
     - Quelles fiches référencent la fiche actuelle
     - Quelles fiches sont référencées depuis la fiche actuelle

## Styles personnalisés

Si vous souhaitez personnaliser l'apparence des liens inline, modifiez le fichier `src/app/editorjs.css` :

```css
.inline-reference {
  /* Vos styles personnalisés */
  background-color: hsl(var(--your-color) / 0.1);
  color: hsl(var(--your-color));
}
```

## API disponibles

### Récupérer les liens d'une fiche

```typescript
const response = await fetch(
  `/api/inline-references?cardId=${cardId}&direction=both`
);
const { references } = await response.json();
```

### Créer un lien manuellement

```typescript
const response = await fetch("/api/inline-references", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sourceCardId: "uuid",
    targetCardId: "uuid",
    highlightedText: "texte",
  }),
});
```

### Supprimer un lien

```typescript
await fetch(`/api/inline-references?id=${linkId}`, {
  method: "DELETE",
});
```

## Dépannage

### Les liens ne se créent pas

Vérifiez que :
1. Le `data-card-id` est bien présent sur le wrapper de l'éditeur
2. L'utilisateur est authentifié
3. La console ne montre pas d'erreurs

### Les backlinks ne s'affichent pas

Vérifiez que :
1. Le composant Backlinks reçoit bien le cardId
2. L'API `/api/inline-references` est accessible
3. La migration Prisma a été appliquée

Pour toute autre question, consultez `INLINE_REFERENCES_GUIDE.md`.
