import random
from datetime import datetime, timedelta

from sqlalchemy.orm import joinedload

from ex.api import BaseModel, Res, ok
from was.blueprints.front import app, bg
from was.model import db
from was.model.pattern import PatternTVSchedule, PatternTVViewingLog, PatternProgram
from was.model.user import User

class PatternScheduleReq(BaseModel):
    day: str

class PatternScheduleProgram(BaseModel):
    channel: str
    time: str
    program_name: str
    genre: str

class PatternScheduleRes(BaseModel):
    programs: list[PatternScheduleProgram]

    @classmethod
    def from_model(cls, schedule: PatternTVSchedule) -> 'PatternScheduleProgram':
        return PatternScheduleProgram(
            channel=schedule.channel,
            time=schedule.time,
            program_name=schedule.program.name_ko,
            genre=schedule.program.genre_ko
        )

@app.api()
def pattern_schedule(req: PatternScheduleReq) -> Res[PatternScheduleRes]:

    q = db.select(PatternTVSchedule) \
        .options(joinedload(PatternTVSchedule.program)) \
        .filter(PatternTVSchedule.day_of_week == req.day)
    schedules = db.session.execute(q).scalars()

    return ok(PatternScheduleRes(programs=list(map(lambda x: PatternScheduleRes.from_model(x), schedules))))

class PatternViewingHistoryReq(BaseModel):
    quarter: str

class PatternViewingHistoryLog(BaseModel):
    date: str
    time: str
    channel: str
    program_name: str
    genre: str

class PatternViewingHistoryRes(BaseModel):
    logs: list[PatternViewingHistoryLog]

    @classmethod
    def from_model(cls, log: PatternTVViewingLog) -> 'PatternViewingHistoryLog':
        return PatternViewingHistoryLog(
            date=log.view_date.isoformat(),
            time=log.view_time,
            channel=log.channel,
            program_name=log.program.name_ko,
            genre=log.program.genre_ko
        )

@app.api()
def pattern_viewing_history(req: PatternViewingHistoryReq) -> Res[PatternViewingHistoryRes]:
    assert bg.user is not None

    q = db.select(PatternTVViewingLog) \
        .options(joinedload(PatternTVViewingLog.program)) \
        .filter(PatternTVViewingLog.user_pk == bg.user.pk,
                PatternTVViewingLog.quarter == req.quarter) \
        .order_by(PatternTVViewingLog.view_date.asc(), PatternTVViewingLog.view_time.asc())
    logs = db.session.execute(q).scalars()

    return ok(PatternViewingHistoryRes(logs=list(map(lambda x: PatternViewingHistoryRes.from_model(x), logs))))

def parse_age_group(age_str: str) -> int:
    if age_str == "56+":
        return 7
    if "-" in age_str:
        _, high = age_str.split("-")
        high_num = int(high)
        if high_num <= 17:
            return 1
        elif high_num <= 24:
            return 2
        elif high_num <= 34:
            return 3
        elif high_num <= 44:
            return 4
        elif high_num <= 49:
            return 5
        elif high_num <= 55:
            return 6
    return 7

def genre_weights(user: User) -> dict[str, float]:
    weights: dict[str, float] = {g: 1.0 for g in ["뉴스", "드라마", "예능", "영화", "스포츠", "다큐", "애니", "음악", "홈쇼핑", "시사"]}
    age_group = parse_age_group(user.age)
    occ = str(user.occupation).lower()

    if age_group == 1:
        for g in ["애니", "예능", "스포츠"]:
            weights[g] += 3
    elif age_group == 2:
        for g in ["예능", "드라마", "음악", "영화"]:
            weights[g] += 2
    elif age_group == 3:
        for g in ["드라마", "예능", "뉴스", "영화"]:
            weights[g] += 2
    elif age_group == 4:
        for g in ["뉴스", "시사", "드라마", "다큐"]:
            weights[g] += 2
    elif age_group >= 5:
        for g in ["뉴스", "다큐", "영화"]:
            weights[g] += 3

    if "scientist" in occ or "doctor" in occ or "educator" in occ:
        for g in ["다큐", "뉴스"]:
            weights[g] += 3
    if "artist" in occ or "entertainment" in occ or "writer" in occ:
        for g in ["예능", "음악", "영화"]:
            weights[g] += 3
    if "student" in occ:
        for g in ["애니", "예능", "음악"]:
            weights[g] += 3
    if "retired" in occ:
        for g in ["뉴스", "다큐", "영화"]:
            weights[g] += 3

    return weights

