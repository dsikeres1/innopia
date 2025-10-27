import random
import re
from sqlalchemy.orm import joinedload
from sqlalchemy import func

from ex.api import BaseModel, Res, ok
from was.blueprints.front import app
from was.model import db
from was.model.movie import Movie, MovieGenreMaster, MovieRating, MovieSimilarity, MovieLensMovie, MovieLensTMDBSimilarity, MoviePrediction

class MovieListReq(BaseModel):
    limit: int = 20
    offset: int = 0

class MovieItem(BaseModel):
    pk: int
    title_ko: str | None
    title_en: str
    poster_path: str | None
    backdrop_path: str | None
    vote_average: float
    release_date: str
    genres: list[str]

    @classmethod
    def from_model(cls, movie: Movie) -> 'MovieItem':

        genre_names = [g.name_ko or g.name_en for g in movie.genres]

        return MovieItem(
            pk=movie.pk,
            title_ko=movie.title_ko,
            title_en=movie.title_en,
            poster_path=movie.poster_path,
            backdrop_path=movie.backdrop_path,
            vote_average=movie.vote_average,
            release_date=movie.release_date,
            genres=genre_names
        )

class MovieListRes(BaseModel):
    movies: list[MovieItem]
    total: int

@app.api()
def ott_movie_list(req: MovieListReq) -> Res[MovieListRes]:

    total_q = db.select(db.func.count(Movie.pk))
    total = db.session.execute(total_q).scalar() or 0

    q = db.select(Movie) \
        .options(joinedload(Movie.genres)) \
        .order_by(Movie.popularity.desc()) \
        .limit(req.limit) \
        .offset(req.offset)
    movies = list(db.session.execute(q).unique().scalars())

    return ok(MovieListRes(
        movies=[MovieItem.from_model(m) for m in movies],
        total=total
    ))

class MovieDetailReq(BaseModel):
    movie_pk: int

class MovieGenreDetail(BaseModel):
    pk: int
    name_ko: str | None
    name_en: str

class MovieKeywordDetail(BaseModel):
    pk: int
    name: str

class MovieDetailRes(BaseModel):
    pk: int
    title_ko: str | None
    title_en: str
    original_title: str
    overview_ko: str | None
    overview_en: str
    tagline_ko: str | None
    tagline_en: str | None
    poster_path: str | None
    backdrop_path: str | None
    release_date: str
    runtime: int | None
    vote_average: float
    vote_count: int
    popularity: float
    adult: bool
    director: str | None
    cast_names: str | None
    genres: list[MovieGenreDetail]
    keywords: list[MovieKeywordDetail]

    review_nlp_score: float | None
    overview_keywords: list[str]
    reviews_keywords: list[str]

@app.api()
def ott_movie_detail(req: MovieDetailReq) -> Res[MovieDetailRes]:

    q = db.select(Movie) \
        .options(
            joinedload(Movie.genres),
            joinedload(Movie.keywords),
            joinedload(Movie.nlp_data)
        ) \
        .filter(Movie.pk == req.movie_pk)

    movie = db.session.execute(q).unique().scalar_one_or_none()

    if not movie:
        raise ValueError(f"Movie not found: {req.movie_pk}")

    return ok(MovieDetailRes(
        pk=movie.pk,
        title_ko=movie.title_ko,
        title_en=movie.title_en,
        original_title=movie.original_title,
        overview_ko=movie.overview_ko,
        overview_en=movie.overview_en,
        tagline_ko=movie.tagline_ko,
        tagline_en=movie.tagline_en,
        poster_path=movie.poster_path,
        backdrop_path=movie.backdrop_path,
        release_date=movie.release_date,
        runtime=movie.runtime,
        vote_average=movie.vote_average,
        vote_count=movie.vote_count,
        popularity=movie.popularity,
        adult=movie.adult,
        director=movie.director,
        cast_names=movie.cast_names,
        genres=[
            MovieGenreDetail(
                pk=g.pk,
                name_ko=g.name_ko,
                name_en=g.name_en
            ) for g in movie.genres
        ],
        keywords=[
            MovieKeywordDetail(
                pk=k.pk,
                name=k.name
            ) for k in movie.keywords
        ],

        review_nlp_score=int(round(movie.nlp_data.review_nlp_score * 100)) if movie.nlp_data else None,
        overview_keywords=movie.nlp_data.overview_keywords if movie.nlp_data else [],
        reviews_keywords=movie.nlp_data.reviews_keywords if movie.nlp_data else []
    ))

class MovieRecommendReq(BaseModel):
    movie_pk: int
    top_n: int = 10

class RecommendedMovie(BaseModel):
    pk: int
    title_ko: str | None
    title_en: str
    poster_path: str | None
    similarity_score: int
    genres: list[str]
    review_nlp_score: int | None
    rating_predict: int | None
    keywords: list[str]

class MovieRecommendRes(BaseModel):
    recommended_movies: list[RecommendedMovie]

