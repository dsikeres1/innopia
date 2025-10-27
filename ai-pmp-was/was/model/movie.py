from datetime import datetime

from sqlalchemy import String, DateTime, Text, Integer, Float, func, Index, Table, Column, ForeignKey, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from was.model import Model

movie_genre = Table(
    'movie_genre',
    Model.metadata,
    Column('movie_pk', ForeignKey('movie.pk'), primary_key=True),
    Column('movie_genre_master_pk', ForeignKey('movie_genre_master.pk'), primary_key=True),
)

movie_keyword = Table(
    'movie_keyword',
    Model.metadata,
    Column('movie_pk', ForeignKey('movie.pk'), primary_key=True),
    Column('movie_keyword_master_pk', ForeignKey('movie_keyword_master.pk'), primary_key=True),
)

class MovieGenreMaster(Model):
    __tablename__ = 'movie_genre_master'

    pk: Mapped[int] = mapped_column(primary_key=True, comment='TMDB genre ID (28, 80, 53, ...)')
    name_en: Mapped[str] = mapped_column(String(100), comment='영어 장르명 (Action, Crime, ...)')
    name_ko: Mapped[str | None] = mapped_column(String(100), nullable=True, comment='한글 장르명 (액션, 범죄, ...)')

    create_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_movie_genre_name_en', 'name_en'),
        {'comment': '영화 장르 마스터'},
    )

class MovieKeywordMaster(Model):
    __tablename__ = 'movie_keyword_master'

    pk: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    tmdb_id: Mapped[int] = mapped_column(Integer, unique=True, comment='TMDB keyword ID')
    name: Mapped[str] = mapped_column(String(200), comment='키워드명')

    create_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_movie_keyword_name', 'name'),
        {'comment': '영화 키워드 마스터'},
    )

class Movie(Model):
    __tablename__ = 'movie'

    pk: Mapped[int] = mapped_column(primary_key=True, comment='TMDB movie ID')

    release_date: Mapped[str] = mapped_column(String(20), comment='개봉일 (YYYY-MM-DD)')
    runtime: Mapped[int | None] = mapped_column(Integer, nullable=True, comment='러닝타임 (분)')
    vote_average: Mapped[float] = mapped_column(Float, comment='평점')
    vote_count: Mapped[int] = mapped_column(Integer, comment='투표 수')
    popularity: Mapped[float] = mapped_column(Float, comment='인기도')
    adult: Mapped[bool] = mapped_column(comment='성인 여부')

    poster_path: Mapped[str | None] = mapped_column(String(200), nullable=True, comment='포스터 경로')
    backdrop_path: Mapped[str | None] = mapped_column(String(200), nullable=True, comment='배경 이미지 경로')

    title_en: Mapped[str] = mapped_column(String(500), comment='영어 제목')
    original_title: Mapped[str] = mapped_column(String(500), comment='원제')
    overview_en: Mapped[str] = mapped_column(Text, comment='영어 줄거리')
    tagline_en: Mapped[str | None] = mapped_column(String(500), nullable=True, comment='영어 태그라인')

    title_ko: Mapped[str | None] = mapped_column(String(500), nullable=True, comment='한글 제목')
    overview_ko: Mapped[str | None] = mapped_column(Text, nullable=True, comment='한글 줄거리')
    tagline_ko: Mapped[str | None] = mapped_column(String(500), nullable=True, comment='한글 태그라인')

    director: Mapped[str | None] = mapped_column(String(200), nullable=True, comment='감독')
    cast_names: Mapped[str | None] = mapped_column(Text, nullable=True, comment='주요 출연진 (comma separated)')

    csv_reviews: Mapped[str | None] = mapped_column(Text, nullable=True, comment='CSV reviews 컬럼 (원본)')

    create_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    update_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    genres: Mapped[list['MovieGenreMaster']] = relationship(secondary=movie_genre, lazy='joined')
    keywords: Mapped[list['MovieKeywordMaster']] = relationship(secondary=movie_keyword, lazy='joined')
    nlp_data: Mapped['MovieNLP'] = relationship(back_populates='movie', uselist=False)

    __table_args__ = (
        Index('idx_movie_title_en', 'title_en'),
        Index('idx_movie_title_ko', 'title_ko'),
        Index('idx_movie_release_date', 'release_date'),
        {'comment': 'TMDB 영화 정보'},
    )

class MovieNLP(Model):
    __tablename__ = 'movie_nlp'

    movie_pk: Mapped[int] = mapped_column(
        ForeignKey('movie.pk'),
        primary_key=True,
        comment='TMDB movie ID'
    )

    review_nlp_score: Mapped[float] = mapped_column(
        Float,
        comment='NLP 기반 리뷰 점수 (0~10)'
    )

    overview_keywords: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        comment='overview에서 추출한 키워드 리스트'
    )

    reviews_keywords: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        comment='reviews에서 추출한 키워드 리스트'
    )

    create_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    movie: Mapped['Movie'] = relationship(back_populates='nlp_data')

    __table_args__ = (
        {'comment': '영화 NLP 데이터 (키워드 + 리뷰 점수)'},
    )

