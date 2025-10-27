'use client';

import { SceneCard } from './SceneCard';
import { MediaItem } from '@/types/media';

export function SceneCardList({
  items,
  onSelect,
}: {
  items: MediaItem[];
  onSelect: (item: MediaItem) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <div key={item.pk} onClick={() => onSelect(item)}>
          <SceneCard {...item} />
        </div>
      ))}
    </div>
  );
}