@app.api()
def ott_movie_recommend(req: MovieRecommendReq) -> Res[MovieRecommendRes]:
    from was.blueprints.front import bg

    user_pk = bg.user.pk if bg.user else None

    base_movie = db.session.get(Movie, req.movie_pk)
    if not base_movie:
        raise ValueError(f"Movie not found: {req.movie_pk}")

    if user_pk:
        prediction_query = (
            db.select(MoviePrediction)
            .filter(MoviePrediction.user_pk == user_pk)
            .filter(MoviePrediction.base_tmdb_movie_pk == req.movie_pk)
            .order_by(MoviePrediction.rating_predict.desc())
            .limit(req.top_n)
        )
        predictions = list(db.session.execute(prediction_query).scalars())
    else:

        similarity_query = (
            db.select(MovieSimilarity)
            .filter(MovieSimilarity.source_movie_pk == req.movie_pk)
            .order_by(MovieSimilarity.similarity_score.desc())
            .limit(req.top_n)
        )
        predictions = list(db.session.execute(similarity_query).scalars())

    recommended_movies = []

    if user_pk and predictions and isinstance(predictions[0], MoviePrediction):

        for pred in predictions:
            movie = db.session.execute(
                db.select(Movie)
                .options(
                    joinedload(Movie.genres),
                    joinedload(Movie.nlp_data)
                )
                .filter(Movie.pk == pred.recommended_tmdb_movie_pk)
            ).unique().scalar_one_or_none()

            if movie:

                all_keywords = []
                if movie.nlp_data:
                    all_keywords = list(set(movie.nlp_data.overview_keywords + movie.nlp_data.reviews_keywords))

                rating_predict_score = int(round(pred.rating_predict * 20))

                recommended_movies.append(RecommendedMovie(
                    pk=movie.pk,
                    title_ko=movie.title_ko,
                    title_en=movie.title_en,
                    poster_path=movie.poster_path,
                    similarity_score=100,
                    genres=[g.name_ko or g.name_en for g in movie.genres],
                    review_nlp_score=int(round(movie.nlp_data.review_nlp_score * 100)) if movie.nlp_data else None,
                    rating_predict=rating_predict_score,
                    keywords=all_keywords
                ))
    else:

        for sim in predictions:
            movie = db.session.execute(
                db.select(Movie)
                .options(
                    joinedload(Movie.genres),
                    joinedload(Movie.nlp_data)
                )
                .filter(Movie.pk == sim.target_movie_pk)
            ).unique().scalar_one_or_none()

            if movie:
                all_keywords = []
                if movie.nlp_data:
                    all_keywords = list(set(movie.nlp_data.overview_keywords + movie.nlp_data.reviews_keywords))

                recommended_movies.append(RecommendedMovie(
                    pk=movie.pk,
                    title_ko=movie.title_ko,
                    title_en=movie.title_en,
                    poster_path=movie.poster_path,
                    similarity_score=int(round(sim.similarity_score * 100)),
                    genres=[g.name_ko or g.name_en for g in movie.genres],
                    review_nlp_score=int(round(movie.nlp_data.review_nlp_score * 100)) if movie.nlp_data else None,
                    rating_predict=None,
                    keywords=all_keywords
                ))

    return ok(MovieRecommendRes(
        recommended_movies=recommended_movies
    ))

class UserMovieRecommendReq(BaseModel):
    top_n: int = 10

class UserMovieRecommendRes(BaseModel):
    selected_movie_title: str
    selected_movie_pk: int
    recommended_movies: list[RecommendedMovie]

@app.api()
def ott_user_movie_recommend(req: UserMovieRecommendReq) -> Res[UserMovieRecommendRes]:
    from was.blueprints.front import bg

    assert bg.user is not None
    user_pk = bg.user.pk

    selected_movielens_movie_id = None
    selected_movie_title = None
    similarities = []

    for rating_threshold in range(50, 0, -1):
        threshold = rating_threshold / 10.0

        high_ratings_query = (
            db.select(MovieRating)
            .filter(MovieRating.user_pk == user_pk)
            .filter(MovieRating.rating >= threshold)
        )
        high_ratings = list(db.session.execute(high_ratings_query).scalars())

        if not high_ratings:
            continue

        selected_rating = random.choice(high_ratings)
        selected_movielens_movie_id = selected_rating.movie_pk

        movielens_movie = db.session.get(MovieLensMovie, selected_movielens_movie_id)
        if movielens_movie:
            selected_movie_title = movielens_movie.title

            similarity_query = (
                db.select(MovieLensTMDBSimilarity)
                .filter(MovieLensTMDBSimilarity.movielens_movie_id == selected_movielens_movie_id)
                .order_by(MovieLensTMDBSimilarity.similarity_score.desc())
                .limit(req.top_n)
            )
            similarities = list(db.session.execute(similarity_query).scalars())

            if similarities:
                break

    recommended_movies = []
    for sim in similarities:
        movie = db.session.execute(
            db.select(Movie)
            .options(
                joinedload(Movie.genres),
                joinedload(Movie.nlp_data)
            )
            .filter(Movie.pk == sim.tmdb_movie_pk)
        ).unique().scalar_one_or_none()

        if movie:

            all_keywords = []
            if movie.nlp_data:
                all_keywords = list(set(movie.nlp_data.overview_keywords + movie.nlp_data.reviews_keywords))

            prediction = db.session.execute(
                db.select(MoviePrediction)
                .filter(MoviePrediction.user_pk == user_pk)
                .filter(MoviePrediction.recommended_tmdb_movie_pk == movie.pk)
            ).scalars().first()

            rating_predict_score = int(round(prediction.rating_predict * 20)) if prediction else None

            recommended_movies.append(RecommendedMovie(
                pk=movie.pk,
                title_ko=movie.title_ko,
                title_en=movie.title_en,
                poster_path=movie.poster_path,
                similarity_score=int(round(sim.similarity_score * 100)),
                genres=[g.name_ko or g.name_en for g in movie.genres],
                review_nlp_score=int(round(movie.nlp_data.review_nlp_score * 100)) if movie.nlp_data else None,
                rating_predict=rating_predict_score,
                keywords=all_keywords
            ))

    return ok(UserMovieRecommendRes(
        selected_movie_title=selected_movie_title,
        selected_movie_pk=selected_movielens_movie_id,
        recommended_movies=recommended_movies
    ))

