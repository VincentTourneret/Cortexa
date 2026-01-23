import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const linkMetadataSchema = z.object({
  url: z.string().url(),
});

// GET /api/fetch-link-metadata - Récupérer les métadonnées d'un lien
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL requise" },
        { status: 400 }
      );
    }

    // Valider l'URL
    const validationResult = linkMetadataSchema.safeParse({ url });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "URL invalide" },
        { status: 400 }
      );
    }

    // Récupérer les métadonnées du lien
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LinkPreviewBot/1.0)",
      },
      signal: AbortSignal.timeout(5000), // Timeout de 5 secondes
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: 1,
          meta: {
            title: url,
            description: "",
            image: {
              url: "",
            },
          },
        },
        { status: 200 }
      );
    }

    const html = await response.text();

    // Parser le HTML pour extraire les métadonnées
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descriptionMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i
    );
    const ogTitleMatch = html.match(
      /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i
    );
    const ogDescriptionMatch = html.match(
      /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i
    );
    const ogImageMatch = html.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i
    );

    const title = ogTitleMatch?.[1] || titleMatch?.[1] || url;
    const description =
      ogDescriptionMatch?.[1] || descriptionMatch?.[1] || "";
    const image = ogImageMatch?.[1] || "";

    return NextResponse.json(
      {
        success: 1,
        meta: {
          title,
          description,
          image: {
            url: image,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la récupération des métadonnées:", error);

    // Retourner un succès avec des métadonnées minimales en cas d'erreur
    const url = new URL(request.url).searchParams.get("url") || "";
    return NextResponse.json(
      {
        success: 1,
        meta: {
          title: url,
          description: "",
          image: {
            url: "",
          },
        },
      },
      { status: 200 }
    );
  }
}
