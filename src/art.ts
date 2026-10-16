import manifest from "./data/art.json";
import sphereData from "../public/art/sphere-data.json";
import { SITE } from "./config";
import type { Locale } from "./i18n";

type Text = Record<Locale, string>;

export interface ArtImage {
  file: string;
  width: number;
  height: number;
}

export interface ArtPiece {
  id: string;
  order: number;
  series: string;
  featured: boolean;
  live: boolean;
  year: number;
  title: Text;
  summary: Text;
  caption: Text;
  alt: Text;
  palette: { id: string; name: Text } | null;
  /** Edge colour of the image, used behind cards and while loading. */
  background: string;
  image: { full: ArtImage; small: ArtImage };
}

export interface ArtSeries {
  id: string;
  title: Text;
  pieces: ArtPiece[];
}

const pieces = (manifest.pieces as ArtPiece[]).slice().sort((a, b) => a.order - b.order);

export const ART_PIECES = pieces;

/** The piece shown on the home page band. */
export const FEATURED_PIECE = pieces.find((p) => p.featured) ?? pieces[0];

/** "Made with Python." and the credit: name only, no bio. */
export const MADE_WITH: Text = manifest.madeWith;
export const ART_CREDIT: Text = SITE.author;

export const ART_SERIES: ArtSeries[] = manifest.series.map((s) => ({
  id: s.id,
  title: s.title as Text,
  pieces: pieces.filter((p) => p.series === s.id),
}));

/** Palettes the live sphere can switch between (ids match sphere-data.json). */
export const LIVE_PALETTES = pieces
  .filter((p) => p.id.startsWith("sphere-") && !p.id.endsWith("-echo") && p.palette)
  .map((p) => {
    const colors = sphereData.palettes[p.palette!.id as keyof typeof sphereData.palettes];
    return { id: p.palette!.id, name: p.palette!.name, base: colors.base[3], accent: colors.accent[3] };
  });

export function artPath(locale: Locale, id?: string): string {
  const base = locale === "en" ? "/art/" : "/fa/art/";
  return id ? `${base}${id}/` : base;
}
