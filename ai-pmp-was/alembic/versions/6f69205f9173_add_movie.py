from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '6f69205f9173'
down_revision: Union[str, None] = 'a3f5b91cb5fd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:

    op.create_table('movie',
    sa.Column('pk', sa.Integer(), nullable=False, comment='TMDB movie ID'),
    sa.Column('release_date', sa.String(length=20), nullable=False, comment='개봉일 (YYYY-MM-DD)'),
    sa.Column('runtime', sa.Integer(), nullable=True, comment='러닝타임 (분)'),
    sa.Column('vote_average', sa.Float(), nullable=False, comment='평점'),
    sa.Column('vote_count', sa.Integer(), nullable=False, comment='투표 수'),
    sa.Column('popularity', sa.Float(), nullable=False, comment='인기도'),
    sa.Column('adult', sa.Boolean(), nullable=False, comment='성인 여부'),
    sa.Column('poster_path', sa.String(length=200), nullable=True, comment='포스터 경로'),
    sa.Column('backdrop_path', sa.String(length=200), nullable=True, comment='배경 이미지 경로'),
    sa.Column('title_en', sa.String(length=500), nullable=False, comment='영어 제목'),
    sa.Column('original_title', sa.String(length=500), nullable=False, comment='원제'),
    sa.Column('overview_en', sa.Text(), nullable=False, comment='영어 줄거리'),
    sa.Column('tagline_en', sa.String(length=500), nullable=True, comment='영어 태그라인'),
    sa.Column('title_ko', sa.String(length=500), nullable=True, comment='한글 제목'),
    sa.Column('overview_ko', sa.Text(), nullable=True, comment='한글 줄거리'),
    sa.Column('tagline_ko', sa.String(length=500), nullable=True, comment='한글 태그라인'),
    sa.Column('director', sa.String(length=200), nullable=True, comment='감독'),
    sa.Column('cast_names', sa.Text(), nullable=True, comment='주요 출연진 (comma separated)'),
    sa.Column('csv_reviews', sa.Text(), nullable=True, comment='CSV reviews 컬럼 (원본)'),
    sa.Column('create_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('update_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('pk'),
    comment='TMDB 영화 정보'
    )
    op.create_index('idx_movie_release_date', 'movie', ['release_date'], unique=False)
    op.create_index('idx_movie_title_en', 'movie', ['title_en'], unique=False)
    op.create_index('idx_movie_title_ko', 'movie', ['title_ko'], unique=False)
    op.create_table('movie_genre_master',
    sa.Column('pk', sa.Integer(), nullable=False, comment='TMDB genre ID (28, 80, 53, ...)'),
    sa.Column('name_en', sa.String(length=100), nullable=False, comment='영어 장르명 (Action, Crime, ...)'),
    sa.Column('name_ko', sa.String(length=100), nullable=True, comment='한글 장르명 (액션, 범죄, ...)'),
    sa.Column('create_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('pk'),
    comment='영화 장르 마스터'
    )
    op.create_index('idx_movie_genre_name_en', 'movie_genre_master', ['name_en'], unique=False)
    op.create_table('movie_keyword_master',
    sa.Column('pk', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('tmdb_id', sa.Integer(), nullable=False, comment='TMDB keyword ID'),
    sa.Column('name', sa.String(length=200), nullable=False, comment='키워드명'),
    sa.Column('create_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('pk'),
    sa.UniqueConstraint('tmdb_id'),
    comment='영화 키워드 마스터'
    )
    op.create_index('idx_movie_keyword_name', 'movie_keyword_master', ['name'], unique=False)
    op.create_table('movie_lens_movie',
    sa.Column('movie_id', sa.Integer(), nullable=False, comment='MovieLens movie ID'),
    sa.Column('title', sa.String(length=500), nullable=False, comment='영화 제목 (연도 포함)'),
    sa.Column('title_clean', sa.String(length=500), nullable=False, comment='영화 제목 (연도 제거, 소문자)'),
    sa.Column('year', sa.String(length=10), nullable=True, comment='개봉 연도'),
    sa.Column('genres', sa.String(length=200), nullable=False, comment='장르 (파이프 구분)'),
    sa.Column('create_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('movie_id'),
    comment='MovieLens 영화 정보 (제목 매칭용)'
    )
    op.create_index('idx_movielens_title_clean', 'movie_lens_movie', ['title_clean'], unique=False)
    op.create_index('idx_movielens_year', 'movie_lens_movie', ['year'], unique=False)
    op.create_table('movie_rating',
    sa.Column('pk', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('user_pk', sa.Integer(), nullable=False, comment='User PK (1-100)'),
    sa.Column('movie_pk', sa.Integer(), nullable=False, comment='MovieLens movie ID'),
    sa.Column('rating', sa.Float(), nullable=False, comment='평점 (0.5 ~ 5.0)'),
    sa.Column('timestamp', sa.Integer(), nullable=True, comment='평점 시간 (Unix timestamp)'),
    sa.Column('create_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('pk'),
    comment='MovieLens 평점 데이터'
    )
    op.create_index('idx_rating_movie', 'movie_rating', ['movie_pk'], unique=False)
    op.create_index('idx_rating_score', 'movie_rating', ['rating'], unique=False)
    op.create_index('idx_rating_user', 'movie_rating', ['user_pk'], unique=False)
    op.create_table('movie_genre',
    sa.Column('movie_pk', sa.Integer(), nullable=False),
    sa.Column('movie_genre_master_pk', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['movie_genre_master_pk'], ['movie_genre_master.pk'], ),
    sa.ForeignKeyConstraint(['movie_pk'], ['movie.pk'], ),
    sa.PrimaryKeyConstraint('movie_pk', 'movie_genre_master_pk')
    )
    op.create_table('movie_keyword',
    sa.Column('movie_pk', sa.Integer(), nullable=False),
    sa.Column('movie_keyword_master_pk', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['movie_keyword_master_pk'], ['movie_keyword_master.pk'], ),
    sa.ForeignKeyConstraint(['movie_pk'], ['movie.pk'], ),
    sa.PrimaryKeyConstraint('movie_pk', 'movie_keyword_master_pk')
    )
    op.create_table('movie_nlp',
    sa.Column('movie_pk', sa.Integer(), nullable=False, comment='TMDB movie ID'),
    sa.Column('review_nlp_score', sa.Float(), nullable=False, comment='NLP 기반 리뷰 점수 (0~10)'),
    sa.Column('overview_keywords', sa.ARRAY(sa.String()), nullable=False, comment='overview에서 추출한 키워드 리스트'),
    sa.Column('reviews_keywords', sa.ARRAY(sa.String()), nullable=False, comment='reviews에서 추출한 키워드 리스트'),
    sa.Column('create_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['movie_pk'], ['movie.pk'], ),
    sa.PrimaryKeyConstraint('movie_pk'),
    comment='영화 NLP 데이터 (키워드 + 리뷰 점수)'
    )
    op.create_table('movie_prediction',
    sa.Column('pk', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('user_pk', sa.Integer(), nullable=False, comment='User PK (1-100)'),
    sa.Column('base_tmdb_movie_pk', sa.Integer(), nullable=False, comment='기준 TMDB 영화 PK (클릭한 영화)'),
    sa.Column('recommended_tmdb_movie_pk', sa.Integer(), nullable=False, comment='추천된 TMDB 영화 PK'),
    sa.Column('rating_predict', sa.Float(), nullable=False, comment='예측 평점 (0.0 ~ 5.0)'),
    sa.Column('create_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['base_tmdb_movie_pk'], ['movie.pk'], ),
    sa.ForeignKeyConstraint(['recommended_tmdb_movie_pk'], ['movie.pk'], ),
    sa.PrimaryKeyConstraint('pk'),
    comment='사용자별 영화 예측 평점 (ML 모델)'
    )
    op.create_index('idx_prediction_base_movie', 'movie_prediction', ['base_tmdb_movie_pk'], unique=False)
    op.create_index('idx_prediction_user', 'movie_prediction', ['user_pk'], unique=False)
    op.create_index('idx_prediction_user_base', 'movie_prediction', ['user_pk', 'base_tmdb_movie_pk'], unique=False)
    op.create_table('movie_similarity',
    sa.Column('pk', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('source_movie_pk', sa.Integer(), nullable=False, comment='기준 영화 PK'),
    sa.Column('target_movie_pk', sa.Integer(), nullable=False, comment='유사한 영화 PK'),
    sa.Column('similarity_score', sa.Float(), nullable=False, comment='유사도 점수 (0~1)'),
    sa.Column('title_similarity', sa.Float(), nullable=False, comment='제목 유사도'),
    sa.Column('genre_similarity', sa.Float(), nullable=False, comment='장르 유사도'),
    sa.Column('year_similarity', sa.Float(), nullable=False, comment='연도 유사도'),
    sa.Column('create_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['source_movie_pk'], ['movie.pk'], ),
    sa.ForeignKeyConstraint(['target_movie_pk'], ['movie.pk'], ),
    sa.PrimaryKeyConstraint('pk'),
    comment='영화 간 유사도 (사전 계산)'
    )
    op.create_index('idx_similarity_score', 'movie_similarity', ['similarity_score'], unique=False)
    op.create_index('idx_similarity_source', 'movie_similarity', ['source_movie_pk'], unique=False)
    op.create_index('idx_similarity_target', 'movie_similarity', ['target_movie_pk'], unique=False)
    op.create_table('movielens_tmdb_similarity',
    sa.Column('pk', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('movielens_movie_id', sa.Integer(), nullable=False, comment='MovieLens movie ID'),
    sa.Column('tmdb_movie_pk', sa.Integer(), nullable=False, comment='TMDB movie PK'),
    sa.Column('similarity_score', sa.Float(), nullable=False, comment='최종 유사도 (0.4*title + 0.4*genre + 0.2*year)'),
    sa.Column('title_similarity', sa.Float(), nullable=False, comment='제목 유사도'),
    sa.Column('genre_similarity', sa.Float(), nullable=False, comment='장르 유사도'),
    sa.Column('year_similarity', sa.Float(), nullable=False, comment='연도 유사도'),
    sa.Column('create_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['movielens_movie_id'], ['movie_lens_movie.movie_id'], ),
    sa.ForeignKeyConstraint(['tmdb_movie_pk'], ['movie.pk'], ),
    sa.PrimaryKeyConstraint('pk'),
    comment='MovieLens-TMDB 유사도 (사전 계산)'
    )
    op.create_index('idx_movielens_tmdb_sim_source', 'movielens_tmdb_similarity', ['movielens_movie_id', 'similarity_score'], unique=False)
    op.create_table('scene_timestamp_actor',
    sa.Column('scene_timestamp_pk', sa.Integer(), nullable=False),
    sa.Column('scene_actor_pk', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['scene_actor_pk'], ['scene_actor.pk'], ),
    sa.ForeignKeyConstraint(['scene_timestamp_pk'], ['scene_timestamp.pk'], ),
    sa.PrimaryKeyConstraint('scene_timestamp_pk', 'scene_actor_pk')
    )
    op.drop_index('idx_scene_timestamp_actor', table_name='scene_timestamp')
    op.drop_constraint('scene_timestamp_actor_pk_fkey', 'scene_timestamp', type_='foreignkey')
    op.drop_column('scene_timestamp', 'actor_pk')

def downgrade() -> None:

    op.add_column('scene_timestamp', sa.Column('actor_pk', sa.INTEGER(), autoincrement=False, nullable=True, comment='배우 FK'))
    op.create_foreign_key('scene_timestamp_actor_pk_fkey', 'scene_timestamp', 'scene_actor', ['actor_pk'], ['pk'])
    op.create_index('idx_scene_timestamp_actor', 'scene_timestamp', ['actor_pk'], unique=False)
    op.drop_table('scene_timestamp_actor')
    op.drop_index('idx_movielens_tmdb_sim_source', table_name='movielens_tmdb_similarity')
    op.drop_table('movielens_tmdb_similarity')
    op.drop_index('idx_similarity_target', table_name='movie_similarity')
    op.drop_index('idx_similarity_source', table_name='movie_similarity')
    op.drop_index('idx_similarity_score', table_name='movie_similarity')
    op.drop_table('movie_similarity')
    op.drop_index('idx_prediction_user_base', table_name='movie_prediction')
    op.drop_index('idx_prediction_user', table_name='movie_prediction')
    op.drop_index('idx_prediction_base_movie', table_name='movie_prediction')
    op.drop_table('movie_prediction')
    op.drop_table('movie_nlp')
    op.drop_table('movie_keyword')
    op.drop_table('movie_genre')
    op.drop_index('idx_rating_user', table_name='movie_rating')
    op.drop_index('idx_rating_score', table_name='movie_rating')
    op.drop_index('idx_rating_movie', table_name='movie_rating')
    op.drop_table('movie_rating')
    op.drop_index('idx_movielens_year', table_name='movie_lens_movie')
    op.drop_index('idx_movielens_title_clean', table_name='movie_lens_movie')
    op.drop_table('movie_lens_movie')
    op.drop_index('idx_movie_keyword_name', table_name='movie_keyword_master')
    op.drop_table('movie_keyword_master')
    op.drop_index('idx_movie_genre_name_en', table_name='movie_genre_master')
    op.drop_table('movie_genre_master')
    op.drop_index('idx_movie_title_ko', table_name='movie')
    op.drop_index('idx_movie_title_en', table_name='movie')
    op.drop_index('idx_movie_release_date', table_name='movie')
    op.drop_table('movie')