"use client";

import { useState } from "react";
import { FolderList } from "./FolderList";
import { CreateContentDialog } from "@/components/content/CreateContentDialog";

export const DashboardContent: React.FC = () => {
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFolderCreated = () => {
    // Forcer le rafraîchissement de la liste
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-card p-6 shadow-lg border border-border">
        <h2 className="mb-4 text-xl font-semibold text-card-foreground">
          Mes contenus
        </h2>
        <FolderList
          refreshKey={refreshKey}
          onCreateFolder={(parentId) => setCurrentParentId(parentId)}
          onParentIdChange={setCurrentParentId}
        />
      </div>

      <CreateContentDialog
        parentId={currentParentId}
        onCreated={handleFolderCreated}
      />
    </div>
  );
};
