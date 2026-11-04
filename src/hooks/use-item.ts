import { useQuery } from '@tanstack/react-query';

import { fetchItem } from '@/services/pokeapi';

export const useItem = (id: number) =>
  useQuery({ queryKey: ['item', id], queryFn: () => fetchItem(id), enabled: Number.isFinite(id) });
