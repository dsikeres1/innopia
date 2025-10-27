export type SceneClip = {
  title: string;
  description?: string;
  seekTo: number;      
  duration: number;    
  thumbnailUrl?: string;
};

export type RecommendedMovie = {
  pk: number;
  title: string;
  posterUrl?: string;
  similarityScore: number;  
  genres: string[];
  reviewScore?: number;  
  ratingPredict?: number;  
  keywords: string[];
};

export type ActorInfo = {
  name: string;
  imageUrl?: string;
};

export type MediaItem = {
  pk: number;
  title: string;
  originalTitle?: string;
  posterUrl?: string;
  backdropUrl?: string;
  genres: string[];
  releaseDate?: string;
  runtime?: string;
  overview?: string;
  keywords?: string[];
  reviewScore?: number;
  similarityScore?: number;
  director?: string;
  cast?: string[];
  adult?: boolean;
  videoUrl?: string;
  scenes?: SceneClip[];
  recommendedMovies?: RecommendedMovie[];  
  actors?: ActorInfo[];  
};