export type ItemListItem = { id: number; name: string; spriteUrl: string };

const BASE = 'https://pokeapi.co/api/v2';

export const spriteUrl = (slug: string) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`;

// 'master-ball' → 'Master Ball'
const toTitle = (slug: string) =>
  slug
    .split('-')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');

export async function fetchItemList(limit = 60): Promise<ItemListItem[]> {
  const res = await fetch(`${BASE}/item?limit=${limit}`);
  if (!res.ok) throw new Error(`PokeAPI responded with ${res.status}`);
  const json: { results: { name: string; url: string }[] } = await res.json();
  return json.results.map((r) => ({
    id: Number(r.url.split('/').filter(Boolean).pop()),
    name: toTitle(r.name),
    spriteUrl: spriteUrl(r.name),
  }));
}

export type Item = ItemListItem & { category: string; effect: string };

type ItemResponse = {
  id: number;
  name: string;
  names: { name: string; language: { name: string } }[];
  category: { name: string };
  effect_entries: { short_effect: string; language: { name: string } }[];
};

export async function fetchItem(id: number): Promise<Item> {
  const res = await fetch(`${BASE}/item/${id}`);
  if (!res.ok) throw new Error(`Item ${id} not found (${res.status})`);
  const i: ItemResponse = await res.json();
  return {
    id: i.id,
    name: i.names.find((n) => n.language.name === 'en')?.name ?? toTitle(i.name),
    spriteUrl: spriteUrl(i.name),
    category: i.category.name,
    effect: i.effect_entries.find((e) => e.language.name === 'en')?.short_effect ?? 'No effect text.',
  };
}
