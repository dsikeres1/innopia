import { observer } from "mobx-react-lite";
import { makeAutoObservable, runInAction } from "mobx";
import { useState, useEffect } from "react";
import { isNil } from "lodash";
import { useModel } from "../../../ex/mobx";
import { api } from "@/api/api";
import type { PatternRecommendation } from "@/api/schema.g";

interface PatternRecommendationsTabProps {
  date: string;
  time: string;
}

class PatternRecommendationsModel {
  recommendations: PatternRecommendation[] = [];
  initialized: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  async init(date: string, time: string) {
    const res = await api.patternRecommendations({ date, time });

    if (isNil(res)) {
      return;
    }

    runInAction(() => {
      this.recommendations = res.recommendations;
      this.initialized = true;
    });
  }
}

export const PatternRecommendationsTab = observer(({ date, time }: PatternRecommendationsTabProps) => {
  const model = useModel(PatternRecommendationsModel);
  const [visibleCount, setVisibleCount] = useState<number>(6);

  useEffect(() => {
    let cancelled = false;

    const initData = async () => {
      if (cancelled) return;
      await model.init(date, time);
    };

    void initData();
    setVisibleCount(6); 

    return () => {
      cancelled = true;
    };

  }, [model, date, time]);

  if (!model.initialized) {
    return null;
  }

  const visibleItems = model.recommendations.slice(0, visibleCount);
  const hasMore = visibleCount < model.recommendations.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 6, model.recommendations.length));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">AI 추천</h2>

      {model.recommendations.length === 0 ? (
        <p className="text-center text-gray-400 py-8">추천 결과가 없습니다</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-6">
            {visibleItems.map((item, index) => (
              <div key={index} className="bg-black/20 rounded-lg border border-white/10 overflow-hidden hover:border-indigo-500/50 transition">
                <div className="aspect-square bg-gradient-to-br from-indigo-500/20 to-pink-500/20 flex items-center justify-center">
                  {item.thumbnailUrl && (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.programName}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="text-lg font-semibold text-white line-clamp-1">{item.programName}</h3>
                  <p className="text-sm text-gray-400">{item.channel} · {item.genre}</p>
                  <p className="text-indigo-400 font-medium">추천도: {Math.round(item.score * 100)}%</p>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <button
                onClick={handleLoadMore}
                className="px-8 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 transition"
              >
                더보기
              </button>
            </div>
          )}

          <p className="text-xs text-gray-500 text-center">{visibleCount}/{model.recommendations.length}개 채널 표시 중</p>
        </>
      )}
    </div>
  );
});