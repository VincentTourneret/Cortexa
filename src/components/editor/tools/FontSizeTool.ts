/**
 * FontSize Tool for Editor.js
 * Permet de changer la taille de police du texte sélectionné
 */

export default class FontSizeTool {
  static title = "Taille de police";
  
  private api: any;
  private button: HTMLButtonElement | null = null;
  private tag = "SPAN";
  private sizes = [
    { name: "Petit", value: "0.875rem", class: "text-sm" },
    { name: "Normal", value: "1rem", class: "text-base" },
    { name: "Moyen", value: "1.125rem", class: "text-lg" },
    { name: "Grand", value: "1.25rem", class: "text-xl" },
    { name: "Très grand", value: "1.5rem", class: "text-2xl" },
  ];

  static get isInline(): boolean {
    return true;
  }

  get state(): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    const parentNode = range.commonAncestorContainer.parentElement;

    return !!parentNode?.closest('[data-font-size]');
  }

  constructor({ api }: { api: any }) {
    this.api = api;
  }

  render(): HTMLElement {
    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.classList.add("ce-inline-tool");
    this.button.innerHTML = `
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2H15M2 8.5H12M2 15H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `;
    this.button.title = "Taille de police";

    return this.button;
  }

  surround(range: Range): void {
    if (this.state) {
      this.unwrap(range);
      return;
    }

    this.wrap(range);
  }

  wrap(range: Range): void {
    const selectedText = range.extractContents();
    const span = document.createElement(this.tag);
    
    // Par défaut, appliquer une taille moyenne
    span.setAttribute('data-font-size', '1.125rem');
    span.style.fontSize = '1.125rem';
    span.classList.add('text-lg');
    
    span.appendChild(selectedText);
    range.insertNode(span);

    // Sélectionner le nouveau span
    this.api.selection.expandToTag(span);
  }

  unwrap(range: Range): void {
    const span = this.api.selection.findParentTag(this.tag, 'data-font-size');
    if (!span) {
      return;
    }

    const text = range.extractContents();
    span.remove();
    range.insertNode(text);
  }

  checkState(): boolean {
    return this.state;
  }

  renderActions(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.classList.add("font-size-tool-actions");
    wrapper.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px;
      min-width: 150px;
    `;

    this.sizes.forEach((size) => {
      const button = document.createElement("button");
      button.type = "button";
      button.classList.add("font-size-option");
      button.textContent = size.name;
      button.style.cssText = `
        padding: 6px 12px;
        text-align: left;
        background: transparent;
        border: 1px solid hsl(var(--border));
        border-radius: 4px;
        cursor: pointer;
        font-size: ${size.value};
        transition: background 0.2s;
      `;

      button.addEventListener("mouseenter", () => {
        button.style.background = "hsl(var(--accent))";
      });

      button.addEventListener("mouseleave", () => {
        button.style.background = "transparent";
      });

      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.applySize(size.value, size.class);
      });

      wrapper.appendChild(button);
    });

    return wrapper;
  }

  applySize(size: string, className: string): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    const parentSpan = this.api.selection.findParentTag(this.tag, 'data-font-size');

    if (parentSpan) {
      // Modifier la taille existante
      parentSpan.setAttribute('data-font-size', size);
      parentSpan.style.fontSize = size;
      parentSpan.className = className;
    } else {
      // Créer un nouveau span avec la taille
      const selectedText = range.extractContents();
      const span = document.createElement(this.tag);
      span.setAttribute('data-font-size', size);
      span.style.fontSize = size;
      span.classList.add(className);
      span.appendChild(selectedText);
      range.insertNode(span);
    }

    // Fermer le popover
    this.api.inlineToolbar.close();
  }

  static get sanitize() {
    return {
      span: {
        'data-font-size': true,
        style: true,
        class: true,
      },
    };
  }
}
