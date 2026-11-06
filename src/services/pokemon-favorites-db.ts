import * as SQLite from 'expo-sqlite';

const databasePromise = SQLite.openDatabaseAsync('pokedex.db').then(async (database) => {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS personal_list (
      personal_list_id INTEGER PRIMARY KEY AUTOINCREMENT,
      pokemon_id INTEGER NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  return database;
});

export async function getFavoriteIds(): Promise<number[]> {
  const database = await databasePromise;
  const records = await database.getAllAsync<{ pokemon_id: number }>(
    'SELECT pokemon_id FROM personal_list ORDER BY created_at DESC',
  );
  return records.map(({ pokemon_id }) => pokemon_id);
}

export async function addFavorite(id: number): Promise<void> {
  const database = await databasePromise;
  await database.runAsync('INSERT OR IGNORE INTO personal_list (pokemon_id) VALUES (?)', [id]);
}

export async function removeFavorite(id: number): Promise<void> {
  const database = await databasePromise;
  await database.runAsync('DELETE FROM personal_list WHERE pokemon_id = ?', [id]);
}
