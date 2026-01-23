"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Folder, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItemType {
  id: string;
  name: string;
}

interface FolderBreadcrumbProps {
  items: BreadcrumbItemType[];
  currentFolder?: BreadcrumbItemType | null;
  onNavigate: (folderId: string | null) => void;
  className?: string;
}

export const FolderBreadcrumb: React.FC<FolderBreadcrumbProps> = ({
  items,
  currentFolder,
  onNavigate,
  className,
}) => {
  const isAtRoot = items.length === 0 && !currentFolder;

  return (
    <div className={cn("rounded-lg border border-border bg-card p-3", className)}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate(null);
              }}
              className={cn(
                "cursor-pointer flex items-center gap-1.5 transition-colors rounded-md px-2 py-1 -mx-2 -my-1",
                isAtRoot
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Home className="h-4 w-4 shrink-0" />
              <span>Racine</span>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {items.map((item) => (
            <div key={item.id} className="flex items-center">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(item.id);
                  }}
                  className="cursor-pointer flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-accent/50 rounded-md px-2 py-1 -mx-2 -my-1"
                >
                  <Folder className="h-4 w-4 shrink-0" />
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">
                    {item.name}
                  </span>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </div>
          ))}

          {currentFolder && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="flex items-center gap-1.5 font-medium">
                  <Folder className="h-4 w-4" />
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">
                    {currentFolder.name}
                  </span>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};
