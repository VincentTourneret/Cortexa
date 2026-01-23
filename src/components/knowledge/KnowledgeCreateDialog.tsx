"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CreateContentDialog } from "@/components/content/CreateContentDialog";

type KnowledgeCreateDialogProps = {
  parentId: string | null;
};

export const KnowledgeCreateDialog: React.FC<KnowledgeCreateDialogProps> = ({
  parentId,
}) => {
  const router = useRouter();

  const handleCreated: () => void = () => {
    router.refresh();
  };

  return <CreateContentDialog parentId={parentId} onCreated={handleCreated} />;
};
