
export default class ImageResizeTune {
    api: any;
    data: any;
    wrapper: HTMLElement | undefined;

    static get isTune() {
        return true;
    }

    constructor({ api, data }: { api: any; data: any }) {
        this.api = api;
        this.data = data || { width: "100%" };
    }

    render() {
        const wrapper = document.createElement("div");

        // Style for the container of buttons - make it look like a toolbar
        wrapper.style.display = "flex";
        wrapper.style.justifyContent = "space-around";
        wrapper.style.padding = "10px 0";

        const sizes = [
            { name: "100%", value: "100%", icon: "XL" },
            { name: "75%", value: "75%", icon: "L" },
            { name: "50%", value: "50%", icon: "M" },
            { name: "25%", value: "25%", icon: "S" },
        ];

        sizes.forEach((size) => {
            const button = document.createElement("div");
            button.classList.add("ce-popover-item"); // Use EditorJS classes if possible
            // Custom styling to make it look like a button
            button.style.display = "flex";
            button.style.flexDirection = "column";
            button.style.alignItems = "center";
            button.style.justifyContent = "center";
            button.style.cursor = "pointer";
            button.style.padding = "5px";
            button.style.borderRadius = "4px";
            button.style.fontSize = "12px";
            button.title = `Largeur ${size.name}`;

            if (this.data.width === size.value) {
                button.style.backgroundColor = "rgba(0,0,0,0.1)"; // Highlight active
            }

            button.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 2px;">${size.icon}</div>
        <div style="font-size: 10px; color: #888;">${size.value}</div>
      `;

            button.addEventListener("click", () => {
                this.data.width = size.value;
                this._applyWidth();

                // Update styling of buttons
                Array.from(wrapper.children).forEach((child: any) => {
                    child.style.backgroundColor = "transparent";
                });
                button.style.backgroundColor = "rgba(0,0,0,0.1)";
            });

            wrapper.appendChild(button);
        });

        return wrapper;
    }

    wrap(blockContent: HTMLElement): HTMLElement {
        this.wrapper = document.createElement("div");
        this.wrapper.style.width = "100%";
        // Flex center
        this.wrapper.style.display = "flex";
        this.wrapper.style.justifyContent = "center";

        // Inner container for the width
        const inner = document.createElement("div");
        inner.classList.add("image-resize-tune-wrapper");
        inner.style.width = "100%";
        inner.style.transition = "max-width 0.3s ease";

        // Initial application
        inner.style.maxWidth = this.data.width || "100%";

        inner.appendChild(blockContent);
        this.wrapper.appendChild(inner);

        return this.wrapper;
    }

    save() {
        return {
            width: this.data.width,
        };
    }

    _applyWidth() {
        if (this.wrapper) {
            const inner = this.wrapper.querySelector(".image-resize-tune-wrapper") as HTMLElement;
            if (inner) {
                inner.style.maxWidth = this.data.width || "100%";
            }
        }
    }
}
