import type { APIRoute, GetStaticPaths } from "astro";
import { ogCards } from "../../og";
import { renderCard } from "../../og/card";

export const getStaticPaths = (async () => {
  const cards = await ogCards();
  return Object.entries(cards).map(([path, card]) => ({ params: { path }, props: { card } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderCard(props.card);
  return new Response(png, { headers: { "Content-Type": "image/png" } });
};
