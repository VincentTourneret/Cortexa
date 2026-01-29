
"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";

interface MultiEmailSelectProps {
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
}

export function MultiEmailSelect({ value, onChange, placeholder }: MultiEmailSelectProps) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = React.useState("");
    const [open, setOpen] = React.useState(false);

    const handleUnselect = (email: string) => {
        onChange(value.filter((v) => v !== email));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const input = inputRef.current;
        if (input) {
            if ((e.key === "Delete" || e.key === "Backspace") && input.value === "") {
                onChange(value.slice(0, -1));
            }

            // On Enter, Space or Comma, add the email if valid
            if (["Enter", " ", ","].includes(e.key)) {
                e.preventDefault();
                const email = inputValue.trim();
                if (email) {
                    // Simple email validation regex
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (emailRegex.test(email) && !value.includes(email)) {
                        onChange([...value, email]);
                        setInputValue("");
                    }
                }
            }
        }
    };

    return (
        <Command className="overflow-visible bg-transparent">
            <div
                className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
            >
                <div className="flex flex-wrap gap-1">
                    {value.map((email) => (
                        <Badge key={email} variant="secondary">
                            {email}
                            <button
                                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleUnselect(email);
                                    }
                                }}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                onClick={() => handleUnselect(email)}
                            >
                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                        </Badge>
                    ))}
                    {/* Avoid CommandInput here to manage custom keys better, or use input directly */}
                    <input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => setOpen(false)}
                        onFocus={() => setOpen(true)}
                        placeholder={value.length > 0 ? "" : placeholder}
                        className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                    />
                </div>
            </div>
        </Command>
    );
}
