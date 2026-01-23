# 🚀 Démarrage Rapide - Liens Inline

## Étape 1 : Vérifier l'installation (✅ Déjà fait)

La migration a déjà été appliquée et tout est configuré. Vous pouvez passer directement à l'étape 2.

Si vous voulez vérifier :
```bash
npx prisma studio
# Vérifiez que la table "inline_references" existe
```

## Étape 2 : Intégrer dans une page de fiche

### Exemple minimal

Modifiez votre page de fiche (par exemple `src/app/knowledge/[id]/page.tsx`) :

```tsx
"use client";

import { EditorJSWrapper } from "@/components/editor/EditorJSWrapper";
import { Backlinks } from "@/components/editor/Backlinks";

export default function KnowledgeCardPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState(/* vos données */);
  
  return (
    <div className="container mx-auto p-4">
      {/* Layout avec sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Éditeur principal - AJOUTEZ data-card-id */}
        <div className="lg:col-span-2">
          <div data-card-id={params.id}>
            <EditorJSWrapper
              data={data}
              onChange={setData}
            />
          </div>
        </div>
        
        {/* Sidebar - AJOUTEZ le composant Backlinks */}
        <div className="space-y-4">
          <Backlinks cardId={params.id} />
          {/* Autres widgets... */}
        </div>
        
      </div>
    </div>
  );
}
```

**Important :**
1. ✅ Ajouter `data-card-id={params.id}` sur le wrapper de l'éditeur
2. ✅ Ajouter `<Backlinks cardId={params.id} />` dans la sidebar

## Étape 3 : Tester

1. **Démarrer le serveur**
   ```bash
   npm run dev
   ```

2. **Créer votre premier lien**
   - Ouvrez une fiche
   - Sélectionnez du texte
   - Cliquez sur l'icône "🔗" dans la toolbar
   - Recherchez une autre fiche
   - Cliquez dessus

3. **Vérifier le lien**
   - Le texte est maintenant surligné en bleu
   - Cliquez dessus → vous êtes redirigé vers l'autre fiche
   - Dans l'autre fiche, le widget Backlinks affiche le lien

## C'est tout ! 🎉

Vous avez maintenant des liens bidirectionnels entre vos fiches.

## Commandes utiles

```bash
# Voir la base de données
npx prisma studio

# Recréer la migration (si problème)
npx prisma migrate reset
npx prisma migrate dev --name add_inline_references

# Générer le client Prisma
npx prisma generate
```

## Documentation complète

- **[INLINE_REFERENCES_README.md](./INLINE_REFERENCES_README.md)** - Vue d'ensemble
- **[INLINE_REFERENCES_INTEGRATION.md](./INLINE_REFERENCES_INTEGRATION.md)** - Exemples détaillés
- **[INLINE_REFERENCES_GUIDE.md](./INLINE_REFERENCES_GUIDE.md)** - Guide technique

## Support

Des questions ? Consultez d'abord les fichiers de documentation ci-dessus.

---

**Temps d'intégration estimé :** 10-15 minutes  
**Difficulté :** ⭐⭐ (Facile)
