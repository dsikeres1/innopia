import { observer } from "mobx-react-lite";
import { makeAutoObservable, runInAction } from "mobx";
import { isNil } from "lodash";
import { useModel } from "../../../ex/mobx";
import { api } from "@/api/api";
import type { PatternScheduleProgram } from "@/api/schema.g";
import { useEffect } from "react";

const PatternScheduleTab = observer((props: {initialDay: string}) => {
  const model = useModel(PatternScheduleModel);

  useEffect(() => {
    void model.init(props.initialDay);
  }, [props.initialDay, model]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">TV 편성표</h2>
        <select
          value={model.selectedDay}
          onChange={(e) => model.init(e.target.value)}
          className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"].map((day) => (
            <option key={day} value={day} className="bg-gray-900">
              {day}
            </option>
          ))}
        </select>
      </div>

      {model.initialized && (
        <>
          <div className="overflow-x-auto rounded-lg border border-white/20 bg-gradient-to-b from-gray-900/80 to-black/80">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/30 bg-gray-800/60">
                  <th className="sticky left-0 z-10 bg-gray-800 px-4 py-3 text-left font-semibold border-r border-white/20">
                    시간
                  </th>
                  {model.channels.map((channel) => (
                    <th
                      key={channel}
                      className="px-4 py-3 text-center font-semibold whitespace-nowrap"
                    >
                      {channel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {model.timeOptions.map((time, idx) => {
                  const programsAtTime = model.scheduleMap[time] || {};
                  return (
                    <tr
                      key={time}
                      className={`border-b border-white/10 hover:bg-white/10 transition ${idx % 2 === 0 ? 'bg-black/20' : 'bg-black/40'}`}
                    >
                      <td className="sticky left-0 z-10 bg-gray-800 px-4 py-3 font-medium border-r border-white/20">
                        {time}
                      </td>
                      {model.channels.map((channel) => (
                        <td key={channel} className="px-4 py-3 text-center text-gray-200">
                          {programsAtTime[channel] || "-"}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-2">가로 스크롤 가능</p>
        </>
      )}
    </div>
  );
});

class PatternScheduleModel {
  selectedDay: string = "월요일";
  programs: PatternScheduleProgram[] = [];
  initialized: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  async init(day: string) {
    this.selectedDay = day;
    const res = await api.patternSchedule({ day: day });

    if (isNil(res)) {
      return;
    }

    runInAction(() => {
      this.programs = res.programs;
      this.initialized = true;
    });
  }

  get scheduleMap(): Record<string, Record<string, string>> {
    const map: Record<string, Record<string, string>> = {};
    this.programs.forEach((program) => {
      if (!map[program.time]) {
        map[program.time] = {};
      }
      const timeSlot = map[program.time];
      if (timeSlot) {
        timeSlot[program.channel] = program.programName;
      }
    });
    return map;
  }

  get channels() {
    return Array.from({ length: 30 }, (_, i) => `채널${i + 1}`);
  }

  get timeOptions() {
    const times: string[] = [];
    for (let h = 0; h < 24; h++) {
      times.push(`${h.toString().padStart(2, "0")}:00`);
    }
    return times;
  }
}

export default PatternScheduleTab;