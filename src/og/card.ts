import fs from "node:fs";
import path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import type { Locale } from "../i18n";

// Blend Navy tokens (see global.css).
const BG = "#0b1220";
const TX = "#eef2f8";
const TX2 = "#b7c2d6";
const TX3 = "#8493ae";
const AC = "#5b9dff";
const AC2 = "#a5c8ff";
const GLOW = "#3b5bdb";

const W = 1200;
const H = 630;
const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file));
const font = (pkg: string, file: string) => read(`node_modules/${pkg}/files/${file}.woff`);

let fontCache: ReturnType<typeof loadFonts> | undefined;
function loadFonts() {
  const vazir = (weight: 600 | 700 | 800) => [
    { name: "Vazirmatn", data: font("@fontsource/vazirmatn", `vazirmatn-arabic-${weight}-normal`), weight, style: "normal" as const },
    { name: "Vazirmatn", data: font("@fontsource/vazirmatn", `vazirmatn-latin-${weight}-normal`), weight, style: "normal" as const },
  ];
  return [
    { name: "Bricolage", data: font("@fontsource/bricolage-grotesque", "bricolage-grotesque-latin-800-normal"), weight: 800 as const, style: "normal" as const },
    { name: "Bricolage", data: font("@fontsource/bricolage-grotesque", "bricolage-grotesque-latin-700-normal"), weight: 700 as const, style: "normal" as const },
    { name: "Source", data: font("@fontsource/source-sans-3", "source-sans-3-latin-400-normal"), weight: 400 as const, style: "normal" as const },
    { name: "Source", data: font("@fontsource/source-sans-3", "source-sans-3-latin-600-normal"), weight: 600 as const, style: "normal" as const },
    { name: "Mono", data: font("@fontsource/jetbrains-mono", "jetbrains-mono-latin-500-normal"), weight: 500 as const, style: "normal" as const },
    ...vazir(600),
    ...vazir(700),
    ...vazir(800),
  ];
}

/** The hero girih, re-coloured for a standalone image and mirrored for Persian. */
let girihCache: string | undefined;
function girihSvg(mirrored: boolean) {
  girihCache ??= fs.readFileSync(path.join(root, "src/assets/hero-pattern-D.svg"), "utf8");
  const paths = girihCache
    .replace(/<svg[^>]*>/, "")
    .replace("</svg>", "")
    .replace(/ pathLength="1"/g, "")
    .replace(/ style="[^"]*"/g, "");
  const body = mirrored ? `<g transform="translate(1440 0) scale(-1 1)">${paths}</g>` : paths;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 1440 640" preserveAspectRatio="xMidYMid slice" ` +
    `fill="none" stroke="${AC}" stroke-width="2" stroke-opacity="0.55" stroke-linecap="round">${body}</svg>`
  );
}
const dataUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

// satori takes plain element trees.
type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Node => ({
  type,
  props: { style: { display: "flex", ...style }, children, ...extra },
});

export interface CardInput {
  locale: Locale;
  title: string;
  /** Small line above the title, e.g. the category or series. */
  eyebrow?: string;
  /** Byline, e.g. the author name. */
  byline?: string;
  /** Right-hand detail, e.g. the date. */
  detail?: string;
  /** Public path of an artwork to show on the opposite side of the text. */
  artwork?: string;
  /** Cards with the portrait: the site card (duotone) or an article card (original colours). */
  portrait?: "site" | "article";
  /** Article card: reading time next to the category pill. */
  readTime?: string;
}

function titleSize(title: string, rtl: boolean) {
  const n = [...title].length;
  const base = n <= 28 ? 84 : n <= 48 ? 72 : n <= 72 ? 60 : 50;
  return rtl ? Math.round(base * 0.88) : base;
}

