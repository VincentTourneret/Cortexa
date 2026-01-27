"use client";

import { ChromePicker } from "react-color";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./dropdown-menu";

interface ColorPickerProps {
  value: string | null | undefined;
  onChange: (color: string | null) => void;
  trigger?: React.ReactNode;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  trigger,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label="Choisir une couleur"
          >
            <div
              className="h-4 w-4 rounded border border-input"
              style={{ backgroundColor: value || "transparent" }}
            />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="p-0 border-none bg-transparent shadow-none">
        <ChromePicker
          color={value || "#ffffff"}
          onChange={(color) => {
            const { r, g, b, a } = color.rgb;
            onChange(`rgba(${r}, ${g}, ${b}, ${a})`);
          }}
        />
        <div className="bg-popover p-2 mt-1 rounded-md border shadow-md">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => onChange(null)}
          >
            Réinitialiser la couleur
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
