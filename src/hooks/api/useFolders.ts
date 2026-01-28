import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

type Folder = {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
  color?: string | null;
  children?: Folder[];
};

type FolderWithPath = {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
  path: Array<{ id: string; name: string }>;
};

type CreateFolderInput = {
  name: string;
  parentId?: string | null;
  color?: string | null;
};

type UpdateFolderInput = {
  id: string;
  name?: string;
  parentId?: string | null;
  color?: string | null;
};

type ReorderFoldersInput = {
  folderIds: string[];
  parentId: string | null;
};

// Clés de query
export const foldersKeys = {
  all: ["folders"] as const,
  lists: () => [...foldersKeys.all, "list"] as const,
  list: (parentId?: string | null) => [...foldersKeys.lists(), parentId] as const,
  details: () => [...foldersKeys.all, "detail"] as const,
  detail: (id: string) => [...foldersKeys.details(), id] as const,
};

// Hook pour récupérer la liste des dossiers
export const useFolders = (parentId?: string | null) => {
  return useQuery({
    queryKey: foldersKeys.list(parentId),
    queryFn: async (): Promise<Folder[]> => {
      const url = parentId
        ? `/api/folders?parentId=${parentId}`
        : "/api/folders";
      const { data } = await api.get(url);

      return data.folders || [];
    },
  });
};

// Hook pour récupérer un dossier spécifique avec son chemin
export const useFolder = (id: string) => {
  return useQuery({
    queryKey: foldersKeys.detail(id),
    queryFn: async (): Promise<FolderWithPath> => {
      const { data } = await api.get(`/api/folders/${id}`);

      return data;
    },
    enabled: !!id,
  });
};

// Hook pour créer un dossier
export const useCreateFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFolderInput) => {
      const { data } = await api.post("/api/folders", input);

      return data.folder;
    },
    onSuccess: (data) => {
      // Invalider la liste des dossiers pour le parent
      queryClient.invalidateQueries({ queryKey: foldersKeys.list(data.parentId) });
    },
  });
};

// Hook pour mettre à jour un dossier
export const useUpdateFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateFolderInput) => {
      const { data } = await api.patch(`/api/folders/${id}`, input);

      return data.folder;
    },
    onSuccess: (data) => {
      // Invalider toutes les listes de dossiers et le détail
      queryClient.invalidateQueries({ queryKey: foldersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: foldersKeys.detail(data.id) });
    },
  });
};

// Hook pour supprimer un dossier
export const useDeleteFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/folders/${id}`);

      return { id };
    },
    onSuccess: () => {
      // Invalider toutes les listes de dossiers
      queryClient.invalidateQueries({ queryKey: foldersKeys.lists() });
    },
  });
};

// Hook pour réordonner les dossiers
export const useReorderFolders = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReorderFoldersInput) => {
      const { data } = await api.put("/api/folders/reorder", input);

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalider la liste des dossiers pour le parent concerné
      queryClient.invalidateQueries({ queryKey: foldersKeys.list(variables.parentId) });
    },
  });
};
