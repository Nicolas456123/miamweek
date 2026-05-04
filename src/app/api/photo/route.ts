/**
 * API Pexels — recherche + cache d'image pour une recette.
 *
 * Endpoint : /api/photo?q=ratatouille
 * Réponse  : { url: string | null, photographer?: string, source?: "pexels" }
 *
 * La clé est lue dans process.env.PEXELS_API_KEY (à régler dans Vercel + .env.local).
 */

import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 86400; // 24 h

type PexelsPhoto = {
  src: { large: string; medium: string; small: string };
  photographer: string;
};

type PexelsResponse = {
  photos?: PexelsPhoto[];
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ url: null, error: "missing q" }, { status: 400 });
  }

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { url: null, error: "PEXELS_API_KEY not configured" },
      { status: 200 }
    );
  }

  try {
    // On affine la requête : la cuisine + le mot recherché donne de meilleurs résultats
    const query = `${q} food`;
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {
        headers: { Authorization: apiKey },
        next: { revalidate: 86400 },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { url: null, error: `pexels ${res.status}` },
        { status: 200 }
      );
    }

    const data: PexelsResponse = await res.json();
    const photo = data.photos?.[0];

    if (!photo) {
      return NextResponse.json({ url: null }, { status: 200 });
    }

    return NextResponse.json({
      url: photo.src.medium,
      large: photo.src.large,
      photographer: photo.photographer,
      source: "pexels",
    });
  } catch (err) {
    return NextResponse.json(
      { url: null, error: String(err) },
      { status: 200 }
    );
  }
}
