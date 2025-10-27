'use client';

import Image from 'next/image';

type Props = {
  pk: number;
  title: string;
  posterUrl?: string;
  onClick?: (pk: number) => void;
};

export function ThumbnailCard({ pk, title, posterUrl, onClick }: Props) {
  return (
    <div
      onClick={() => onClick?.(pk)}
      className="relative w-[160px] h-[240px] shrink-0 overflow-hidden rounded-lg bg-neutral-800 shadow cursor-pointer transition hover:scale-105"
    >
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt={title}
          fill
          sizes="160px"
          className="object-cover"
          priority
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-gray-400">
          No Image
        </div>
      )}
    </div>
  );
}