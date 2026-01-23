"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

type QueryProviderProps = {
  children: ReactNode;
};

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Configuration du cache
            staleTime: 5 * 60 * 1000, // 5 minutes - Les données sont considérées comme fraîches pendant 5 min
            gcTime: 10 * 60 * 1000, // 10 minutes - Garbage collection après 10 min d'inactivité
            retry: 1, // Réessayer une fois en cas d'échec
            refetchOnWindowFocus: false, // Ne pas refetch automatiquement au focus de la fenêtre
            refetchOnMount: true, // Refetch au montage si les données sont stale
            refetchOnReconnect: true, // Refetch à la reconnexion
          },
          mutations: {
            // Configuration des mutations
            retry: 0, // Ne pas réessayer les mutations en cas d'échec
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