export async function renderCard(input: CardInput): Promise<Buffer> {
  fontCache ??= loadFonts();
  if (input.portrait) return renderPortraitCard(input);
  const rtl = input.locale === "fa";
  const display = rtl ? "Vazirmatn" : "Bricolage";
  const body = rtl ? "Vazirmatn" : "Source";
  const dir = rtl ? "rtl" : "ltr";
  const fadeDir = rtl ? "270deg" : "90deg";

  let artworkSrc: string | undefined;
  if (input.artwork) {
    const file = path.join(root, "public", input.artwork);
    const jpg = await sharp(file).resize(420, 420, { fit: "cover" }).jpeg({ quality: 88 }).toBuffer();
    artworkSrc = `data:image/jpeg;base64,${jpg.toString("base64")}`;
  }

  const mark = h("div", { fontFamily: "Bricolage", fontWeight: 800, fontSize: 40, letterSpacing: -1.2, direction: "ltr" }, [
    h("div", { color: TX }, "hassan"),
    h("div", { color: AC }, "Bake"),
  ]);

  const textCol = h(
    "div",
    {
      flexDirection: "column",
      justifyContent: "space-between",
      alignSelf: "stretch",
      position: "relative",
      width: artworkSrc ? 580 : 900,
      alignItems: rtl ? "flex-end" : "flex-start",
      textAlign: rtl ? "right" : "left",
    },
    [
      mark,
      h("div", { flexDirection: "column", alignItems: rtl ? "flex-end" : "flex-start", width: "100%" }, [
        input.eyebrow
          ? h("div", { direction: dir, fontFamily: body, fontWeight: 600, fontSize: 28, color: AC2, marginBottom: 20, letterSpacing: rtl ? 0 : 3, textTransform: rtl ? "none" : "uppercase" }, input.eyebrow)
          : null,
        h(
          "div",
          {
            fontFamily: display,
            fontWeight: 800,
            fontSize: titleSize(input.title, rtl),
            lineHeight: rtl ? 1.45 : 1.05,
            letterSpacing: rtl ? 0 : -2,
            color: TX,
            lineClamp: 4,
            direction: dir,
            textAlign: rtl ? "right" : "left",
          },
          input.title,
        ),
      ]),
      h("div", { direction: dir, fontFamily: body, fontSize: 30, color: TX2, gap: 18, alignItems: "center" }, [
        input.byline ? h("div", { color: TX }, input.byline) : null,
        input.byline && input.detail ? h("div", { color: TX3 }, "·") : null,
        input.detail ? h("div", { color: TX3 }, input.detail) : null,
      ].filter(Boolean)),
    ],
  );

  const tree = h(
    "div",
    {
      position: "relative",
      width: W,
      height: H,
      background: BG,
      overflow: "hidden",
    },
    [
      // Soft glow on the pattern side, then the girih, then a fade so the text stays readable.
      h("div", {
        position: "absolute", top: 0, left: 0, width: W, height: H,
        background: `radial-gradient(circle at ${rtl ? 12 : 88}% 100%, ${GLOW}88 0%, transparent 55%)`,
      }),
      { type: "img", props: { src: dataUri(girihSvg(rtl)), width: W, height: H, style: { position: "absolute", top: 0, left: 0 } } },
      h("div", {
        position: "absolute", top: 0, left: 0, width: W, height: H,
        background: `linear-gradient(${fadeDir}, ${BG} 0%, rgba(11,18,32,0.95) 38%, rgba(11,18,32,0) 85%)`,
      }),
      h(
        "div",
        {
          position: "absolute",
          top: 64,
          left: 72,
          width: W - 144,
          height: H - 128,
          flexDirection: "row",
          justifyContent: rtl ? "flex-end" : "flex-start",
        },
        textCol,
      ),
      artworkSrc
        ? h(
            "div",
            {
              position: "absolute",
              top: 91,
              left: rtl ? 72 : W - 72 - 444,
              padding: 10,
              borderRadius: 36,
              border: `2px solid ${AC}66`,
              background: `${BG}cc`,
            },
            { type: "img", props: { src: artworkSrc, width: 420, height: 420, style: { borderRadius: 28 } } },
          )
        : null,
    ].filter(Boolean),
  );

  const svg = await satori(tree as never, { width: W, height: H, fonts: fontCache });
  return Buffer.from(new Resvg(svg, { fitTo: { mode: "width", value: W } }).render().asPng());
}

// ---------- Cards with the portrait (brand/portrait/README.md) ----------
// The photo is never flipped, also on the Persian cards; there the layout is mirrored around it.

const photo = async (file: string, size: number) =>
  `data:image/jpeg;base64,${(await sharp(read(file)).resize(size, size).jpeg({ quality: 90 }).toBuffer()).toString("base64")}`;