class UserMovieRecommendMultipleReq(BaseModel):
    count: int = 3
    top_n: int = 20

class UserMovieRecommendMultipleRes(BaseModel):
    recommendations: list[UserMovieRecommendRes]

@app.api()
def ott_user_movie_recommend_multiple(req: UserMovieRecommendMultipleReq) -> Res[UserMovieRecommendMultipleRes]:
    from was.blueprints.front import bg

    assert bg.user is not None
    user_pk = bg.user.pk

    recommendations = []
    selected_movie_ids = set()

    for _ in range(req.count):
        selected_movielens_movie_id = None
        selected_movie_title = None
        similarities = []

        for rating_threshold in range(50, 0, -1):
            threshold = rating_threshold / 10.0

            high_ratings_query = (
                db.select(MovieRating)
                .filter(MovieRating.user_pk == user_pk)
                .filter(MovieRating.rating >= threshold)
            )
            high_ratings = list(db.session.execute(high_ratings_query).scalars())

            if not high_ratings:
                continue

            available_ratings = [r for r in high_ratings if r.movie_pk not in selected_movie_ids]

            if not available_ratings:
                continue

            selected_rating = random.choice(available_ratings)
            selected_movielens_movie_id = selected_rating.movie_pk
            selected_movie_ids.add(selected_movielens_movie_id)

            movielens_movie = db.session.get(MovieLensMovie, selected_movielens_movie_id)
            if movielens_movie:
                selected_movie_title = movielens_movie.title

                similarity_query = (
                    db.select(MovieLensTMDBSimilarity)
                    .filter(MovieLensTMDBSimilarity.movielens_movie_id == selected_movielens_movie_id)
                    .order_by(MovieLensTMDBSimilarity.similarity_score.desc())
                    .limit(req.top_n)
                )
                similarities = list(db.session.execute(similarity_query).scalars())

                if similarities:
                    break

        if similarities:
            recommended_movies = []
            for sim in similarities:
                movie = db.session.execute(
                    db.select(Movie)
                    .options(
                        joinedload(Movie.genres),
                        joinedload(Movie.nlp_data)
                    )
                    .filter(Movie.pk == sim.tmdb_movie_pk)
                ).unique().scalar_one_or_none()

                if movie:

                    all_keywords = []
                    if movie.nlp_data:
                        all_keywords = list(set(movie.nlp_data.overview_keywords + movie.nlp_data.reviews_keywords))

                    prediction = db.session.execute(
                        db.select(MoviePrediction)
                        .filter(MoviePrediction.user_pk == user_pk)
                        .filter(MoviePrediction.recommended_tmdb_movie_pk == movie.pk)
                    ).scalars().first()

                    rating_predict_score = int(round(prediction.rating_predict * 20)) if prediction else None

                    recommended_movies.append(RecommendedMovie(
                        pk=movie.pk,
                        title_ko=movie.title_ko,
                        title_en=movie.title_en,
                        poster_path=movie.poster_path,
                        similarity_score=int(round(sim.similarity_score * 100)),
                        genres=[g.name_ko or g.name_en for g in movie.genres],
                        review_nlp_score=int(round(movie.nlp_data.review_nlp_score * 100)) if movie.nlp_data else None,
                        rating_predict=rating_predict_score,
                        keywords=all_keywords
                    ))

            recommendations.append(UserMovieRecommendRes(
                selected_movie_title=selected_movie_title,
                selected_movie_pk=selected_movielens_movie_id,
                recommended_movies=recommended_movies
            ))

    return ok(UserMovieRecommendMultipleRes(
        recommendations=recommendations
    ))