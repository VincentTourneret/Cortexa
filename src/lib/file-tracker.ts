import { watch, readFileSync, statSync, existsSync } from "fs";
import { join, relative, resolve } from "path";
import { writeFile, mkdir } from "fs/promises";

export interface FileEvent {
  path: string;
  type: "modified" | "read";
  timestamp: string;
  size?: number;
  mtime?: string;
}

export interface TrackingData {
  folder: string;
  lastModified: FileEvent[];
  lastRead: FileEvent[];
  startedAt: string;
  lastUpdated: string;
}

const MAX_EVENTS = 1000; // Limite d'événements à conserver

export class FileTracker {
  private folderPath: string;
  private trackingData: TrackingData;
  private watcher: ReturnType<typeof watch> | null = null;
  private storagePath: string;
  private readTrackingEnabled: boolean = false;

  constructor(folderPath: string, storagePath?: string) {
    this.folderPath = resolve(folderPath);
    this.storagePath = storagePath || join(this.folderPath, ".file-tracker.json");

    // Charger les données existantes ou créer de nouvelles
    this.trackingData = this.loadTrackingData();
  }

  /**
   * Charge les données de tracking depuis le fichier JSON
   */
  private loadTrackingData(): TrackingData {
    try {
      if (existsSync(this.storagePath)) {
        const data = readFileSync(this.storagePath, "utf-8");
        const parsed = JSON.parse(data) as TrackingData;
        
        // S'assurer que les tableaux existent
        parsed.lastModified = parsed.lastModified || [];
        parsed.lastRead = parsed.lastRead || [];
        
        return parsed;
      }
    } catch (error) {
      console.warn("Impossible de charger les données de tracking:", error);
    }

    return {
      folder: this.folderPath,
      lastModified: [],
      lastRead: [],
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Sauvegarde les données de tracking dans le fichier JSON
   */
  private async saveTrackingData(): Promise<void> {
    try {
      this.trackingData.lastUpdated = new Date().toISOString();
      
      // Limiter le nombre d'événements conservés
      if (this.trackingData.lastModified.length > MAX_EVENTS) {
        this.trackingData.lastModified = this.trackingData.lastModified.slice(-MAX_EVENTS);
      }
      if (this.trackingData.lastRead.length > MAX_EVENTS) {
        this.trackingData.lastRead = this.trackingData.lastRead.slice(-MAX_EVENTS);
      }

      // Créer le répertoire si nécessaire
      const dir = join(this.storagePath, "..");
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      await writeFile(this.storagePath, JSON.stringify(this.trackingData, null, 2), "utf-8");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des données de tracking:", error);
    }
  }

  /**
   * Enregistre un événement de modification
   */
  private async recordModification(filePath: string): Promise<void> {
    try {
      const relativePath = relative(this.folderPath, filePath);
      const stats = existsSync(filePath) ? statSync(filePath) : null;

      const event: FileEvent = {
        path: relativePath,
        type: "modified",
        timestamp: new Date().toISOString(),
        size: stats?.size,
        mtime: stats?.mtime.toISOString(),
      };

      this.trackingData.lastModified.push(event);
      
      // Garder seulement les 100 derniers événements en mémoire
      if (this.trackingData.lastModified.length > MAX_EVENTS) {
        this.trackingData.lastModified.shift();
      }

      await this.saveTrackingData();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la modification:", error);
    }
  }

  /**
   * Enregistre un événement de lecture
   */
  async recordRead(filePath: string): Promise<void> {
    if (!this.readTrackingEnabled) return;

    try {
      const relativePath = relative(this.folderPath, filePath);
      const stats = existsSync(filePath) ? statSync(filePath) : null;

      const event: FileEvent = {
        path: relativePath,
        type: "read",
        timestamp: new Date().toISOString(),
        size: stats?.size,
        mtime: stats?.mtime.toISOString(),
      };

      this.trackingData.lastRead.push(event);
      
      // Garder seulement les 100 derniers événements en mémoire
      if (this.trackingData.lastRead.length > MAX_EVENTS) {
        this.trackingData.lastRead.shift();
      }

      await this.saveTrackingData();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la lecture:", error);
    }
  }

  /**
   * Démarre la surveillance du dossier
   */
  start(options: { watchReads?: boolean } = {}): void {
    if (this.watcher) {
      console.log("Le tracking est déjà actif");
      return;
    }

    this.readTrackingEnabled = options.watchReads || false;

    console.log(`Démarrage du tracking pour: ${this.folderPath}`);
    console.log(`Données sauvegardées dans: ${this.storagePath}`);

    try {
      this.watcher = watch(
        this.folderPath,
        { recursive: true },
        async (eventType, filename) => {
          if (!filename) return;

          const fullPath = join(this.folderPath, filename);

          if (eventType === "change" || eventType === "rename") {
            await this.recordModification(fullPath);
            console.log(`[${new Date().toLocaleTimeString()}] Modifié: ${filename}`);
          }
        }
      );

      console.log("✅ Tracking des modifications activé");
      if (this.readTrackingEnabled) {
        console.log("✅ Tracking des lectures activé");
      }
    } catch (error) {
      console.error("Erreur lors du démarrage du tracking:", error);
    }
  }

  /**
   * Arrête la surveillance
   */
  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log("Tracking arrêté");
    }
  }

  /**
   * Récupère les dernières modifications
   */
  getLastModified(limit: number = 10): FileEvent[] {
    return this.trackingData.lastModified.slice(-limit).reverse();
  }

  /**
   * Récupère les dernières lectures
   */
  getLastRead(limit: number = 10): FileEvent[] {
    return this.trackingData.lastRead.slice(-limit).reverse();
  }

  /**
   * Récupère toutes les données de tracking
   */
  getTrackingData(): TrackingData {
    return { ...this.trackingData };
  }

  /**
   * Réinitialise les données de tracking
   */
  async reset(): Promise<void> {
    this.trackingData = {
      folder: this.folderPath,
      lastModified: [],
      lastRead: [],
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    await this.saveTrackingData();
    console.log("Données de tracking réinitialisées");
  }
}
