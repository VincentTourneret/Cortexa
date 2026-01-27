import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type SectionTemplateItem = {
  id: string;
  title: string;
  content: string;
  contentType: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

type SectionTemplate = {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  items: SectionTemplateItem[];
};

type CreateSectionTemplateInput = {
  name: string;
  items: {
    title: string;
    content: string;
    contentType?: "text" | "editorjs";
    order: number;
  }[];
};

type UpdateSectionTemplateInput = {
  id: string;
  name?: string;
  items?: {
    title: string;
    content: string;
    contentType?: "text" | "editorjs";
    order: number;
  }[];
};

// Clés de query
export const sectionTemplatesKeys = {
  all: ["sectionTemplates"] as const,
  lists: () => [...sectionTemplatesKeys.all, "list"] as const,
  details: () => [...sectionTemplatesKeys.all, "detail"] as const,
  detail: (id: string) => [...sectionTemplatesKeys.details(), id] as const,
};

// Hook pour récupérer la liste des templates
export const useSectionTemplates = () => {
  return useQuery({
    queryKey: sectionTemplatesKeys.lists(),
    queryFn: async (): Promise<SectionTemplate[]> => {
      const response = await fetch("/api/section-templates");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Erreur lors de la récupération des templates"
        );
      }

      return data.templates || [];
    },
  });
};

// Hook pour récupérer un template spécifique
export const useSectionTemplate = (id: string) => {
  return useQuery({
    queryKey: sectionTemplatesKeys.detail(id),
    queryFn: async (): Promise<SectionTemplate> => {
      const response = await fetch(`/api/section-templates/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Erreur lors de la récupération du template"
        );
      }

      return data.template;
    },
    enabled: !!id,
  });
};

// Hook pour créer un template
export const useCreateSectionTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSectionTemplateInput) => {
      const response = await fetch("/api/section-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création");
      }

      return data.template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sectionTemplatesKeys.lists(),
      });
    },
  });
};

// Hook pour mettre à jour un template
export const useUpdateSectionTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateSectionTemplateInput) => {
      const response = await fetch(`/api/section-templates/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      return data.template;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: sectionTemplatesKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: sectionTemplatesKeys.detail(data.id),
      });
    },
  });
};

// Hook pour supprimer un template
export const useDeleteSectionTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/section-templates/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sectionTemplatesKeys.lists(),
      });
    },
  });
};
