import { useQuery } from '@tanstack/react-query';

import { fetchItemList } from '@/services/pokeapi';

export const useItemList = () =>
  useQuery({ queryKey: ['item', 'list'], queryFn: () => fetchItemList() });
