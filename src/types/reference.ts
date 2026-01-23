/**
 * Types pour le système de références entre fiches et sections
 */

/**
 * Type de référence : fiche complète ou section spécifique
 */
export type ReferenceType = "card" | "section";

/**
 * Résultat de recherche retourné par l'API
 */
export interface SearchResult {
  id: string;
  type: ReferenceType;
  title: string;
  cardId: string;
  sectionId?: string;
  cardTitle?: string; // Titre de la fiche parente pour les sections
  summary?: string; // Résumé de la fiche
  sections?: Array<{ // Sections de la fiche (pour les résultats de type "card")
    id: string;
    title: string;
  }>;
}

/**
 * Données stockées dans le bloc Editor.js
 */
export interface ReferenceData {
  type: ReferenceType;
  cardId: string;
  sectionId?: string;
  title: string;
  cardTitle?: string;
}

/**
 * Configuration du ReferenceTool
 */
export interface ReferenceToolConfig {
  searchEndpoint?: string;
}

/**
 * Contenu d'une fiche pour la modale
 */
export interface CardContent {
  id: string;
  title: string;
  summary: string | null;
  sections: SectionContent[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Contenu d'une section
 */
export interface SectionContent {
  id: string;
  title: string;
  content: string;
  contentType: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}
