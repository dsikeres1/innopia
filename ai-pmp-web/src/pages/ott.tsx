import { observer } from "mobx-react-lite";
import { makeAutoObservable, runInAction } from "mobx";
import { useEffect } from "react";
import { isNil } from "lodash";
import { MediaSlider } from "@/components/media/MediaSlider";
import { TabBar } from "@/components/layout/TabBar";
import { Footer } from "@/components/layout/Footer";
import { useModel } from "../../ex/mobx";
import { api } from "@/api/api";
import type { MovieItem } from "@/api/schema.g";
import { MediaItem } from "@/types/media";

class OttPageModel {
  movies: MediaItem[] = [];
  initialized: boolean = false;

  recommendations: Array<{
    title: string;
    movies: MediaItem[];
    loaded: boolean;
  }> = [];

  constructor() {
    makeAutoObservable(this);
  }

  async init() {

    await this.loadRecommendationsMultiple();

    const res = await api.ottMovieList({ limit: 30, offset: 0 });

    if (isNil(res)) {
      return;
    }

    runInAction(() => {

      this.movies = res.movies.map((movie: MovieItem) => ({
        pk: movie.pk,
        title: movie.titleKo || movie.titleEn,
        posterUrl: movie.posterPath
          ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
          : undefined,
        genres: movie.genres,
        releaseDate: movie.releaseDate,
        reviewScore: movie.voteAverage,
      }));
      this.initialized = true;
    });
  }

  async loadRecommendationsMultiple() {
    try {

      const res = await api.ottUserMovieRecommendMultiple({
        count: 3,
        topN: 15
      });

      if (!isNil(res) && res.recommendations) {
        runInAction(() => {

          this.recommendations = res.recommendations.map((recommendation) => ({
            title: recommendation.selectedMovieTitle,
            movies: recommendation.recommendedMovies.map((movie) => ({
              pk: movie.pk,
              title: movie.titleKo || movie.titleEn,
              posterUrl: movie.posterPath
                ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
                : undefined,
              genres: movie.genres,
              releaseDate: "",
              reviewScore: movie.reviewNlpScore ?? undefined,
              similarityScore: movie.similarityScore,
              keywords: movie.keywords,
            })),
            loaded: true,
          }));
        });
      }
    } catch (error) {
      console.warn("Failed to load recommendations:", error);
    }
  }

  getMoviesByGenre(genre: string): MediaItem[] {
    return this.movies.filter((movie) =>
      movie.genres.some((g) => g.includes(genre))
    );
  }

  get popularMovies(): MediaItem[] {
    return [...this.movies].sort(
      (a, b) => (b.reviewScore || 0) - (a.reviewScore || 0)
    );
  }
}

const OttPage = observer(() => {
  const model = useModel(OttPageModel);

  useEffect(() => {
    void model.init();

  }, []); 

  return (
    <div className="text-white min-w-[480px]">

      <div className="fixed inset-0 z-0 w-screen h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-80"
          style={{ backgroundImage: "url('/bg-cinema.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
      </div>

      <div className="relative z-10 h-screen overflow-y-scroll scrollbar-hide bg-transparent backdrop-blur-sm">
        <TabBar />

        <main className="space-y-24 py-14 px-4 sm:px-8 md:px-16 lg:px-24">

          {model.recommendations.map((rec, index) => (
            <div key={index}>
              {rec.loaded ? (
                <MediaSlider
                  title={`최근 시청하신 '${rec.title}'과 관련한 추천 미디어`}
                  items={rec.movies}
                />
              ) : (
                <div className="space-y-4">
                  <div className="h-8 w-64 bg-neutral-800/50 rounded animate-pulse" />
                  <div className="flex gap-2 overflow-hidden">
                    {Array.from({ length: 10 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="w-[160px] h-[240px] shrink-0 rounded-lg bg-neutral-800/50 animate-pulse"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

        </main>

        <Footer />
      </div>
    </div>
  );
});

export default OttPage;