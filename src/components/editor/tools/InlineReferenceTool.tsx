/**
 * InlineReferenceTool - Outil inline pour créer des liens vers des fiches/sections
 * Permet de surligner du texte et de le lier à une fiche de connaissance
 */

import api from "@/lib/axios";

export default class InlineReferenceTool {
  static CSS = "inline-reference";

  private api: any;
  private button: HTMLButtonElement | null = null;
  private tag: string = "SPAN";
  private class: string = "inline-reference";
  private config: any;

  static get isInline() {
    return true;
  }

  static get title() {
    return "Lier à une fiche";
  }

  constructor({ api, config }: { api: any; config?: any }) {
    this.api = api;
    this.config = config || {};

    // Utiliser la délégation d'événements au niveau du document pour garantir que les clics fonctionnent
    // même si les éléments sont recréés (mode readOnly)
    this.setupEventDelegation();

    // Réattacher les événements de clic aux liens existants après un court délai
    setTimeout(() => {
      this.reattachClickEvents();
    }, 500);

    // En mode visualisation, vérifier à nouveau après 1 et 2 secondes
    setTimeout(() => {
      this.reattachClickEvents();
    }, 1000);

    setTimeout(() => {
      this.reattachClickEvents();
    }, 2000);

    // Observer les changements du DOM pour attacher les événements automatiquement
    this.setupMutationObserver();

    // Exposer une fonction globale pour réattacher manuellement si nécessaire
    (window as any).reattachInlineReferenceEvents = () => {
      this.reattachClickEvents();
    };
  }

