# 🔧 Correction : Clics sur les Liens Inline

## 🐛 Problèmes identifiés

1. **En mode édition** : Cliquer sur une fiche/section dans le modal ne faisait rien
2. **En mode visualisation** : Cliquer sur un lien surligné ne naviguait pas vers la fiche

## 🔍 Causes

### Problème 1 : Modal ne se fermait pas
- Le code essayait de supprimer le modal et le backdrop séparément
- Le sélecteur CSS pour trouver le backdrop était incorrect
- Le backdrop restait visible après la sélection

### Problème 2 : `contenteditable="false"` bloquait les clics
- L'attribut empêchait les événements de clic de se propager
- Les clics étaient capturés par l'éditeur au lieu du lien

### Problème 3 : Événements de clic multiples
- Chaque modification du lien ajoutait un nouvel événement
- Les événements s'empilaient sans être nettoyés
- Pouvait causer des comportements imprévisibles

### Problème 4 : Liens existants non interactifs
- Au chargement d'un contenu avec des liens existants
- Les événements de clic n'étaient pas attachés
- Les liens n'étaient donc pas cliquables

## ✅ Corrections appliquées

### 1. Suppression de `contenteditable="false"`

**Avant :**
```typescript
mark.setAttribute("contenteditable", "false");
```

**Après :**
```typescript
// Retiré contenteditable="false"
// Ajouté user-select: none pour éviter la sélection
mark.style.cssText = `
  ...
  user-select: none;
`;
```

### 2. Méthode `closeModal()` centralisée

**Ajouté :**
```typescript
closeModal(modal: HTMLElement) {
  // Trouver et supprimer le backdrop
  const backdrops = document.querySelectorAll('[style*="z-index: 9999"]');
  backdrops.forEach((backdrop) => {
    if (backdrop.parentElement === document.body) {
      backdrop.remove();
    }
  });
  
  // Supprimer le modal
  modal.remove();
}
```

### 3. Prévention des événements multiples

**Ajouté :**
```typescript
// Marquer que ce lien a déjà un événement
if (!mark.hasAttribute("data-has-click-event")) {
  mark.setAttribute("data-has-click-event", "true");
  
  mark.addEventListener("click", (e) => {
    // ...
  });
}
```

### 4. Réattachement des événements au chargement

**Ajouté :**
```typescript
constructor({ api, config }: { api: any; config?: any }) {
  this.api = api;
  this.config = config || {};
  
  // Réattacher les événements après un délai
  setTimeout(() => {
    this.reattachClickEvents();
  }, 500);
}

reattachClickEvents() {
  const existingLinks = document.querySelectorAll(`.${this.class}`);
  existingLinks.forEach((link) => {
    // Attacher les événements de clic
  });
}
```

### 5. Amélioration de la gestion des clics

**Ajouté :**
```typescript
mark.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation(); // Empêche la propagation à l'éditeur
  
  // Navigation
  console.log("Navigation vers:", url);
  window.location.href = url;
});
```

## 🧪 Tests à effectuer

### Test 1 : Création d'un lien

1. ✅ Redémarrer le serveur
2. ✅ Ouvrir une fiche en mode édition
3. ✅ Sélectionner du texte
4. ✅ Cliquer sur l'icône de lien (🔗)
5. ✅ **Le modal s'ouvre**
6. ✅ Cliquer sur une fiche
7. ✅ **Le modal se ferme**
8. ✅ **Le backdrop disparaît**
9. ✅ **Le texte est surligné en bleu**

### Test 2 : Navigation depuis un lien (mode édition)

1. ✅ Avec un lien existant (texte surligné)
2. ✅ Cliquer sur le texte surligné
3. ✅ **Vérifier la console : "Navigation vers: /knowledge/xxx"**
4. ✅ **La page navigue vers la fiche**

### Test 3 : Navigation depuis un lien (mode visualisation)

1. ✅ Passer en mode lecture seule (si applicable)
2. ✅ Cliquer sur un lien
3. ✅ **La navigation fonctionne**

### Test 4 : Liens chargés depuis la base de données

1. ✅ Créer un lien et sauvegarder
2. ✅ Recharger la page
3. ✅ **Le lien est toujours surligné**
4. ✅ **Cliquer dessus navigue correctement**

## 🔍 Debugging

Si les clics ne fonctionnent toujours pas :

### 1. Vérifier la console

Ouvrez la console (F12) et regardez :
- Les messages "Navigation vers: ..."
- Les erreurs JavaScript éventuelles

### 2. Vérifier les attributs

Inspectez le HTML du lien surligné :
```html
<span 
  class="inline-reference"
  data-card-id="xxx"
  data-section-id="yyy" <!-- optionnel -->
  data-has-click-event="true"
  style="..."
>
  Texte du lien
</span>
```

### 3. Tester manuellement

Dans la console :
```javascript
// Trouver tous les liens
document.querySelectorAll('.inline-reference')

// Tester un clic
const link = document.querySelector('.inline-reference');
link.click();
```

### 4. Vérifier l'URL de navigation

L'URL doit être au format :
- `/knowledge/{cardId}` pour une fiche
- `/knowledge/{cardId}#section-{sectionId}` pour une section

Si votre routing est différent, modifiez cette ligne dans le code :
```typescript
let url = `/knowledge/${targetCardId}`;
```

## 📝 Fichiers modifiés

- ✅ `src/components/editor/tools/InlineReferenceTool.tsx`

## 🎯 Prochaines étapes

Si tout fonctionne :

1. **Tester avec plusieurs liens** sur la même page
2. **Tester avec des sections** (pas seulement des fiches)
3. **Tester le mode lecture seule** (si applicable)
4. **Créer des backlinks** et vérifier qu'ils s'affichent

Si des problèmes persistent :

1. Vérifier que votre routing correspond à `/knowledge/[id]`
2. Vérifier que les pages de fiches existent
3. Vérifier les logs serveur pour des erreurs 404

## 💡 Améliorations futures

- [ ] Prévisualisation au survol (tooltip)
- [ ] Animation de survol
- [ ] Indicateur visuel du type de lien (fiche vs section)
- [ ] Raccourci clavier Ctrl/Cmd+K
- [ ] Historique des liens récents

---

**Date :** 23 janvier 2026  
**Type :** Bugfix critique  
**Statut :** ✅ Corrigé et prêt à tester