class MovieLensMovie(Model):
    __tablename__ = 'movie_lens_movie'

    movie_id: Mapped[int] = mapped_column(Integer, primary_key=True, comment='MovieLens movie ID')
    title: Mapped[str] = mapped_column(String(500), comment='영화 제목 (연도 포함)')
    title_clean: Mapped[str] = mapped_column(String(500), comment='영화 제목 (연도 제거, 소문자)')
    year: Mapped[str | None] = mapped_column(String(10), nullable=True, comment='개봉 연도')
    genres: Mapped[str] = mapped_column(String(200), comment='장르 (파이프 구분)')

    create_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_movielens_title_clean', 'title_clean'),
        Index('idx_movielens_year', 'year'),
        {'comment': 'MovieLens 영화 정보 (제목 매칭용)'},
    )

class MovieRating(Model):
    __tablename__ = 'movie_rating'

    pk: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    user_pk: Mapped[int] = mapped_column(Integer, comment='User PK (1-100)')
    movie_pk: Mapped[int] = mapped_column(Integer, comment='MovieLens movie ID')

    rating: Mapped[float] = mapped_column(Float, comment='평점 (0.5 ~ 5.0)')
    timestamp: Mapped[int | None] = mapped_column(Integer, nullable=True, comment='평점 시간 (Unix timestamp)')

    create_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_rating_user', 'user_pk'),
        Index('idx_rating_movie', 'movie_pk'),
        Index('idx_rating_score', 'rating'),
        {'comment': 'MovieLens 평점 데이터'},
    )

class MovieSimilarity(Model):
    __tablename__ = 'movie_similarity'

    pk: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    source_movie_pk: Mapped[int] = mapped_column(
        ForeignKey('movie.pk'),
        comment='기준 영화 PK'
    )
    target_movie_pk: Mapped[int] = mapped_column(
        ForeignKey('movie.pk'),
        comment='유사한 영화 PK'
    )

    similarity_score: Mapped[float] = mapped_column(
        Float,
        comment='유사도 점수 (0~1)'
    )

    title_similarity: Mapped[float] = mapped_column(Float, comment='제목 유사도')
    genre_similarity: Mapped[float] = mapped_column(Float, comment='장르 유사도')
    year_similarity: Mapped[float] = mapped_column(Float, comment='연도 유사도')

    create_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_similarity_source', 'source_movie_pk'),
        Index('idx_similarity_target', 'target_movie_pk'),
        Index('idx_similarity_score', 'similarity_score'),
        {'comment': '영화 간 유사도 (사전 계산)'},
    )

class MovieLensTMDBSimilarity(Model):
    __tablename__ = 'movielens_tmdb_similarity'

    pk: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    movielens_movie_id: Mapped[int] = mapped_column(
        ForeignKey('movie_lens_movie.movie_id'),
        comment='MovieLens movie ID'
    )
    tmdb_movie_pk: Mapped[int] = mapped_column(
        ForeignKey('movie.pk'),
        comment='TMDB movie PK'
    )

    similarity_score: Mapped[float] = mapped_column(
        Float,
        comment='최종 유사도 (0.4*title + 0.4*genre + 0.2*year)'
    )

    title_similarity: Mapped[float] = mapped_column(Float, comment='제목 유사도')
    genre_similarity: Mapped[float] = mapped_column(Float, comment='장르 유사도')
    year_similarity: Mapped[float] = mapped_column(Float, comment='연도 유사도')

    create_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_movielens_tmdb_sim_source', 'movielens_movie_id', 'similarity_score'),
        {'comment': 'MovieLens-TMDB 유사도 (사전 계산)'},
    )

class MoviePrediction(Model):
    __tablename__ = 'movie_prediction'

    pk: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    user_pk: Mapped[int] = mapped_column(Integer, comment='User PK (1-100)')
    base_tmdb_movie_pk: Mapped[int] = mapped_column(
        ForeignKey('movie.pk'),
        comment='기준 TMDB 영화 PK (클릭한 영화)'
    )
    recommended_tmdb_movie_pk: Mapped[int] = mapped_column(
        ForeignKey('movie.pk'),
        comment='추천된 TMDB 영화 PK'
    )

    rating_predict: Mapped[float] = mapped_column(
        Float,
        comment='예측 평점 (0.0 ~ 5.0)'
    )

    create_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_prediction_user', 'user_pk'),
        Index('idx_prediction_base_movie', 'base_tmdb_movie_pk'),
        Index('idx_prediction_user_base', 'user_pk', 'base_tmdb_movie_pk'),
        {'comment': '사용자별 영화 예측 평점 (ML 모델)'},
    )