def calculate_user_genre_preference(user_pk: int) -> dict[str, float]:
    q = db.select(PatternTVViewingLog) \
        .options(joinedload(PatternTVViewingLog.program)) \
        .filter(PatternTVViewingLog.user_pk == user_pk)
    logs = list(db.session.execute(q).scalars())

    if not logs:
        return {}

    genre_counts: dict[str, int] = {}
    for log in logs:
        genre = log.program.genre_ko
        genre_counts[genre] = genre_counts.get(genre, 0) + 1

    total = sum(genre_counts.values())
    return {g: count / total for g, count in genre_counts.items()}

def combined_genre_weights(user: User) -> dict[str, float]:
    base_w = genre_weights(user)
    hist_w = calculate_user_genre_preference(user.pk)

    for g in base_w.keys():
        base_w[g] = base_w[g] + hist_w.get(g, 0) * 5

    return base_w

class PatternRecommendationsReq(BaseModel):
    date: str
    time: str

class PatternRecommendation(BaseModel):
    channel: str
    program_name: str
    genre: str
    score: float
    thumbnail_url: str | None

class PatternRecommendationsRes(BaseModel):
    recommendations: list[PatternRecommendation]
    genre_preferences: dict[str, float]

    @classmethod
    def from_schedule(cls, schedule: PatternTVSchedule, score: float) -> PatternRecommendation:
        return PatternRecommendation(
            channel=schedule.channel,
            program_name=schedule.program.name_ko,
            genre=schedule.program.genre_ko,
            score=score,
            thumbnail_url=schedule.program.thumbnail_url
        )

@app.api()
def pattern_recommendations(req: PatternRecommendationsReq) -> Res[PatternRecommendationsRes]:
    assert bg.user is not None

    w = combined_genre_weights(bg.user)
    total = sum(w.values())
    probs = {g: w[g] / total for g in w}

    base_dt = datetime.strptime(f"{req.date} {req.time}", "%Y-%m-%d %H:%M")
    days_map = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"]
    day_name = days_map[base_dt.weekday()]

    q = db.select(PatternTVSchedule) \
        .options(joinedload(PatternTVSchedule.program).joinedload(PatternProgram.asset)) \
        .filter(PatternTVSchedule.day_of_week == day_name,
                PatternTVSchedule.time == req.time)
    schedules = list(db.session.execute(q).scalars())

    if not schedules:
        return ok(PatternRecommendationsRes(
            recommendations=[],
            genre_preferences={k: round(v, 4) for k, v in probs.items()}
        ))

    top_k = min(30, len(schedules))
    chosen_genres = random.choices(
        list(probs.keys()),
        weights=list(probs.values()),
        k=top_k
    )

    recommendations: list[PatternRecommendation] = []
    selected_channels: set[str] = set()

    for genre in chosen_genres:

        candidates = [s for s in schedules
                      if s.program.genre_ko == genre
                      and s.channel not in selected_channels]

        if not candidates:
            candidates = [s for s in schedules
                          if s.channel not in selected_channels]

        if candidates:
            selected = random.choice(candidates)
            selected_channels.add(selected.channel)

            actual_genre = selected.program.genre_ko
            score = probs.get(actual_genre, 0.0)

            recommendations.append(
                PatternRecommendationsRes.from_schedule(selected, score)
            )

    recommendations.sort(key=lambda x: x.score, reverse=True)

    return ok(PatternRecommendationsRes(
        recommendations=recommendations,
        genre_preferences={k: round(v, 4) for k, v in probs.items()}
    ))