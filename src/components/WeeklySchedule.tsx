import { Calendar, Heart, Star } from "lucide-react";

type DaySchedule = {
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
  grace_period_minutes: number | null;
  is_rest_day: boolean;
  break_start: string | null;
  break_end: string | null;
  break_paid: boolean;
  shift_name: string | null;
};

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekDates(): Date[] {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export default function WeeklySchedule({ schedule }: { schedule: DaySchedule[] }) {
  const weekDates = getWeekDates();
  const todayDayOfWeek = new Date().getDay();
  const today = new Date();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-border shadow-lg overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-500" />
          <h3 className="font-bold text-sm">This Week's Schedule</h3>
        </div>
        <span className="text-[10px] text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
          {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} —{" "}
          {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1.5 px-4 pb-5">
        {weekDates.map((date, i) => {
          const sched = schedule[i];
          const isToday = i === todayDayOfWeek;
          const hasSchedule = sched && sched.start_time;

          return (
            <div
              key={i}
              className={`relative rounded-2xl p-2.5 text-center transition-all ${
                isToday
                  ? "bg-gradient-to-b from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20 scale-105 z-10"
                  : sched?.is_rest_day
                    ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                    : hasSchedule
                      ? "bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30"
                      : "bg-muted/30 border border-border"
              }`}
            >
              {/* Day name */}
              <p className={`text-[10px] font-semibold mb-1 ${
                isToday ? "text-white/80" : "text-muted-foreground"
              }`}>
                {DAYS_SHORT[i]}
              </p>
              {/* Date number */}
              <p className={`text-lg font-bold leading-tight ${
                isToday ? "text-white" : ""
              }`}>
                {date.getDate()}
              </p>

              {/* Schedule info */}
              {sched?.is_rest_day ? (
                <div className={`mt-1.5 text-[9px] font-semibold flex items-center justify-center gap-0.5 ${
                  isToday ? "text-white/90" : "text-amber-600 dark:text-amber-400"
                }`}>
                  <Heart className="w-2.5 h-2.5" /> Off
                </div>
              ) : hasSchedule ? (
                <div className="mt-1.5 space-y-0.5">
                  <p className={`text-[9px] font-bold ${
                    isToday ? "text-white" : "text-indigo-600 dark:text-indigo-400"
                  }`}>
                    {sched.start_time!.slice(0, 5)}
                  </p>
                  <p className={`text-[8px] ${
                    isToday ? "text-white/70" : "text-muted-foreground"
                  }`}>
                    {sched.end_time!.slice(0, 5)}
                  </p>
                </div>
              ) : (
                <p className={`mt-1.5 text-[8px] ${
                  isToday ? "text-white/50" : "text-muted-foreground/50"
                }`}>
                  No schedule
                </p>
              )}

              {/* Today indicator */}
              {isToday && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Star className="w-2.5 h-2.5 text-purple-500 fill-purple-500" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
