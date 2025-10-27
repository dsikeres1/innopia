'use client';

import { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { ThumbnailCard } from './ThumbnailCard';
import MediaDetailModal from './MediaDetailModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '@/types/media';
import { api } from '@/api/api';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

type Props = {
  title: string;
  items: MediaItem[];
};

export function MediaSlider({ title, items }: Props) {
  const [selectedPk, setSelectedPk] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedPk !== null) {

      const clickedItem = items.find(item => item.pk === selectedPk);

      Promise.all([
        api.ottMovieDetail({ moviePk: selectedPk }),
        api.ottMovieRecommend({ moviePk: selectedPk, topN: 10 })
      ]).then(([detailRes, recommendRes]) => {
        if (detailRes) {
          setSelectedItem({
            pk: detailRes.pk,
            title: detailRes.titleKo || detailRes.titleEn,
            originalTitle: detailRes.originalTitle,
            posterUrl: detailRes.posterPath
              ? `https://image.tmdb.org/t/p/w500${detailRes.posterPath}`
              : undefined,
            backdropUrl: detailRes.backdropPath
              ? `https://image.tmdb.org/t/p/original${detailRes.backdropPath}`
              : undefined,
            genres: detailRes.genres.map((g) => g.nameKo || g.nameEn),
            releaseDate: detailRes.releaseDate,
            runtime: detailRes.runtime ? `${detailRes.runtime}분` : undefined,
            overview: detailRes.overviewKo || detailRes.overviewEn,
            keywords: detailRes.keywords.map((k) => k.name),
            reviewScore: detailRes.reviewNlpScore ?? undefined,
            similarityScore: clickedItem?.similarityScore,
            director: detailRes.director || undefined,
            cast: detailRes.castNames ? detailRes.castNames.split(", ") : undefined,
            adult: detailRes.adult,
            recommendedMovies: recommendRes?.recommendedMovies.map(m => ({
              pk: m.pk,
              title: m.titleKo || m.titleEn,
              posterUrl: m.posterPath
                ? `https://image.tmdb.org/t/p/w500${m.posterPath}`
                : undefined,
              similarityScore: m.similarityScore,
              genres: m.genres,
              reviewScore: m.reviewNlpScore ?? undefined,
              ratingPredict: m.ratingPredict ?? undefined,
              keywords: m.keywords,
            })) || [],
          });
        }
      });
    } else {
      setSelectedItem(null);
    }
  }, [selectedPk, items]);

  const handleClick = (pk: number) => setSelectedPk(pk);
  const handleClose = () => {
    setSelectedPk(null);
    setSelectedItem(null);
  };

  return (
    <div className="relative py-6 space-y-4">
      <div className="flex items-center px-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-gradient-to-b from-pink-500 to-fuchsia-500 rounded-sm shadow-md" />
          <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow">{title}</h2>
        </div>

        <div ref={paginationRef} className="inline-flex gap-1.5 items-center ml-auto w-auto" />
      </div>

      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Swiper
          modules={[Navigation, Pagination]}
          slidesPerView="auto"
          spaceBetween={8}
          loop={true}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          pagination={{
            el: paginationRef.current,
            clickable: true,
            bulletClass: 'inline-block w-2 h-2 rounded-full bg-white/40 transition-all cursor-pointer',
            bulletActiveClass: '!bg-white !w-6',
          }}
          onBeforeInit={(swiper: SwiperType) => {

            if (typeof swiper.params.navigation !== 'boolean') {
              const navigation = swiper.params.navigation;
              if (navigation) {
                navigation.prevEl = prevRef.current;
                navigation.nextEl = nextRef.current;
              }
            }

            if (typeof swiper.params.pagination !== 'boolean') {
              const pagination = swiper.params.pagination;
              if (pagination) {
                pagination.el = paginationRef.current;
              }
            }
          }}
          onSwiper={(swiper: SwiperType) => {

            setTimeout(() => {
              if (swiper.navigation && typeof swiper.navigation.init === 'function') {
                swiper.navigation.init();
                swiper.navigation.update();
              }
            }, 100);
          }}
          className="!overflow-visible"
        >
          {items.map((item) => (
            <SwiperSlide key={item.pk} style={{ width: '160px' }}>
              <div onClick={() => handleClick(item.pk)}>
                <ThumbnailCard
                  pk={item.pk}
                  title={item.title}
                  posterUrl={item.posterUrl}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <button
          ref={prevRef}
          className={`absolute left-2 top-1/2 z-50 h-12 w-12 -translate-y-1/2 flex items-center justify-center rounded-full bg-black/50 text-white transition-opacity duration-300 hover:bg-black/70 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          ref={nextRef}
          className={`absolute right-2 top-1/2 z-50 h-12 w-12 -translate-y-1/2 flex items-center justify-center rounded-full bg-black/50 text-white transition-opacity duration-300 hover:bg-black/70 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {selectedItem && (
        <MediaDetailModal
          isOpen={!!selectedItem}
          onClose={handleClose}
          title={selectedItem.title}
          originalTitle={selectedItem.originalTitle}
          posterUrl={selectedItem.posterUrl}
          backdropUrl={selectedItem.backdropUrl}
          genres={selectedItem.genres}
          releaseDate={selectedItem.releaseDate}
          runtime={selectedItem.runtime}
          overview={selectedItem.overview}
          keywords={selectedItem.keywords}
          reviewScore={selectedItem.reviewScore}
          similarityScore={selectedItem.similarityScore}
          director={selectedItem.director}
          cast={selectedItem.cast}
          adult={selectedItem.adult}
          recommendedMovies={selectedItem.recommendedMovies}
        />
      )}
    </div>
  );
}