  /**
   * Configure la délégation d'événements au niveau du document
   * Cela garantit que les clics fonctionnent même si les éléments sont recréés
   */
  setupEventDelegation() {
    // Utiliser capture phase pour intercepter avant EditorJS
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest(`.${this.class}`) as HTMLElement;

      if (link) {
        const cardId = link.getAttribute("data-card-id");
        const sectionId = link.getAttribute("data-section-id");

        if (cardId) {
          e.preventDefault();
          e.stopPropagation();

          let url = `/knowledge/${cardId}`;
          if (sectionId) {
            url += `#section-${sectionId}`;
          }

          console.log("Navigation vers:", url);
          window.location.href = url;
        }
      }
    }, true); // Utiliser capture phase
  }

  /**
   * Configure un MutationObserver pour détecter les nouveaux liens
   */
  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldReattach = false;

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          // Si un nœud ajouté contient ou est un lien inline
          if (node instanceof HTMLElement) {
            if (node.classList?.contains(this.class) ||
              node.querySelector?.(`.${this.class}`)) {
              shouldReattach = true;
            }
          }
        });
      });

      if (shouldReattach) {
        // Petit délai pour laisser le DOM se stabiliser
        setTimeout(() => {
          this.reattachClickEvents();
        }, 100);
      }
    });

    // Observer tout le document
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Réattache les événements de clic à tous les liens existants
   */
  async reattachClickEvents() {
    const existingLinks = document.querySelectorAll(`.${this.class}`);

    if (existingLinks.length === 0) return;

    // Collecter tous les IDs uniques de références
    const cardIds = new Set<string>();
    const sectionIds = new Set<string>();

    existingLinks.forEach((link) => {
      const mark = link as HTMLElement;
      const cardId = mark.getAttribute("data-card-id");
      const sectionId = mark.getAttribute("data-section-id");

      if (cardId) cardIds.add(cardId);
      if (sectionId) sectionIds.add(sectionId);
    });

    // Récupérer les informations de toutes les références en une seule requête
    const allIds = [...Array.from(cardIds), ...Array.from(sectionIds)];
    if (allIds.length === 0) return;

    try {
      const { data } = await api.post("/api/inline-references", { ids: allIds });
      const references = data.references || [];

      // Créer un map pour accès rapide
      const referencesMap = new Map(
        references.map((ref: any) => [ref.id, ref])
      );

      // Attacher les événements à chaque lien
      existingLinks.forEach((link) => {
        const mark = link as HTMLElement;
        const cardId = mark.getAttribute("data-card-id");

        if (!cardId) return;

        // Récupérer les titres depuis l'API
        const cardInfo = referencesMap.get(cardId) as any;
        if (cardInfo?.title) {
          mark.setAttribute("data-card-title", cardInfo.title);
        }

        const sectionId = mark.getAttribute("data-section-id");
        if (sectionId) {
          const sectionInfo = referencesMap.get(sectionId) as any;
          if (sectionInfo?.title) {
            mark.setAttribute("data-section-title", sectionInfo.title);
          }
        }

        // Ne pas réattacher les événements de clic car on utilise la délégation d'événements
        // Mais s'assurer que l'attribut est présent pour le tooltip
        if (!mark.hasAttribute("data-has-click-event")) {
          // Attacher les événements de tooltip seulement
          this.attachTooltipEvents(mark);
          mark.setAttribute("data-has-click-event", "true");
        } else {
          // Réattacher les événements de tooltip si nécessaire
          // (ils peuvent être perdus lors du re-render)
          // Supprimer l'attribut pour permettre la réattachement
          mark.removeAttribute("data-has-tooltip-events");
          this.attachTooltipEvents(mark);
        }
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des titres des références:", error);
    }
  }

  /**
   * Bouton de la toolbar
   */
  render() {
    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.innerHTML = `
      <svg width="17" height="17" viewBox="0 0 17 17" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.5 2L12 5.5L8.5 9M2 8.5H12M12 8.5L8.5 12M12 8.5L15.5 5" 
              stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      </svg>
    `;
    this.button.classList.add(this.api.styles.inlineToolButton);
    this.button.title = "Lier à une fiche (Ctrl+K)";

    return this.button;
  }

  /**
   * Appelé lors du clic sur le bouton
   */
  surround(range: Range) {
    if (!range) {
      return;
    }

    // Si le texte est déjà une référence, on la supprime
    const termWrapper = this.api.selection.findParentTag(this.tag, this.class);

    if (termWrapper) {
      this.unwrap(termWrapper);
    } else {
      // Sinon, on enveloppe le texte et on ouvre le modal de sélection
      this.wrap(range);
    }
  }

  /**
   * Enveloppe le texte sélectionné
   */
  wrap(range: Range) {
    const selectedText = range.extractContents();
    const mark = document.createElement(this.tag);

    mark.classList.add(this.class);
    mark.setAttribute("data-card-id", "");
    mark.setAttribute("data-section-id", "");
    // Ne pas mettre contenteditable="false" pour permettre les clics
    mark.style.cssText = `
      background-color: rgba(59, 130, 246, 0.1);
      color: rgb(59, 130, 246);
      padding: 2px 4px;
      border-radius: 3px;
      cursor: pointer;
      text-decoration: underline;
      text-decoration-style: dotted;
      user-select: none;
    `;

    mark.appendChild(selectedText);
    range.insertNode(mark);

    // Sélectionner le nouveau noeud
    this.api.selection.expandToTag(mark);

    // Ouvrir le modal de sélection de fiche
    this.openReferenceSelector(mark);
  }

  /**
   * Retire l'enveloppe de référence
   */
  unwrap(termWrapper: HTMLElement) {
    this.api.selection.expandToTag(termWrapper);

    const sel = window.getSelection();
    if (!sel) return;

    const range = sel.getRangeAt(0);
    const unwrappedContent = range.extractContents();

    termWrapper.parentNode?.removeChild(termWrapper);
    range.insertNode(unwrappedContent);

    sel.removeAllRanges();
    sel.addRange(range);
  }

  /**
   * Vérifie si la sélection contient déjà une référence
   */
  checkState() {
    const termTag = this.api.selection.findParentTag(this.tag, this.class);

    this.button!.classList.toggle(
      this.api.styles.inlineToolButtonActive,
      !!termTag
    );

    return !!termTag;
  }

  /**
   * Ouvre le modal de sélection de fiche/section
   */
  openReferenceSelector(mark: HTMLElement) {
    // Créer un modal de sélection
    const modal = this.createSelectorModal(mark);
    document.body.appendChild(modal);

    // Focus sur le champ de recherche
    const searchInput = modal.querySelector("input") as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  }

  /**
   * Crée le modal de sélection
   */
  createSelectorModal(mark: HTMLElement): HTMLElement {
    const modal = document.createElement("div");
    modal.className = "inline-reference-modal";
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      padding: 16px;
      z-index: 10000;
      min-width: 400px;
      max-width: 600px;
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    `;

    // Header
    const header = document.createElement("div");
    header.style.cssText = "margin-bottom: 16px;";
    header.innerHTML = `
      <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">
        Lier à une fiche de connaissance
      </h3>
      <input 
        type="text" 
        placeholder="Rechercher une fiche..." 
        style="
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 14px;
        "
      />
    `;

    // Liste des résultats
    const resultsList = document.createElement("div");
    resultsList.className = "results-list";
    resultsList.style.cssText = `
      flex: 1;
      overflow-y: auto;
      margin-bottom: 16px;
    `;

    // Footer avec boutons
    const footer = document.createElement("div");
    footer.style.cssText = "display: flex; justify-content: flex-end; gap: 8px;";
    footer.innerHTML = `
      <button class="cancel-btn inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3" type="button">Annuler</button>
    `;

    modal.appendChild(header);
    modal.appendChild(resultsList);
    modal.appendChild(footer);

    // Événements
    const searchInput = header.querySelector("input") as HTMLInputElement;
    const cancelBtn = footer.querySelector(".cancel-btn") as HTMLButtonElement;

    // Recherche
    searchInput.addEventListener("input", async (e) => {
      const query = (e.target as HTMLInputElement).value;
      await this.searchAndDisplayResults(query, resultsList, mark, modal);
    });

    // Charger les résultats initiaux
    this.searchAndDisplayResults("", resultsList, mark, modal);

    // Annuler
    cancelBtn.addEventListener("click", () => {
      // Retirer le mark si aucune référence n'a été sélectionnée
      if (!mark.getAttribute("data-card-id")) {
        this.unwrap(mark);
      }
      this.closeModal(modal);
    });

    // Fermer en cliquant en dehors
    const backdrop = document.createElement("div");
    backdrop.className = "inline-reference-backdrop";
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: 9999;
    `;
    backdrop.addEventListener("click", () => {
      if (!mark.getAttribute("data-card-id")) {
        this.unwrap(mark);
      }
      this.closeModal(modal);
    });
    document.body.appendChild(backdrop);

    return modal;
  }

  /**
   * Recherche et affiche les résultats
   */
  async searchAndDisplayResults(
    query: string,
    container: HTMLElement,
    mark: HTMLElement,
    modal: HTMLElement
  ) {
    try {
      // Construire l'URL - query peut être vide pour charger toutes les fiches
      const url = query
        ? `/api/search?q=${encodeURIComponent(query)}`
        : `/api/search`;

      const { data } = await api.get(url);

      // Vider le container
      container.innerHTML = "";

      // L'API retourne { results: [...] } avec des objets de type "card" ou "section"
      const results = data.results || [];

      if (results.length === 0) {
        container.innerHTML = `
          <div style="padding: 16px; text-align: center; color: #9ca3af;">
            ${query ? "Aucune fiche trouvée" : "Aucune fiche disponible. Créez d'abord des fiches de connaissance."}
          </div>
        `;
        return;
      }

      // Regrouper les résultats par fiche
      const cardsMap = new Map<string, any>();

      results.forEach((result: any) => {
        if (result.type === "card") {
          // C'est une fiche - l'API retourne maintenant les sections incluses
          if (!cardsMap.has(result.cardId)) {
            cardsMap.set(result.cardId, {
              id: result.cardId,
              title: result.title,
              summary: result.summary,
              sections: result.sections || [],
            });
          }
        } else if (result.type === "section") {
          // C'est une section d'une autre fiche
          if (!cardsMap.has(result.cardId)) {
            cardsMap.set(result.cardId, {
              id: result.cardId,
              title: result.cardTitle,
              summary: undefined,
              sections: [],
            });
          }
          // Ajouter la section si elle n'existe pas déjà
          const card = cardsMap.get(result.cardId)!;
          if (!card.sections.some((s: any) => s.id === result.sectionId)) {
            card.sections.push({
              id: result.sectionId,
              title: result.title,
            });
          }
        }
      });

      // Afficher les résultats
      const cards = Array.from(cardsMap.values());
      cards.forEach((card: any) => {
        const cardItem = this.createCardItem(card, mark, modal);
        container.appendChild(cardItem);
      });
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
      container.innerHTML = `
        <div style="padding: 16px; text-align: center; color: #ef4444;">
          Erreur lors de la recherche
        </div>
      `;
    }
  }

  /**
   * Crée un élément de fiche dans la liste
   */
  createCardItem(card: any, mark: HTMLElement, modal: HTMLElement): HTMLElement {
    const item = document.createElement("div");
    item.style.cssText = `
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: background-color 0.2s;
    `;

    item.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">${card.title}</div>
      ${card.summary
        ? `<div style="font-size: 13px; color: #6b7280;">${card.summary}</div>`
        : ""
      }
      ${card.sections && card.sections.length > 0
        ? `
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #f3f4f6;">
          <div style="font-size: 12px; color: #9ca3af; margin-bottom: 4px;">Sections:</div>
          ${card.sections
          .map(
            (section: any) => `
            <div 
              class="section-item" 
              data-section-id="${section.id}"
              style="
                padding: 6px 8px;
                background: #f9fafb;
                border-radius: 4px;
                font-size: 13px;
                margin-bottom: 4px;
                cursor: pointer;
                transition: background-color 0.2s;
              "
            >
              ${section.title}
            </div>
          `
          )
          .join("")}
        </div>
      `
        : ""
      }
    `;

    // Clic sur la fiche entière
    item.addEventListener("click", (e) => {
      // Ne pas déclencher si on clique sur une section
      if ((e.target as HTMLElement).classList.contains("section-item")) {
        return;
      }
      this.selectReference(mark, card.id, undefined, card.title);
      this.closeModal(modal);
    });

    // Hover sur l'item
    item.addEventListener("mouseenter", () => {
      item.style.backgroundColor = "#f9fafb";
    });
    item.addEventListener("mouseleave", () => {
      item.style.backgroundColor = "transparent";
    });

    // Clic sur une section
    const sectionItems = item.querySelectorAll(".section-item");
    sectionItems.forEach((sectionItem) => {
      sectionItem.addEventListener("mouseenter", () => {
        (sectionItem as HTMLElement).style.backgroundColor = "#e5e7eb";
      });
      sectionItem.addEventListener("mouseleave", () => {
        (sectionItem as HTMLElement).style.backgroundColor = "#f9fafb";
      });

      sectionItem.addEventListener("click", (e) => {
        e.stopPropagation();
        const sectionId = (sectionItem as HTMLElement).getAttribute("data-section-id");
        const section = card.sections.find((s: any) => s.id === sectionId);
        this.selectReference(mark, card.id, sectionId || undefined, card.title, section?.title);
        this.closeModal(modal);
      });
    });

    return item;
  }

  /**
   * Sélectionne une référence (fiche ou section)
   */
  selectReference(
    mark: HTMLElement,
    cardId: string,
    sectionId?: string,
    cardTitle?: string,
    sectionTitle?: string
  ) {
    mark.setAttribute("data-card-id", cardId);
    if (sectionId) {
      mark.setAttribute("data-section-id", sectionId);
    }

    // Stocker les titres pour le tooltip
    if (cardTitle) {
      mark.setAttribute("data-card-title", cardTitle);
    }
    if (sectionTitle) {
      mark.setAttribute("data-section-title", sectionTitle);
    }

    // Ne pas attacher d'événement de clic directement car on utilise la délégation d'événements
    // Mais marquer que ce lien est configuré
    if (!mark.hasAttribute("data-has-click-event")) {
      mark.setAttribute("data-has-click-event", "true");

      // Ajouter les événements de tooltip
      this.attachTooltipEvents(mark);
    }

    // Enregistrer le lien dans la base de données
    this.saveInlineReference(cardId, sectionId);
  }

  /**
   * Attache les événements de tooltip
   */
  attachTooltipEvents(mark: HTMLElement) {
    // Éviter d'attacher plusieurs fois les mêmes événements
    if (mark.hasAttribute("data-has-tooltip-events")) {
      return;
    }

    mark.setAttribute("data-has-tooltip-events", "true");

    let tooltip: HTMLElement | null = null;

    mark.addEventListener("mouseenter", (e) => {
      const cardTitle = mark.getAttribute("data-card-title");
      const sectionTitle = mark.getAttribute("data-section-title");

      if (!cardTitle) return;

      // Créer le tooltip
      tooltip = document.createElement("div");
      tooltip.className = "inline-reference-tooltip";
      tooltip.style.cssText = `
        position: absolute;
        background: hsl(var(--popover));
        color: hsl(var(--popover-foreground));
        border: 1px solid hsl(var(--border));
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
        z-index: 10001;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s ease-in-out;
      `;

      // Contenu du tooltip
      if (sectionTitle) {
        tooltip.innerHTML = `
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="opacity: 0.7;">📄</span>
            <span>${cardTitle}</span>
            <span style="opacity: 0.5;">→</span>
            <span>${sectionTitle}</span>
          </div>
        `;
      } else {
        tooltip.innerHTML = `
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="opacity: 0.7;">📄</span>
            <span>${cardTitle}</span>
          </div>
        `;
      }

      document.body.appendChild(tooltip);

      // Positionner le tooltip
      const rect = mark.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();

      // Position par défaut : en dessous du lien, centré
      let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
      let top = rect.bottom + 8;

      // Ajuster si le tooltip sort de l'écran
      if (left < 10) {
        left = 10;
      } else if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
      }

      // Si pas assez de place en dessous, afficher au-dessus
      if (top + tooltipRect.height > window.innerHeight - 10) {
        top = rect.top - tooltipRect.height - 8;
      }

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;

      // Fade in
      setTimeout(() => {
        if (tooltip) {
          tooltip.style.opacity = "1";
        }
      }, 10);
    });

    mark.addEventListener("mouseleave", () => {
      if (tooltip) {
        tooltip.remove();
        tooltip = null;
      }
    });
  }

  /**
   * Ferme le modal et le backdrop
   */
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

  /**
   * Enregistre le lien inline dans la base de données
   */
  async saveInlineReference(cardId: string, sectionId?: string) {
    try {
      // Récupérer le contexte actuel (sourceCardId et sourceSectionId)
      const context = this.getEditorContext();

      if (!context.sourceCardId) {
        console.warn("Contexte source non disponible");
        return;
      }

      // Récupérer le texte surligné depuis le mark
      const marks = document.querySelectorAll(`.${this.class}`);
      let highlightedText = "";
      marks.forEach((mark) => {
        if (
          mark.getAttribute("data-card-id") === cardId &&
          (!sectionId || mark.getAttribute("data-section-id") === sectionId)
        ) {
          highlightedText = mark.textContent || "";
        }
      });

      // Enregistrer le lien via l'API
      await api.post("/api/inline-references/create", {
        targetCardId: cardId,
        targetSectionId: sectionId,
        sourceCardId: context.sourceCardId,
        sourceSectionId: context.sourceSectionId,
        text: highlightedText,
      });

    } catch (error) {
      console.error("Erreur lors de l'enregistrement du lien:", error);
    }
  }

  /**
   * Récupère le contexte de l'éditeur (ID de la fiche et de la section en cours d'édition)
   * Cette méthode tente de deviner le contexte à partir de l'URL
   */
  getEditorContext() {
    // Essayer de récupérer l'ID depuis l'URL: /knowledge/[id]
    const path = window.location.pathname;
    const match = path.match(/\/knowledge\/([^\/]+)/);
    const sourceCardId = match ? match[1] : null;

    // Pour la section, un peu plus compliqué car souvent dans le hash ou non présent
    // On retourne null pour l'instant
    return {
      sourceCardId,
      sourceSectionId: null, // À implémenter si besoin
    };
  }

  static get sanitize() {
    return {
      span: {
        class: true,
        "data-card-id": true,
        "data-section-id": true,
        style: true,
      },
    };
  }
}
