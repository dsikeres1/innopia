'use client';

import Image from 'next/image';
import { ActorInfo } from '@/types/media';

type Props = {
  pk: number;
  title: string;
  posterUrl?: string;
  genres: string[];
  actors?: ActorInfo[];
};

export function SceneCard({ pk, title, posterUrl, genres, actors }: Props) {
  return (
    <div className="w-full space-y-3 cursor-pointer hover:scale-105 transition">

      <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-md bg-neutral-800">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No Image
          </div>
        )}
      </div>

      <div className="text-lg font-semibold text-gray-100 leading-snug line-clamp-2">
        {title}
      </div>

      <div className="flex gap-2 flex-wrap">
        {genres.slice(0, 2).map((genre) => (
          <span
            key={genre}
            className="px-2 py-0.5 text-xs font-medium rounded-full bg-pink-500/20 text-pink-200"
          >
            {genre}
          </span>
        ))}
      </div>

      {actors && actors.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          {actors.slice(0, 3).map((actor, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              {actor.imageUrl && (
                <div className="relative w-5 h-5 rounded-full overflow-hidden border border-emerald-400/40">
                  <Image
                    src={actor.imageUrl}
                    alt={actor.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <span className="text-xs text-emerald-400 font-medium">
                {actor.name}
              </span>
            </div>
          ))}
          {actors.length > 3 && (
            <span className="text-xs text-gray-400">
              +{actors.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}