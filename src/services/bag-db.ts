import * as SQLite from 'expo-sqlite';

import { type ItemListItem } from './pokeapi';

const db = SQLite.openDatabaseSync('items.db');

db.execSync(`
  CREATE TABLE IF NOT EXISTS bag (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    sprite_url TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

type Row = { id: number; name: string; sprite_url: string };

export async function getBag(): Promise<ItemListItem[]> {
  const rows = await db.getAllAsync<Row>('SELECT id, name, sprite_url FROM bag ORDER BY created_at DESC');
  return rows.map((r) => ({ id: r.id, name: r.name, spriteUrl: r.sprite_url }));
}

export async function isInBag(id: number): Promise<boolean> {
  const row = await db.getFirstAsync('SELECT id FROM bag WHERE id = ?', [id]);
  return row !== null;
}

export async function addToBag(item: ItemListItem): Promise<void> {
  await db.runAsync('INSERT OR REPLACE INTO bag (id, name, sprite_url) VALUES (?, ?, ?)', [
    item.id,
    item.name,
    item.spriteUrl,
  ]);
}

export async function removeFromBag(id: number): Promise<void> {
  await db.runAsync('DELETE FROM bag WHERE id = ?', [id]);
}
