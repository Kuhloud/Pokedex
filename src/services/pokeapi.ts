export type Item = { id: number; name: string; spriteUrl: string };

const BASE = "https://pokeapi.co/api/v2";

export const spriteUrl = (slug: string) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`;

// 'master-ball' → 'Master Ball'
const toTitle = (slug: string) =>
  slug
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");

export async function fetchItemList(limit = 60): Promise<Item[]> {
  const res = await fetch(`${BASE}/item?limit=${limit}`);
  if (!res.ok) throw new Error(`PokeAPI responded with ${res.status}`);
  const json: { results: { name: string; url: string }[] } = await res.json();
  return json.results.map((r) => ({
    id: Number(r.url.split("/").filter(Boolean).pop()),
    name: toTitle(r.name),
    spriteUrl: spriteUrl(r.name),
  }));
}