export async function renderPortraitCard(input: CardInput): Promise<Buffer> {
  fontCache ??= loadFonts();
  const rtl = input.locale === "fa";
  const dir = rtl ? "rtl" : "ltr";
  const isSite = input.portrait === "site";
  const display = rtl ? "Vazirmatn" : "Bricolage";
  const mono = rtl ? "Vazirmatn" : "Mono";
  const side = (px: number) => (rtl ? { right: px } : { left: px });
  const edge = (px: number) => (rtl ? { left: px } : { right: px });
  const align = rtl ? "flex-end" : "flex-start";

  // Photo: site card 630 px square, full height; article card 560 px, 70 px from the top.
  const size = isSite ? 630 : 560;
  const top = isSite ? 0 : H - size;
  const src = await photo(isSite ? "src/assets/portrait/og-site.webp" : "src/assets/portrait/og-article.webp", size);
  const fade = isSite ? 88 : 80;
  const photoLeft = W - size; // distance from the text side to the photo when LTR

  const wordmark = (px: number) =>
    h("div", { fontFamily: "Bricolage", fontWeight: 800, fontSize: px, letterSpacing: -px * 0.045, lineHeight: 0.9, direction: "ltr" }, [
      h("div", { color: TX }, "hassan"),
      h("div", { color: AC }, "Bake"),
    ]);
  const name = (px: number) =>
    h("div", { direction: dir, fontFamily: mono, fontWeight: rtl ? 600 : 500, fontSize: rtl ? px + 2 : px, letterSpacing: rtl ? 0 : px * 0.06, color: TX3 }, input.byline ?? "");

  const column = isSite
    ? h(
        "div",
        { position: "absolute", top: 64, bottom: 64, ...side(64), width: 560, flexDirection: "column", justifyContent: "space-between", alignItems: align, textAlign: rtl ? "right" : "left" },
        [
          h("div", { direction: dir, fontFamily: mono, fontWeight: rtl ? 600 : 500, fontSize: rtl ? 24 : 22, letterSpacing: rtl ? 0 : 2, textTransform: rtl ? "none" : "uppercase", color: TX2 }, input.eyebrow ?? ""),
          h("div", { flexDirection: "column", gap: 22, alignItems: align }, [
            wordmark(112),
            h("div", { direction: dir, fontFamily: display, fontWeight: rtl ? 700 : 700, fontSize: rtl ? 40 : 44, lineHeight: rtl ? 1.4 : 1.1, letterSpacing: rtl ? 0 : -0.9, color: TX }, input.title),
          ]),
          name(20),
        ],
      )
    : h(
        "div",
        { position: "absolute", top: 56, bottom: 64, ...side(64), width: 700, flexDirection: "column", justifyContent: "space-between", alignItems: align, textAlign: rtl ? "right" : "left" },
        [
          h("div", { direction: dir, alignItems: "center", gap: 16 }, [
            input.eyebrow
              ? h("div", { fontFamily: mono, fontWeight: rtl ? 600 : 500, fontSize: 20, letterSpacing: rtl ? 0 : 1.5, textTransform: rtl ? "none" : "uppercase", color: BG, background: AC, padding: rtl ? "4px 16px 8px" : "6px 16px", borderRadius: 18 }, input.eyebrow)
              : null,
            input.readTime
              ? h("div", { fontFamily: mono, fontWeight: rtl ? 600 : 500, fontSize: 20, letterSpacing: rtl ? 0 : 1.5, textTransform: rtl ? "none" : "uppercase", color: TX3 }, input.readTime)
              : null,
          ].filter(Boolean)),
          h(
            "div",
            {
              direction: dir,
              fontFamily: display,
              fontWeight: 800,
              fontSize: articleTitleSize(input.title, rtl),
              lineHeight: rtl ? 1.45 : 1,
              letterSpacing: rtl ? 0 : -2.6,
              color: TX,
              lineClamp: 4,
              maxWidth: 660,
              textAlign: rtl ? "right" : "left",
            },
            input.title,
          ),
          h("div", { direction: dir, alignItems: "center", gap: 16 }, [
            wordmark(30),
            h("div", { width: 1, height: 26, background: "#2E3F63" }, ""),
            name(20),
          ]),
        ],
      );

  const tree = h("div", { position: "relative", width: W, height: H, background: BG, overflow: "hidden" }, [
    h("div", {
      position: "absolute", top: 0, left: 0, width: W, height: H,
      background: `radial-gradient(ellipse at ${rtl ? 22 : 78}% 40%, rgba(59,91,219,0.22), transparent 62%)`,
    }),
    // Girih: faint on the site card; on the article card it shows through toward the photo.
    {
      type: "img",
      props: { src: dataUri(girihSvg(rtl)), width: W, height: H, style: { position: "absolute", top: 0, left: 0, opacity: isSite ? 0.28 : 0.5 } },
    },
    h("div", {
      position: "absolute", top: 0, left: 0, width: W, height: H,
      background: `linear-gradient(${rtl ? "270deg" : "90deg"}, ${BG} 0%, rgba(11,18,32,0.9) ${isSite ? 18 : 22}%, rgba(11,18,32,0) ${isSite ? 52 : 60}%)`,
    }),
    { type: "img", props: { src, width: size, height: size, style: { position: "absolute", top, ...edge(0) } } },
    h("div", {
      position: "absolute", top, width: fade, height: size,
      ...(rtl ? { left: size - fade } : { left: photoLeft }),
      background: `linear-gradient(${rtl ? "270deg" : "90deg"}, ${BG} 0%, rgba(11,18,32,0) 100%)`,
    }),
    column,
  ]);

  const svg = await satori(tree as never, { width: W, height: H, fonts: fontCache });
  return Buffer.from(new Resvg(svg, { fitTo: { mode: "width", value: W } }).render().asPng());
}

function articleTitleSize(title: string, rtl: boolean) {
  const n = [...title].length;
  const base = n <= 34 ? 74 : n <= 52 ? 64 : n <= 72 ? 54 : 46;
  return rtl ? Math.round(base * 0.82) : base;
}
