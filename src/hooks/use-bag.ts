import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as bagDb from '@/services/bag-db';
import { type ItemListItem } from '@/services/pokeapi';

export const useBag = () => useQuery({ queryKey: ['bag'], queryFn: bagDb.getBag });

export const useIsInBag = (id: number) =>
  useQuery({ queryKey: ['bag', id], queryFn: () => bagDb.isInBag(id) });

export const useToggleBag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ item, inBag }: { item: ItemListItem; inBag: boolean }) =>
      inBag ? bagDb.removeFromBag(item.id) : bagDb.addToBag(item),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bag'] }),
  });
};
