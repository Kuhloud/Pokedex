export type Item = {
  id: number;
  name: string;
  category: string;
  effect: string;
};

export const itemData: Item[] = [
  {
    id: 1,
    name: "Master Ball",
    category: "standard-balls",
    effect: "Catches a wild Pokémon every time.",
  },
  {
    id: 2,
    name: "Ultra Ball",
    category: "standard-balls",
    effect: "Tries to catch a wild Pokémon. Success rate is 2×.",
  },
  {
    id: 3,
    name: "Great Ball",
    category: "standard-balls",
    effect: "Tries to catch a wild Pokémon. Success rate is 1.5×.",
  },
  {
    id: 4,
    name: "Poké Ball",
    category: "standard-balls",
    effect: "Tries to catch a wild Pokémon.",
  },
  { id: 17, name: "Potion", category: "healing", effect: "Restores 20 HP." },
  {
    id: 18,
    name: "Antidote",
    category: "status-cures",
    effect: "Cures poison.",
  },
  {
    id: 25,
    name: "Hyper Potion",
    category: "healing",
    effect: "Restores 200 HP.",
  },
  {
    id: 26,
    name: "Super Potion",
    category: "healing",
    effect: "Restores 50 HP.",
  },
  {
    id: 28,
    name: "Revive",
    category: "revival",
    effect: "Revives with half HP.",
  },
  {
    id: 50,
    name: "Rare Candy",
    category: "vitamins",
    effect: "Causes a level-up and raises happiness.",
  },
];
