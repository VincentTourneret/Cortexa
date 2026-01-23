# ✨ Tooltip au Survol des Liens Inline

## 📝 Fonctionnalité

Lorsque vous survolez un lien inline (texte surligné), un tooltip s'affiche automatiquement pour vous indiquer :

- **Nom de la fiche** seul, si le lien pointe vers une fiche complète
- **Nom de la fiche → Nom de la section**, si le lien pointe vers une section spécifique

## 🎨 Apparence

Le tooltip affiche :
- 📄 Icône de document
- **Nom de la fiche** en texte normal
- → Flèche (si section)
- **Nom de la section** (si applicable)

### Exemples visuels

**Lien vers une fiche :**
```
┌─────────────────────┐
│ 📄 Ma fiche         │
└─────────────────────┘
```

**Lien vers une section :**
```
┌──────────────────────────────────┐
│ 📄 Ma fiche → Ma section         │
└──────────────────────────────────┘
```

## 🔧 Implémentation technique

### 1. Stockage des informations

Les titres sont stockés dans des attributs `data-*` sur chaque lien :

```html
<span 
  class="inline-reference"
  data-card-id="uuid"
  data-section-id="uuid"
  data-card-title="Nom de la fiche"
  data-section-title="Nom de la section"
  data-has-click-event="true"
>
  Texte du lien
</span>
```

### 2. Événements

Deux événements sont attachés à chaque lien :

- **`mouseenter`** : Crée et affiche le tooltip
- **`mouseleave`** : Supprime le tooltip

### 3. Positionnement intelligent

Le tooltip se positionne automatiquement :
- **Par défaut** : En dessous du lien, centré
- **Si pas de place en bas** : Au-dessus du lien
- **Si sort de l'écran** : Ajuste la position horizontale

### 4. Style

Le tooltip utilise les variables CSS du thème :
```css
background: hsl(var(--popover));
color: hsl(var(--popover-foreground));
border: 1px solid hsl(var(--border));
```

Compatible avec les thèmes dark/light.

## ✅ Ce qui a été modifié

### Fichier : `src/components/editor/tools/InlineReferenceTool.tsx`

#### 1. Méthode `selectReference()` étendue

**Avant :**
```typescript
selectReference(mark: HTMLElement, cardId: string, sectionId?: string)
```

**Après :**
```typescript
selectReference(
  mark: HTMLElement, 
  cardId: string, 
  sectionId?: string, 
  cardTitle?: string,      // NOUVEAU
  sectionTitle?: string    // NOUVEAU
)
```

#### 2. Nouvelle méthode `attachTooltipEvents()`

Crée et gère le tooltip :
- Création du tooltip au survol
- Positionnement intelligent
- Animation fade-in
- Suppression au départ de la souris

#### 3. Méthode `reattachClickEvents()` mise à jour

Maintenant elle attache aussi les événements de tooltip aux liens existants.

#### 4. Méthode `sanitize()` mise à jour

Autorise les nouveaux attributs :
- `data-card-title`
- `data-section-title`

#### 5. Appels mis à jour

Les clics sur les fiches/sections passent maintenant les titres :
```typescript
// Pour une fiche
this.selectReference(mark, card.id, undefined, card.title);

// Pour une section
this.selectReference(mark, card.id, sectionId, card.title, section.title);
```

## 🧪 Test

### Test 1 : Nouveau lien

1. Créez un nouveau lien
2. Survolez le texte surligné
3. ✅ Le tooltip doit s'afficher avec le nom de la fiche

### Test 2 : Lien vers section

1. Créez un lien vers une section spécifique
2. Survolez le lien
3. ✅ Le tooltip doit afficher "Fiche → Section"

### Test 3 : Positionnement

1. Créez un lien en haut de page
2. Survolez → tooltip en dessous
3. Créez un lien en bas de page
4. Survolez → tooltip au-dessus

### Test 4 : Liens existants

⚠️ **Note** : Les liens créés avant cette mise à jour n'auront pas de tooltip car ils n'ont pas les attributs `data-card-title` et `data-section-title`.

**Solution pour les anciens liens** :
- Ils restent cliquables et fonctionnels
- Pour avoir le tooltip, il faut les recréer
- Ou implémenter une récupération automatique via API (amélioration future)

## 💡 Améliorations futures possibles

### Court terme
- [ ] Récupérer les titres via API pour les anciens liens
- [ ] Ajouter un délai avant d'afficher le tooltip (éviter l'affichage accidentel)
- [ ] Ajouter une animation de transition plus fluide

### Moyen terme
- [ ] Afficher un aperçu du contenu de la fiche dans le tooltip
- [ ] Afficher la date de dernière modification
- [ ] Afficher le nombre de liens vers cette fiche
- [ ] Ajouter un bouton "Ouvrir dans un nouvel onglet"

### Long terme
- [ ] Tooltip avec prévisualisation riche (image, résumé, etc.)
- [ ] Statistiques dans le tooltip (nombre de backlinks)
- [ ] Actions rapides (éditer, supprimer le lien)

## 🎨 Personnalisation

### Modifier le style du tooltip

Dans le code, modifiez les styles CSS inline dans `attachTooltipEvents()` :

```typescript
tooltip.style.cssText = `
  /* Vos styles personnalisés */
  background: #yourcolor;
  color: #yourcolor;
  ...
`;
```

### Modifier le contenu du tooltip

Dans `attachTooltipEvents()`, modifiez le innerHTML :

```typescript
if (sectionTitle) {
  tooltip.innerHTML = `
    <div>
      <!-- Votre contenu personnalisé -->
    </div>
  `;
}
```

### Modifier la position

Ajustez les calculs dans `attachTooltipEvents()` :

```typescript
// Position par défaut
let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
let top = rect.bottom + 8; // 8px en dessous

// Modifiez ces valeurs selon vos besoins
```

## 🐛 Dépannage

### Le tooltip ne s'affiche pas

**Vérifications :**
1. Le lien a-t-il les attributs `data-card-title` ?
   ```javascript
   // Dans la console
   document.querySelector('.inline-reference').getAttribute('data-card-title')
   ```
2. Les événements sont-ils attachés ?
   ```javascript
   // Devrait retourner "true"
   document.querySelector('.inline-reference').getAttribute('data-has-click-event')
   ```

### Le tooltip est mal positionné

- Vérifiez que le parent n'a pas de `position: relative` qui interfère
- Ajustez les calculs de position dans le code

### Le tooltip reste visible

- Assurez-vous que l'événement `mouseleave` est bien déclenché
- Vérifiez la console pour des erreurs JavaScript

## 📊 Statistiques

**Lignes de code ajoutées :** ~150  
**Nouvelles méthodes :** 1 (`attachTooltipEvents`)  
**Méthodes modifiées :** 3 (`selectReference`, `reattachClickEvents`, `sanitize`)  
**Nouveaux attributs HTML :** 2 (`data-card-title`, `data-section-title`)

---

**Date :** 23 janvier 2026  
**Type :** Feature  
**Statut :** ✅ Implémenté et prêt à tester
