import { observer } from "mobx-react-lite";
import { makeAutoObservable, runInAction } from "mobx";
import { isNil } from "lodash";
import { useModel } from "../../../ex/mobx";
import { api } from "@/api/api";
import type { PatternViewingHistoryLog } from "@/api/schema.g";
import { useEffect } from "react";

const PatternHistoryTab = observer(() => {
  const model = useModel(PatternHistoryModel);

  useEffect(() => {
    void model.init("Q1");

  }, [model]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">시청 기록</h2>
        <div className="flex gap-2">
          {["Q1", "Q2", "Q3", "Q4"].map((quarter) => (
            <button
              key={quarter}
              onClick={() => model.init(quarter)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                model.selectedQuarter === quarter
                  ? "bg-indigo-600 text-white border border-indigo-500 shadow-lg"
                  : "bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20"
              }`}
            >
              {quarter}
            </button>
          ))}
        </div>
      </div>

      {model.initialized && (
        <>
          <div className="overflow-x-auto rounded-lg border border-white/20 bg-gradient-to-b from-gray-900/80 to-black/80">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/30 bg-gray-800/60">
                  <th className="px-4 py-3 text-left font-semibold">날짜</th>
                  <th className="px-4 py-3 text-left font-semibold">시간</th>
                  <th className="px-4 py-3 text-left font-semibold">채널</th>
                  <th className="px-4 py-3 text-left font-semibold">프로그램</th>
                  <th className="px-4 py-3 text-left font-semibold">장르</th>
                </tr>
              </thead>
              <tbody>
                {model.logs.map((log, index) => (
                  <tr
                    key={index}
                    className={`border-b border-white/10 hover:bg-white/10 transition ${
                      index % 2 === 0 ? "bg-black/20" : "bg-black/40"
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-300">{log.date}</td>
                    <td className="px-4 py-3 text-gray-300">{log.time}</td>
                    <td className="px-4 py-3 text-gray-300">{log.channel}</td>
                    <td className="px-4 py-3 text-white font-medium">{log.programName}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-pink-500/20 text-pink-200">
                        {log.genre}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {model.logs.length === 0 && (
            <p className="text-center text-gray-400 py-8">시청 기록이 없습니다</p>
          )}
        </>
      )}
    </div>
  );
});

class PatternHistoryModel {
  selectedQuarter: string = "Q1";
  logs: PatternViewingHistoryLog[] = [];
  initialized: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  async init(quarter: string) {
    this.selectedQuarter = quarter;
    const res = await api.patternViewingHistory({ quarter });

    if (isNil(res)) {
      return;
    }

    runInAction(() => {
      this.logs = res.logs;
      this.initialized = true;
    });
  }
}

export default PatternHistoryTab;