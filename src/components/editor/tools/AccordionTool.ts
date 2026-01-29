/**
 * Accordion Tool for Editor.js
 * Creates a collapsible block with a title and a nested Editor.js instance
 */

import type { EditorJSData } from "@/lib/content-converter";

export default class AccordionTool {
    static get toolbox() {
        return {
            title: 'Accordéon',
            icon: '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h12M4 10h12M4 14h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
        };
    }

    static get isReadOnlySupported() {
        return true;
    }

    private api: any;
    private readOnly: boolean;
    private config: any;
    private data: { title: string; content: EditorJSData };
    private wrapper: HTMLElement | null = null;
    private nestedEditor: any = null;
    private holderId: string;

    constructor({ data, api, readOnly, config }: any) {
        this.api = api;
        this.readOnly = readOnly;
        this.config = config || {};
        this.data = {
            title: data.title || '',
            content: data.content || { blocks: [] }
        };
        this.holderId = `nested-editor-${Math.random().toString(36).substring(7)}`;
    }

    render(): HTMLElement {
        this.wrapper = document.createElement('div');
        this.wrapper.classList.add('accordion-tool-wrapper');
        this.wrapper.style.cssText = `
      border: 1px solid hsl(var(--border));
      border-radius: 8px;
      overflow: hidden;
      background: hsl(var(--card));
      margin: 8px 0;
    `;

        const details = document.createElement('details');
        details.open = !this.readOnly; // Open by default in edit mode
        details.style.cssText = `
      padding: 0;
    `;

        const summary = document.createElement('summary');
        summary.style.cssText = `
      padding: 12px 16px;
      font-weight: 600;
      color: hsl(var(--foreground));
      background: hsl(var(--muted) / 0.3);
      cursor: pointer;
      outline: none;
      display: flex;
      align-items: center;
      gap: 10px;
      list-style: none;
    `;

        // Add a small arrow custom icon since we use list-style: none
        const arrow = document.createElement('span');
        arrow.innerHTML = '▶';
        arrow.style.cssText = `
      font-size: 10px;
      transition: transform 0.2s ease;
      display: inline-block;
      width: 12px;
    `;

        details.addEventListener('toggle', () => {
            arrow.style.transform = details.open ? 'rotate(90deg)' : 'rotate(0deg)';
        });
        if (details.open) arrow.style.transform = 'rotate(90deg)';

        summary.appendChild(arrow);

        if (this.readOnly) {
            const titleSpan = document.createElement('span');
            titleSpan.textContent = this.data.title || 'Détails';
            summary.appendChild(titleSpan);
        } else {
            const titleInput = document.createElement('input');
            titleInput.value = this.data.title;
            titleInput.placeholder = 'Titre de l\'accordéon...';
            titleInput.style.cssText = `
        flex: 1;
        background: transparent;
        border: none;
        color: inherit;
        font: inherit;
        outline: none;
        padding: 0;
      `;
            titleInput.addEventListener('input', (e) => {
                this.data.title = (e.target as HTMLInputElement).value;
            });
            // Prevent accordion toggle when clicking the input
            titleInput.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            summary.appendChild(titleInput);
        }

        const contentArea = document.createElement('div');
        contentArea.style.cssText = `
      padding: 16px;
      border-top: 1px solid hsl(var(--border));
    `;

        if (this.readOnly) {
            // In read only, we might need a way to render blocks easily.
            // For now, let's create a read-only EditorJS instance or just a container
            const nestedHolder = document.createElement('div');
            nestedHolder.id = this.holderId;
            contentArea.appendChild(nestedHolder);
            this.initNestedEditor(nestedHolder);
        } else {
            const nestedHolder = document.createElement('div');
            nestedHolder.id = this.holderId;
            contentArea.appendChild(nestedHolder);
            // Wait for next tick to init editor to ensure DOM is ready
            setTimeout(() => this.initNestedEditor(nestedHolder), 0);
        }

        details.appendChild(summary);
        details.appendChild(contentArea);
        this.wrapper.appendChild(details);

        return this.wrapper;
    }

    private async initNestedEditor(holder: HTMLElement): Promise<void> {
        try {
            const { default: EditorJS } = await import("@editorjs/editorjs");
            const { default: Header } = await import("@editorjs/header");
            const { default: List } = await import("@editorjs/list");
            const { default: Marker } = await import("@editorjs/marker");
            const { default: InlineCode } = await import("@editorjs/inline-code");

            this.nestedEditor = new EditorJS({
                holder: this.holderId,
                data: this.data.content,
                readOnly: this.readOnly,
                minHeight: 0,
                placeholder: 'Contenu de l\'accordéon...',
                tools: {
                    header: {
                        class: Header as any,
                        config: {
                            levels: [3, 4],
                            defaultLevel: 3
                        }
                    },
                    list: List as any,
                    marker: Marker as any,
                    inlineCode: InlineCode as any,
                },
                onChange: async () => {
                    if (!this.readOnly && this.nestedEditor) {
                        try {
                            this.data.content = await this.nestedEditor.save();
                        } catch (e) {
                            console.error("Error saving nested editor:", e);
                        }
                    }
                }
            });
        } catch (err) {
            console.error("Failed to load EditorJS for nested accordion:", err);
            holder.innerHTML = `<p style="color: red;">Erreur de chargement de l'éditeur imbriqué</p>`;
        }
    }

    async save(): Promise<{ title: string; content: EditorJSData }> {
        if (this.nestedEditor && !this.readOnly) {
            try {
                this.data.content = await this.nestedEditor.save();
            } catch (e) {
                console.error("Error on final save of nested editor:", e);
            }
        }
        return {
            title: this.data.title,
            content: this.data.content
        };
    }

    validate(savedData: { title: string; content: EditorJSData }): boolean {
        return !!(savedData.title || (savedData.content && savedData.content.blocks.length > 0));
    }

    destroy(): void {
        if (this.nestedEditor && typeof this.nestedEditor.destroy === 'function') {
            this.nestedEditor.destroy();
        }
    }
}
