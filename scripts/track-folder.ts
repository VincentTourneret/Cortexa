#!/usr/bin/env node

import { FileTracker } from "../src/lib/file-tracker";
import { resolve } from "path";
import { existsSync } from "fs";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Usage: bun run scripts/track-folder.ts <dossier> [options]

Options:
  --watch-reads    Activer le tracking des lectures de fichiers
  --storage <path> Chemin personnalisé pour le fichier de sauvegarde
  --reset          Réinitialiser les données de tracking existantes
  --show           Afficher les dernières modifications et lectures
  --limit <n>      Nombre d'événements à afficher (défaut: 10)

Exemples:
  bun run scripts/track-folder.ts ./src
  bun run scripts/track-folder.ts ./src --watch-reads
  bun run scripts/track-folder.ts ./src --show --limit 20
  bun run scripts/track-folder.ts ./src --reset
`);
  process.exit(1);
}

const folderPath = resolve(args[0]);

if (!existsSync(folderPath)) {
  console.error(`❌ Le dossier n'existe pas: ${folderPath}`);
  process.exit(1);
}

const tracker = new FileTracker(
  folderPath,
  args.includes("--storage") 
    ? resolve(args[args.indexOf("--storage") + 1])
    : undefined
);

// Gérer les options
if (args.includes("--reset")) {
  tracker.reset().then(() => {
    console.log("✅ Données réinitialisées");
    process.exit(0);
  });
} else if (args.includes("--show")) {
  const limit = args.includes("--limit")
    ? parseInt(args[args.indexOf("--limit") + 1], 10) || 10
    : 10;

  const data = tracker.getTrackingData();
  
  console.log("\n📊 Statistiques de tracking");
  console.log("=" .repeat(50));
  console.log(`Dossier: ${data.folder}`);
  console.log(`Démarré le: ${new Date(data.startedAt).toLocaleString()}`);
  console.log(`Dernière mise à jour: ${new Date(data.lastUpdated).toLocaleString()}`);
  console.log(`Total modifications: ${data.lastModified.length}`);
  console.log(`Total lectures: ${data.lastRead.length}`);

  if (data.lastModified.length > 0) {
    console.log("\n📝 Dernières modifications:");
    console.log("-".repeat(50));
    tracker.getLastModified(limit).forEach((event, index) => {
      console.log(
        `${index + 1}. [${new Date(event.timestamp).toLocaleString()}] ${event.path}`
      );
      if (event.size) {
        console.log(`   Taille: ${event.size} bytes`);
      }
    });
  }

  if (data.lastRead.length > 0) {
    console.log("\n👁️  Dernières lectures:");
    console.log("-".repeat(50));
    tracker.getLastRead(limit).forEach((event, index) => {
      console.log(
        `${index + 1}. [${new Date(event.timestamp).toLocaleString()}] ${event.path}`
      );
    });
  }

  console.log("\n");
  process.exit(0);
} else {
  // Démarrer le tracking
  const watchReads = args.includes("--watch-reads");
  
  tracker.start({ watchReads });

  // Gérer l'arrêt propre
  process.on("SIGINT", () => {
    console.log("\n\nArrêt du tracking...");
    tracker.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n\nArrêt du tracking...");
    tracker.stop();
    process.exit(0);
  });

  // Garder le processus actif
  console.log("\nAppuyez sur Ctrl+C pour arrêter le tracking\n");
}
