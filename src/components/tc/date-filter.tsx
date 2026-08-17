import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { dateLabel, longDateLabel, shiftDate, useActiveDate } from "@/lib/tc/store";
import { TODAY } from "@/lib/tc/data";

/**
 * Filtre de jour partagé (Processus, Tâches, Analytics) branché sur la date
 * active globale : changer la date ici la change partout dans l'application.
 */
export function DateFilter({ className }: { className?: string }) {
  const [date, setDate] = useActiveDate();

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex items-center gap-1 rounded-xl border border-border p-0.5">
        <button
          className="grid h-8 w-8 place-items-center rounded-lg"
          onClick={() => setDate(shiftDate(date, -1))}
          aria-label="Jour précédent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span
          className={cn(
            "px-2 text-xs font-semibold capitalize",
            date === TODAY ? "text-gold" : "text-foreground",
          )}
        >
          {dateLabel(date, TODAY)}
        </span>
        <button
          className="grid h-8 w-8 place-items-center rounded-lg"
          onClick={() => setDate(shiftDate(date, 1))}
          aria-label="Jour suivant"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <label className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-2 py-1.5 text-xs font-semibold">
        <CalendarDays className="h-4 w-4 text-gold" />
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="bg-transparent outline-none"
          aria-label="Choisir une date"
        />
      </label>

      {date !== TODAY && (
        <button
          onClick={() => setDate(TODAY)}
          className="rounded-xl border border-gold/50 bg-gold/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gold"
        >
          Aujourd'hui
        </button>
      )}
      <span className="hidden text-[11px] capitalize text-muted-foreground sm:inline">{longDateLabel(date)}</span>
    </div>
  );
}
