/**
 * Reference Tool for Editor.js
 * Permet de créer des liens vers des fiches ou sections de fiches
 */

import type { ReferenceData, ReferenceToolConfig, SearchResult } from "@/types/reference";
import api from "@/lib/axios";

// Type global pour notre instance de modal
declare global {
  interface Window {
    openReferenceModal?: (cardId: string, sectionId?: string) => void;
  }
}

export default class ReferenceTool {
  static title = "Référence";

  private api: any;
  private block: any;
  private config: ReferenceToolConfig;
  private data: ReferenceData | null;
  private wrapper: HTMLElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private searchTimeout: NodeJS.Timeout | null = null;
  private abortController: AbortController | null = null;

  static get toolbox() {
    return {
      title: "Référence",
      icon: '<svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 11.5L3.5 7.5L7.5 3.5M9.5 3.5L13.5 7.5L9.5 11.5M3.5 7.5H13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ data, api, block, config, readOnly }: any) {
    this.api = api;
    this.block = block;
    this.config = config || {};
    this.data = data && Object.keys(data).length > 0 ? data : null;
    this.readOnly = readOnly || false;
  }

  private readOnly: boolean;

  render(): HTMLElement {
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("reference-tool-wrapper");

    if (this.data) {
      this.renderSavedReference();
    } else if (!this.readOnly) {
      this.renderSearchInterface();
    } else {
      // En mode lecture seule sans données, ne rien afficher
      this.wrapper.innerHTML = "";
    }

    return this.wrapper;
  }

  /**
   * Affiche une référence sauvegardée
   */
  private renderSavedReference(): void {
    if (!this.wrapper || !this.data) return;

    const container = document.createElement("div");
    container.classList.add("reference-display");
    container.style.cssText = `
      position: relative;
      padding: 16px 20px;
      border: 2px solid hsl(var(--border));
      border-left: 4px solid hsl(var(--primary));
      border-radius: 8px;
      background: hsl(var(--card));
      cursor: pointer;
      transition: all 0.2s ease;
      margin: 8px 0;
    `;

    // Badge pour le type
    const badge = document.createElement("span");
    badge.textContent = this.data.type === "card" ? "Fiche" : "Section";
    badge.style.cssText = `
      display: inline-block;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: 4px;
      background: ${this.data.type === "card" ? "hsl(var(--primary))" : "hsl(var(--secondary))"};
      color: ${this.data.type === "card" ? "hsl(var(--primary-foreground))" : "hsl(var(--secondary-foreground))"};
      margin-bottom: 8px;
    `;

    // Icône et titre
    const titleContainer = document.createElement("div");
    titleContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
    `;

    const icon = document.createElement("span");
    icon.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 12L4 8L8 4M12 4L16 8L12 12M4 8H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    icon.style.cssText = `
      display: flex;
      align-items: center;
      color: hsl(var(--primary));
      flex-shrink: 0;
    `;

    const title = document.createElement("div");
    title.style.cssText = `
      flex: 1;
    `;

    const titleText = document.createElement("div");
    titleText.textContent = this.data.title;
    titleText.style.cssText = `
      font-size: 15px;
      font-weight: 600;
      color: hsl(var(--foreground));
      margin-bottom: 2px;
    `;

    title.appendChild(titleText);

    // Si c'est une section, afficher aussi le titre de la fiche parente
    if (this.data.type === "section" && this.data.cardTitle) {
      const cardTitle = document.createElement("div");
      cardTitle.textContent = `De la fiche : ${this.data.cardTitle}`;
      cardTitle.style.cssText = `
        font-size: 13px;
        color: hsl(var(--muted-foreground));
      `;
      title.appendChild(cardTitle);
    }

    titleContainer.appendChild(icon);
    titleContainer.appendChild(title);

    // Bouton pour supprimer/modifier (en mode édition seulement)
    if (!this.readOnly) {
      const editButton = document.createElement("button");
      editButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L14 4L8 10L6 11L7 9L13 3M2 14H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      editButton.title = "Modifier la référence";
      editButton.style.cssText = `
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 6px;
        background: hsl(var(--muted));
        border: 1px solid hsl(var(--border));
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
        color: hsl(var(--muted-foreground));
      `;

      editButton.addEventListener("mouseenter", () => {
        editButton.style.background = "hsl(var(--accent))";
      });

      editButton.addEventListener("mouseleave", () => {
        editButton.style.background = "hsl(var(--muted))";
      });

      editButton.addEventListener("click", (e) => {
        e.stopPropagation();
        this.data = null;
        if (this.wrapper) {
          this.wrapper.innerHTML = "";
          this.renderSearchInterface();
        }
      });

      container.appendChild(editButton);
    }

    // Hover effect
    container.addEventListener("mouseenter", () => {
      container.style.borderColor = "hsl(var(--primary))";
      container.style.background = "hsl(var(--accent))";
    });

    container.addEventListener("mouseleave", () => {
      container.style.borderColor = "hsl(var(--border))";
      container.style.background = "hsl(var(--card))";
    });

    // Click pour ouvrir la modal
    container.addEventListener("click", () => {
      if (this.data && typeof window.openReferenceModal === "function") {
        window.openReferenceModal(this.data.cardId, this.data.sectionId);
      }
    });

    container.appendChild(badge);
    container.appendChild(titleContainer);

    this.wrapper.innerHTML = "";
    this.wrapper.appendChild(container);
  }

  /**
   * Affiche l'interface de recherche
   */
  private renderSearchInterface(): void {
    if (!this.wrapper) return;

    const container = document.createElement("div");
    container.classList.add("reference-search");
    container.style.cssText = `
      padding: 16px;
      border: 2px dashed hsl(var(--border));
      border-radius: 8px;
      background: hsl(var(--muted) / 0.3);
      margin: 8px 0;
    `;

    // Label
    const label = document.createElement("label");
    label.textContent = "Rechercher une fiche ou section :";
    label.style.cssText = `
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: hsl(var(--foreground));
      margin-bottom: 8px;
    `;

    // Input de recherche
    this.searchInput = document.createElement("input");
    this.searchInput.type = "text";
    this.searchInput.placeholder = "Tapez pour rechercher...";
    this.searchInput.style.cssText = `
      width: 100%;
      padding: 10px 12px;
      font-size: 14px;
      border: 1px solid hsl(var(--border));
      border-radius: 6px;
      background: hsl(var(--background));
      color: hsl(var(--foreground));
      outline: none;
      transition: border-color 0.2s;
    `;

    this.searchInput.addEventListener("focus", () => {
      if (this.searchInput) {
        this.searchInput.style.borderColor = "hsl(var(--primary))";
      }
    });

    this.searchInput.addEventListener("blur", () => {
      if (this.searchInput) {
        this.searchInput.style.borderColor = "hsl(var(--border))";
      }
    });

    // Conteneur pour les résultats
    const resultsContainer = document.createElement("div");
    resultsContainer.classList.add("reference-results");
    resultsContainer.style.cssText = `
      margin-top: 12px;
      display: none;
    `;

    // Event listener pour la recherche
    this.searchInput.addEventListener("input", (e) => {
      const query = (e.target as HTMLInputElement).value.trim();
      this.handleSearch(query, resultsContainer);
    });

    container.appendChild(label);
    container.appendChild(this.searchInput);
    container.appendChild(resultsContainer);

    this.wrapper.innerHTML = "";
    this.wrapper.appendChild(container);

    // Focus automatique
    setTimeout(() => this.searchInput?.focus(), 100);
  }

  /**
   * Gère la recherche avec debouncing
   */
  private handleSearch(query: string, resultsContainer: HTMLElement): void {
    // Clear timeout précédent
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Cancel requête précédente
    if (this.abortController) {
      this.abortController.abort();
    }

    // Cacher les résultats si query vide
    if (!query) {
      resultsContainer.style.display = "none";
      resultsContainer.innerHTML = "";
      return;
    }

    // Afficher loading
    resultsContainer.style.display = "block";
    resultsContainer.innerHTML = `
      <div style="padding: 12px; text-align: center; color: hsl(var(--muted-foreground)); font-size: 13px;">
        Recherche en cours...
      </div>
    `;

    // Debounce
    this.searchTimeout = setTimeout(() => {
      this.performSearch(query, resultsContainer);
    }, 300);
  }

  /**
   * Effectue la recherche via l'API
   */
  private async performSearch(query: string, resultsContainer: HTMLElement): Promise<void> {
    this.abortController = new AbortController();

    try {
      const endpoint = this.config.searchEndpoint || "/api/search";
      const { data } = await api.get(`${endpoint}?q=${encodeURIComponent(query)}`, {
        signal: this.abortController.signal,
      });

      this.renderResults(data.results || [], resultsContainer);
    } catch (error: any) {
      // Ignorer les erreurs d'annulation
      if (error && error.name === "AbortError" || error.code === "ERR_CANCELED") {
        return;
      }

      console.error("Erreur de recherche:", error);
      resultsContainer.innerHTML = `
        <div style="padding: 12px; text-align: center; color: hsl(var(--destructive)); font-size: 13px;">
          Erreur lors de la recherche
        </div>
      `;
    }
  }

  /**
   * Affiche les résultats de recherche
   */
  private renderResults(results: SearchResult[], resultsContainer: HTMLElement): void {
    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div style="padding: 12px; text-align: center; color: hsl(var(--muted-foreground)); font-size: 13px;">
          Aucun résultat trouvé
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = "";
    resultsContainer.style.cssText = `
      margin-top: 12px;
      display: block;
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid hsl(var(--border));
      border-radius: 6px;
      background: hsl(var(--background));
    `;

    results.forEach((result) => {
      const item = document.createElement("div");
      item.style.cssText = `
        padding: 10px 12px;
        cursor: pointer;
        border-bottom: 1px solid hsl(var(--border));
        transition: background 0.15s;
      `;

      item.addEventListener("mouseenter", () => {
        item.style.background = "hsl(var(--accent))";
      });

      item.addEventListener("mouseleave", () => {
        item.style.background = "transparent";
      });

      item.addEventListener("click", () => {
        this.selectReference(result);
      });

      // Badge de type
      const badge = document.createElement("span");
      badge.textContent = result.type === "card" ? "Fiche" : "Section";
      badge.style.cssText = `
        display: inline-block;
        padding: 2px 6px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        border-radius: 3px;
        background: ${result.type === "card" ? "hsl(var(--primary) / 0.15)" : "hsl(var(--secondary) / 0.15)"};
        color: ${result.type === "card" ? "hsl(var(--primary))" : "hsl(var(--secondary))"};
        margin-right: 8px;
      `;

      // Titre
      const title = document.createElement("span");
      title.textContent = result.title;
      title.style.cssText = `
        font-size: 14px;
        font-weight: 500;
        color: hsl(var(--foreground));
      `;

      item.appendChild(badge);
      item.appendChild(title);

      // Pour les sections, afficher la fiche parente
      if (result.type === "section" && result.cardTitle) {
        const subtitle = document.createElement("div");
        subtitle.textContent = `De la fiche : ${result.cardTitle}`;
        subtitle.style.cssText = `
          font-size: 12px;
          color: hsl(var(--muted-foreground));
          margin-top: 4px;
          margin-left: 2px;
        `;
        item.appendChild(subtitle);
      }

      resultsContainer.appendChild(item);
    });
  }

  /**
   * Sélectionne une référence
   */
  private selectReference(result: SearchResult): void {
    this.data = {
      type: result.type,
      cardId: result.cardId,
      sectionId: result.sectionId,
      title: result.title,
      cardTitle: result.cardTitle,
    };

    if (this.wrapper) {
      this.wrapper.innerHTML = "";
      this.renderSavedReference();
    }

    // Sauvegarder automatiquement
    this.block.dispatchChange();
  }

  save(): any {
    return this.data || {};
  }

  validate(savedData: ReferenceData): boolean {
    if (!savedData || Object.keys(savedData).length === 0) {
      return false;
    }

    return !!(savedData.type && savedData.cardId && savedData.title);
  }

  static get sanitize() {
    return {};
  }
}
