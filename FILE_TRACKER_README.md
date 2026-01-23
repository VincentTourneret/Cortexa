# Système de Tracking des Fichiers

Ce système permet de sauvegarder et suivre les dernières modifications et lectures de fichiers dans un dossier.

## Fonctionnalités

- ✅ **Tracking des modifications** : Surveille automatiquement tous les changements de fichiers dans un dossier
- ✅ **Tracking des lectures** : Optionnel, peut enregistrer les lectures de fichiers
- ✅ **Sauvegarde automatique** : Les données sont sauvegardées dans un fichier JSON
- ✅ **Historique** : Conserve jusqu'à 1000 événements (modifications et lectures)
- ✅ **CLI simple** : Interface en ligne de commande facile à utiliser

## Installation

Le système est déjà intégré au projet. Aucune installation supplémentaire n'est nécessaire.

## Utilisation

### Démarrer le tracking d'un dossier

```bash
# Tracking basique (modifications uniquement)
bun run track ./src

# Tracking avec lectures de fichiers
bun run track ./src --watch-reads

# Spécifier un chemin de sauvegarde personnalisé
bun run track ./src --storage ./data/tracking.json
```

### Afficher les statistiques

```bash
# Afficher les 10 derniers événements (défaut)
bun run track ./src --show

# Afficher les 20 derniers événements
bun run track ./src --show --limit 20
```

### Réinitialiser les données

```bash
bun run track ./src --reset
```

## Format des données

Les données sont sauvegardées dans un fichier `.file-tracker.json` à la racine du dossier surveillé (ou au chemin spécifié).

### Structure du fichier JSON

```json
{
  "folder": "/chemin/vers/le/dossier",
  "startedAt": "2026-01-23T10:00:00.000Z",
  "lastUpdated": "2026-01-23T15:30:00.000Z",
  "lastModified": [
    {
      "path": "src/components/Button.tsx",
      "type": "modified",
      "timestamp": "2026-01-23T15:30:00.000Z",
      "size": 1234,
      "mtime": "2026-01-23T15:30:00.000Z"
    }
  ],
  "lastRead": [
    {
      "path": "src/lib/utils.ts",
      "type": "read",
      "timestamp": "2026-01-23T15:25:00.000Z",
      "size": 567,
      "mtime": "2026-01-23T15:20:00.000Z"
    }
  ]
}
```

## Utilisation programmatique

Vous pouvez également utiliser le tracker dans votre code TypeScript :

```typescript
import { FileTracker } from "@/lib/file-tracker";

// Créer une instance
const tracker = new FileTracker("./src");

// Démarrer le tracking
tracker.start({ watchReads: true });

// Enregistrer manuellement une lecture
await tracker.recordRead("./src/components/Button.tsx");

// Récupérer les dernières modifications
const lastModified = tracker.getLastModified(10);

// Récupérer les dernières lectures
const lastRead = tracker.getLastRead(10);

// Arrêter le tracking
tracker.stop();
```

## Options disponibles

### Options CLI

- `--watch-reads` : Active le tracking des lectures de fichiers
- `--storage <path>` : Spécifie un chemin personnalisé pour le fichier de sauvegarde
- `--reset` : Réinitialise les données de tracking existantes
- `--show` : Affiche les dernières modifications et lectures
- `--limit <n>` : Nombre d'événements à afficher (défaut: 10)

### Options programmatiques

```typescript
tracker.start({
  watchReads: boolean  // Activer le tracking des lectures (défaut: false)
});
```

## Limitations

- Le système surveille uniquement les modifications de fichiers, pas les suppressions
- Le tracking des lectures nécessite d'appeler manuellement `recordRead()` ou d'activer `--watch-reads`
- Maximum de 1000 événements conservés par type (modifications/lectures)
- Le fichier de tracking est créé dans le dossier surveillé (ou au chemin spécifié)

## Exemples d'utilisation

### Exemple 1 : Tracking du dossier src pendant le développement

```bash
# Terminal 1 : Démarrer le tracking
bun run track ./src --watch-reads

# Terminal 2 : Travailler normalement sur votre code
# Toutes les modifications et lectures seront automatiquement enregistrées
```

### Exemple 2 : Vérifier les fichiers modifiés récemment

```bash
# Afficher les 20 derniers fichiers modifiés
bun run track ./src --show --limit 20
```

### Exemple 3 : Intégration dans un workflow CI/CD

```typescript
import { FileTracker } from "@/lib/file-tracker";

async function trackBuildChanges() {
  const tracker = new FileTracker("./src");
  const data = tracker.getTrackingData();
  
  console.log(`Fichiers modifiés depuis le dernier build: ${data.lastModified.length}`);
  
  // Envoyer les statistiques à votre système de monitoring
  // ...
}
```

## Notes importantes

- Le fichier `.file-tracker.json` contient des métadonnées sensibles (chemins de fichiers, timestamps). Ne le commitez pas dans Git si nécessaire.
- Le tracking fonctionne en temps réel et peut avoir un léger impact sur les performances pour les dossiers très volumineux.
- Pour arrêter le tracking, utilisez `Ctrl+C` dans le terminal.

## Dépannage

### Le tracking ne démarre pas

Vérifiez que :
- Le chemin du dossier est correct
- Vous avez les permissions de lecture/écriture sur le dossier
- Le dossier existe

### Les modifications ne sont pas enregistrées

- Vérifiez que le processus de tracking est toujours actif
- Vérifiez les permissions d'écriture sur le fichier `.file-tracker.json`
- Consultez les logs dans la console

### Le fichier de tracking est trop volumineux

Le système limite automatiquement à 1000 événements par type. Vous pouvez :
- Réinitialiser avec `--reset`
- Modifier la constante `MAX_EVENTS` dans `src/lib/file-tracker.ts`
