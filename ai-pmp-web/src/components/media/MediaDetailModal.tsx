'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Image from 'next/image';
import { RecommendedMovie } from '@/types/media';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  originalTitle?: string;
  overview?: string;
  posterUrl?: string;
  backdropUrl?: string;
  genres?: string[];
  releaseDate?: string;
  runtime?: string;
  keywords?: string[];
  reviewScore?: number;
  similarityScore?: number;
  director?: string;
  cast?: string[];
  adult?: boolean;
  recommendedMovies?: RecommendedMovie[];
}

export default function MediaDetailModal(props: Props) {
  const {
    isOpen,
    onClose,
    title,
    originalTitle,
    overview,
    posterUrl,
    backdropUrl,
    genres = [],
    releaseDate,
    runtime,
    keywords = [],
    reviewScore,
    similarityScore,
    director,
    cast = [],
    adult = false,
    recommendedMovies = [],
  } = props;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
            <motion.div
              className="relative w-full max-w-7xl max-h-[90vh] bg-zinc-950/95 text-white rounded-2xl shadow-2xl overflow-y-auto flex flex-col"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>

              <div className="flex flex-col md:flex-row">
                {posterUrl && (
                  <div className="hidden md:block w-[480px] flex-shrink-0 bg-zinc-800 aspect-[2/3]">
                    <Image
                      src={posterUrl}
                      alt={title}
                      width={480}
                      height={720}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div
                  className="relative p-8 flex-1 w-full bg-cover bg-center"
                  style={{
                    backgroundImage: 'url("/modal-bg.png")'
                  }}
                >
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-0 rounded-xl" />
                  <div className="relative z-10 flex flex-col justify-between min-h-full space-y-10">

                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <h2 className="text-4xl font-bold text-white">{title}</h2>
                        {adult && (
                          <span className="px-2 py-1 text-xs font-bold rounded bg-red-600 text-white">
                            19+
                          </span>
                        )}
                      </div>
                      {originalTitle && originalTitle !== title && (
                        <p className="text-lg text-gray-300 italic font-medium">
                          원제: {originalTitle}
                        </p>
                      )}
                      {(releaseDate || runtime) && (
                        <div className="flex flex-wrap gap-4 text-base text-indigo-300">
                          {releaseDate && <InlineInfo label="개봉일" value={releaseDate} />}
                          {runtime && <InlineInfo label="러닝타임" value={runtime} />}
                        </div>
                      )}
                    </div>

                    {genres.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {genres.map((g, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 text-sm font-medium rounded-full bg-pink-500/20 text-pink-200"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-base text-gray-300 leading-relaxed">
                      {overview || '이 영화에 대한 설명이 없습니다.'}
                    </p>

                    {(director || cast.length > 0) && (
                      <div className="text-base text-gray-100 bg-transparent rounded-xl px-2 pt-1 space-y-1">
                        {director && (
                          <div className="text-indigo-300/90 text-sm">🎬 <span className="text-white font-semibold">감독:</span> {director}</div>
                        )}
                        {cast.length > 0 && (
                          <div className="text-indigo-300/90 text-sm">⭐ <span className="text-white font-semibold">출연:</span> {cast.join(', ')}</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-6">
                    {typeof reviewScore === 'number' && (
                      <CircleScore color="lime" value={reviewScore} label="리뷰 점수" />
                    )}
                    {typeof similarityScore === 'number' && (
                      <CircleScore color="sky" value={similarityScore} label="유사도" />
                    )}
                  </div>

                  {keywords.length > 0 && (
                    <div className="pt-2">
                      <div className="flex flex-wrap gap-2">
                        {keywords.map((k, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 text-sm font-medium rounded-full bg-sky-600/20 text-sky-200"
                          >
                            #{k}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {recommendedMovies.length > 0 && (
              <div className="w-full bg-zinc-900/80 border-t border-gray-700/50 p-6">
                <h3 className="text-xl font-bold text-white mb-4">비슷한 영화 추천</h3>
                <div className="space-y-3">
                  {recommendedMovies
                    .filter((movie) =>
                      movie.ratingPredict !== undefined &&
                      movie.reviewScore !== undefined &&
                      movie.posterUrl !== undefined
                    )
                    .map((movie) => (
                    <div
                      key={movie.pk}
                      className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                    >

                      <div className="w-16 h-24 flex-shrink-0 bg-zinc-700 rounded overflow-hidden">
                        {movie.posterUrl ? (
                          <Image
                            src={movie.posterUrl}
                            alt={movie.title}
                            width={64}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                            N/A
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm line-clamp-2">{movie.title}</p>
                      </div>

                      <div className="w-32 flex-shrink-0">
                        <div className="flex flex-wrap gap-1">
                          {movie.genres.slice(0, 2).map((genre, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-200"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="w-16 text-center flex-shrink-0">
                        {movie.ratingPredict !== undefined && movie.reviewScore !== undefined ? (
                          <span className="text-purple-400 font-bold text-sm">
                            {Math.round((movie.ratingPredict + movie.reviewScore) / 2)}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">N/A</span>
                        )}
                      </div>

                      <div className="w-16 text-center flex-shrink-0">
                        {movie.ratingPredict !== undefined ? (
                          <span className="text-blue-400 font-bold text-sm">{movie.ratingPredict}</span>
                        ) : (
                          <span className="text-gray-500 text-xs">N/A</span>
                        )}
                      </div>

                      <div className="w-16 text-center flex-shrink-0">
                        {movie.reviewScore !== undefined ? (
                          <span className="text-lime-400 font-bold text-sm">{movie.reviewScore}</span>
                        ) : (
                          <span className="text-gray-500 text-xs">N/A</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1">
                          {movie.keywords.slice(0, 3).map((keyword, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-0.5 rounded-full bg-sky-600/20 text-sky-200"
                            >
                              #{keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-indigo-400 mb-0.5">{label}</span>
      <span className="text-base font-medium text-white">{value}</span>
    </div>
  );
}

function InlineInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-indigo-400">{label}</span>
      <span className="text-base font-semibold text-white">{value}</span>
    </div>
  );
}

function CircleScore({ color, value, label }: { color: string; value: string | number; label: string }) {
  const palette = {
    emerald: 'border-emerald-400 text-emerald-200',
    fuchsia: 'border-fuchsia-500 text-fuchsia-200',
    rose: 'border-rose-400 text-rose-200',
    lime: 'border-lime-400 text-lime-200',
    sky: 'border-sky-400 text-sky-200',
  }[color] || 'border-gray-500 text-white';

  return (
    <div className="flex flex-col items-center">
      <div className={`w-16 h-16 rounded-full border-[5px] flex items-center justify-center text-xl font-bold ${palette}`}>{value}</div>
      <span className="text-sm mt-1 text-gray-300">{label}</span>
    </div>
  );
}