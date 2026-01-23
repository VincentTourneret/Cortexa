# Guide de débogage pour l'éditeur

## Étape 1: Vérifier les erreurs dans la console

1. Ouvrez Chrome/Firefox
2. Allez sur une page avec une fiche
3. Appuyez sur F12 pour ouvrir les DevTools
4. Cliquez sur l'onglet "Console"
5. Notez toutes les erreurs en rouge

## Étape 2: Erreurs potentielles et solutions

### Erreur: "Cannot read property 'default' of undefined"

**Cause**: Le ReferenceTool ne s'importe pas correctement

**Solution**:
```bash
# Vérifier que le fichier existe
ls -la src/components/editor/tools/ReferenceTool.ts

# Nettoyer et rebuild
rm -rf .next
bun dev
```

### Erreur: "ReferenceModal is not defined"

**Cause**: Problème d'import du composant modal

**Solution**: Vérifier que le fichier existe
```bash
ls -la src/components/editor/ReferenceModal.tsx
```

### Erreur: Types TypeScript

**Solution**: Relancer la génération de types
```bash
bun prisma generate
```

## Étape 3: Tester le ReferenceTool isolément

Si l'erreur persiste, commentez temporairement le ReferenceTool dans EditorJSWrapper.tsx:

```typescript
// Dans src/components/editor/EditorJSWrapper.tsx
// Commentez ces lignes:
/*
{ default: ReferenceTool },
...
import("./tools/ReferenceTool"),
...
reference: {
  class: ReferenceTool,
  config: {
    searchEndpoint: "/api/search",
  },
},
*/
```

Puis redémarrez le serveur et testez si l'éditeur se charge sans le bloc référence.

## Étape 4: Activer les logs de débogage

Ajoutez ceci temporairement dans EditorJSWrapper.tsx ligne 87 (avant `const editor = new EditorJS`):

```typescript
console.log('Initializing EditorJS with ReferenceTool:', { 
  hasReferenceTool: !!ReferenceTool,
  referenceToolName: ReferenceTool?.name 
});
```

## Étape 5: Vérifier les dépendances

```bash
# Vérifier que tous les packages Editor.js sont installés
bun pm ls | grep editorjs

# Réinstaller si nécessaire
bun install
```

## Erreurs connues

### "Erreur lors du chargement de l'éditeur" générique

Cela peut venir de:
1. Un import qui échoue (voir console pour le détail)
2. Un problème de configuration Editor.js
3. Une erreur de syntaxe dans un des tools

### Erreur de type "Class constructor cannot be invoked without 'new'"

Solution: Vérifier que ReferenceTool est bien une classe et pas une fonction.

## Dernière vérification: Serveur

Assurez-vous que le serveur tourne correctement:
```bash
# Tuer tous les processus Next.js
pkill -f "next dev"

# Nettoyer
rm -rf .next/dev/lock

# Redémarrer
bun dev
```

## Aide supplémentaire

Si le problème persiste:
1. Partagez le message d'erreur exact de la console
2. Partagez la version de Next.js: `bun pm ls next`
3. Vérifiez les permissions des fichiers: `ls -la src/components/editor/tools/`
