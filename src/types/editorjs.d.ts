/**
 * Déclarations de types pour les modules EditorJS sans types officiels
 */

declare module '@editorjs/link' {
  import { BlockTool } from '@editorjs/editorjs';
  
  export default class LinkTool implements BlockTool {
    constructor(config: any);
    render(): HTMLElement;
    save(blockContent: HTMLElement): any;
    static get toolbox(): { icon: string; title: string };
  }
}

declare module '@editorjs/embed' {
  import { BlockTool } from '@editorjs/editorjs';
  
  export default class Embed implements BlockTool {
    constructor(config: any);
    render(): HTMLElement;
    save(blockContent: HTMLElement): any;
    static get toolbox(): { icon: string; title: string };
  }
}

declare module '@editorjs/marker' {
  import { InlineTool } from '@editorjs/editorjs';
  
  export default class Marker implements InlineTool {
    constructor(config: any);
    surround(range: Range): void;
    checkState(selection: Selection): boolean;
    static get isInline(): boolean;
    static get sanitize(): any;
  }
}
