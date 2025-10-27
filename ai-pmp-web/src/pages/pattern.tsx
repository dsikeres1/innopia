import { observer } from "mobx-react-lite";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { LayoutView } from "@/components/layout/LayoutView";
import { PatternRecommendationsTab } from "@/components/pattern/RecommendationsTab";
import PatternHistoryTab from "@/components/pattern/HistoryTab";
import PatternScheduleTab from "@/components/pattern/ScheduleTab";

enum PatternTab {
  SCHEDULE = 'SCHEDULE',
  RECOMMENDATIONS = 'RECOMMENDATIONS',
  HISTORY = 'HISTORY',
}

const PatternPage = observer(() => {
  const router = useRouter();
  const { date, time } = router.query;

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("20:00");
  const [activeTab, setActiveTab] = useState<PatternTab>(PatternTab.SCHEDULE);
  const [selectedDay, setSelectedDay] = useState<string>("");

  const getDayOfWeek = (dateStr: string): string => {
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const date = new Date(dateStr);
    const day = days[date.getDay()];
    return day ?? '월요일';
  };

  const generateTimeOptions = (): string[] => {
    const times: string[] = [];
    for (let h = 0; h < 24; h++) {
      times.push(`${h.toString().padStart(2, '0')}:00`);
      times.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return times;
  };

  const generateDateOptions = (): string[] => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      if (dateStr) {
        dates.push(dateStr);
      }
    }
    return dates;
  };

  const timeOptions = generateTimeOptions();
  const dateOptions = generateDateOptions();

  useEffect(() => {
    if (!selectedDate && dateOptions.length > 0) {
      const firstDate = dateOptions[0];
      if (firstDate) {
        setSelectedDate(firstDate);
      }
    }
  }, [dateOptions, selectedDate]);

  useEffect(() => {
    if (date && typeof date === 'string') {
      const dayOfWeek = getDayOfWeek(date);
      if (selectedDay !== dayOfWeek) {
        setSelectedDay(dayOfWeek);
      }
    }
  }, [date, selectedDay]);

  const hasDateTime = date && time;

  const handleSubmit = () => {
    if (selectedDate && selectedTime) {
      router.push(`/pattern?date=${selectedDate}&time=${selectedTime}`);
    }
  };

  if (hasDateTime) {
    const currentDate = date as string;
    const currentTime = time as string;
    const dayOfWeek = getDayOfWeek(currentDate);

    const mockRecommendations = [
      { channel: "채널1", program: "뉴스데스크", genre: "뉴스", score: 85 },
      { channel: "채널3", program: "사랑의계절", genre: "드라마", score: 82 },
      { channel: "채널7", program: "개그콘서트", genre: "예능", score: 78 },
      { channel: "채널2", program: "영화특선", genre: "영화", score: 75 },
      { channel: "채널5", program: "다큐멘터리", genre: "다큐", score: 72 },
      { channel: "채널9", program: "스포츠중계", genre: "스포츠", score: 70 },
      { channel: "채널4", program: "음악방송", genre: "음악", score: 68 },
      { channel: "채널8", program: "드라마스페셜", genre: "드라마", score: 65 },
      { channel: "채널6", program: "예능쇼", genre: "예능", score: 63 },
      { channel: "채널10", program: "뉴스특보", genre: "뉴스", score: 60 },
      { channel: "채널11", program: "애니메이션", genre: "애니", score: 58 },
      { channel: "채널12", program: "시사토론", genre: "시사", score: 55 },
      { channel: "채널13", program: "홈쇼핑", genre: "홈쇼핑", score: 52 },
      { channel: "채널14", program: "영화재방송", genre: "영화", score: 50 },
      { channel: "채널15", program: "예능재방송", genre: "예능", score: 48 },
      { channel: "채널16", program: "드라마재방송", genre: "드라마", score: 45 },
      { channel: "채널17", program: "뉴스리뷰", genre: "뉴스", score: 42 },
      { channel: "채널18", program: "스포츠하이라이트", genre: "스포츠", score: 40 },
      { channel: "채널19", program: "음악특집", genre: "음악", score: 38 },
      { channel: "채널20", program: "다큐스페셜", genre: "다큐", score: 35 },
      { channel: "채널21", program: "애니재방송", genre: "애니", score: 32 },
      { channel: "채널22", program: "드라마오리지널", genre: "드라마", score: 30 },
      { channel: "채널23", program: "예능클립", genre: "예능", score: 28 },
      { channel: "채널24", program: "영화클래식", genre: "영화", score: 25 },
      { channel: "채널25", program: "뉴스24", genre: "뉴스", score: 22 },
      { channel: "채널26", program: "스포츠분석", genre: "스포츠", score: 20 },
      { channel: "채널27", program: "음악차트", genre: "음악", score: 18 },
      { channel: "채널28", program: "다큐플러스", genre: "다큐", score: 15 },
      { channel: "채널29", program: "시사매거진", genre: "시사", score: 12 },
      { channel: "채널30", program: "종합쇼핑", genre: "홈쇼핑", score: 10 },
    ];

    return (
      <LayoutView>
        <div className="space-y-6">

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-white">Pattern</h1>
              <p className="text-gray-300">
                기준: {currentDate} {currentTime} ({dayOfWeek})
              </p>
            </div>
            <button
              onClick={() => router.push('/pattern')}
              className="px-4 py-2 rounded-lg bg-indigo-500/30 text-white border border-white/20 hover:bg-indigo-500/50 transition"
            >
              기준 시간 재설정
            </button>
          </div>

          <div className="flex gap-4 border-b border-white/20">
            <button
              onClick={() => setActiveTab(PatternTab.SCHEDULE)}
              className={`px-4 py-2 font-semibold transition ${
                activeTab === PatternTab.SCHEDULE
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              채널 편성표
            </button>
            <button
              onClick={() => setActiveTab(PatternTab.RECOMMENDATIONS)}
              className={`px-4 py-2 font-semibold transition ${
                activeTab === PatternTab.RECOMMENDATIONS
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              AI 추천
            </button>
            <button
              onClick={() => setActiveTab(PatternTab.HISTORY)}
              className={`px-4 py-2 font-semibold transition ${
                activeTab === PatternTab.HISTORY
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              시청 기록
            </button>
          </div>

          <div className="min-h-[600px]">
            {activeTab === PatternTab.RECOMMENDATIONS && (
              <PatternRecommendationsTab date={currentDate} time={currentTime} />
            )}

            {activeTab === PatternTab.SCHEDULE && (
              <PatternScheduleTab
                initialDay={selectedDay}
              />
            )}

            {activeTab === PatternTab.HISTORY && (
              <PatternHistoryTab />
            )}
          </div>
        </div>
      </LayoutView>
    );
  }

  return (
    <LayoutView>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)]">
        <div className="max-w-md w-full space-y-8 bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/10">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-white">Pattern - TV 채널 추천</h1>
            <p className="text-gray-300">기준 날짜/시간 설정</p>
          </div>

          <div className="space-y-6">

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">날짜</label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {dateOptions.map((date) => (
                  <option key={date} value={date} className="bg-gray-900">
                    {date} ({getDayOfWeek(date)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">시간</label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time} className="bg-gray-900">
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition shadow-lg"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </LayoutView>
  );
});

export default PatternPage;