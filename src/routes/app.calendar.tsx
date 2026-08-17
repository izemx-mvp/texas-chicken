import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { EmptyState, SectionTitle, StatusPill } from "@/components/tc/bits";
import { cn } from "@/lib/utils";
import { isProcessAvailableOn, tasksForDate, useStore } from "@/lib/tc/store";
import { REF_DATE, TODAY } from "@/lib/tc/data";

export const Route = createFileRoute("/app/calendar")({
  head: () => ({
    meta: [
      { title: "Calendrier des tâches — Texas Chicken Operations" },
      {
        name: "description",
        content:
          "Visualisez le planning mensuel de vos processus et les étapes prévues jour par jour dans votre restaurant.",
      },
      { property: "og:title", content: "Calendrier des tâches — Texas Chicken Operations" },
      {
        property: "og:description",
        content: "Planning mensuel des processus permanents, périodiques et à dates spécifiques.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TaskCalendar,
});

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function TaskCalendar() {
  const state = useStore((s) => s);
  const [cursor, setCursor] = useState(() => new Date(REF_DATE.getFullYear(), REF_DATE.getMonth(), 1));
  const [selected, setSelected] = useState(TODAY);

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const out: (string | null)[] = Array.from({ length: startOffset }, () => null);
    for (let d = 1; d <= daysInMonth; d++) out.push(iso(new Date(cursor.getFullYear(), cursor.getMonth(), d)));
    return out;
  }, [cursor]);

  const dayTasks = tasksForDate(selected, state);
  const dayProcesses = state.processes.filter((p) => isProcessAvailableOn(p, selected));

  const monthLabel = cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-5">
      <SectionTitle title="Calendrier" subtitle="Planning des processus et étapes par jour" />

      <div className="glass rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-secondary/40"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            aria-label="Mois précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider">
            <CalendarDays className="h-4 w-4 text-gold" />
            {monthLabel}
          </div>
          <button
            className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-secondary/40"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            aria-label="Mois suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          {DAY_LABELS.map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((date, i) => {
            if (!date) return <div key={i} />;
            const count = tasksForDate(date, state).length;
            const active = date === selected;
            const isToday = date === TODAY;
            return (
              <button
                key={date}
                onClick={() => setSelected(date)}
                className={cn(
                  "relative aspect-square rounded-xl border p-1 text-xs transition-colors",
                  active
                    ? "border-gold/60 bg-gold/15 text-foreground"
                    : "border-border bg-secondary/25 text-muted-foreground hover:border-gold/40",
                )}
              >
                <span className={cn("block font-semibold", isToday && "text-brand")}>{Number(date.slice(-2))}</span>
                {count > 0 && (
                  <span className="mx-auto mt-0.5 block h-1.5 w-1.5 rounded-full bg-brand-gradient" />
                )}
                {count > 0 && <span className="block text-[9px] text-muted-foreground">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <SectionTitle
          title={new Date(`${selected}T09:00:00`).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
          subtitle={`${dayProcesses.length} processus disponibles · ${dayTasks.length} étapes planifiées`}
        />
        <div className="mb-3 flex flex-wrap gap-2">
          {dayProcesses.map((p) => (
            <Link
              key={p.id}
              to="/app/process/$id"
              params={{ id: p.id }}
              className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs hover:border-gold/50"
            >
              {p.name}
              <span className="ml-1.5 text-[10px] uppercase tracking-widest text-gold">
                {p.availability?.type ?? "Permanent"}
              </span>
            </Link>
          ))}
        </div>

        {dayTasks.length === 0 ? (
          <EmptyState title="Aucune étape planifiée" description="Aucun processus n'est disponible à cette date." />
        ) : (
          <div className="space-y-2">
            {dayTasks.map((t) => (
              <Link
                key={t.id}
                to="/app/task/$id"
                params={{ id: t.id }}
                className="glass hover-lift flex items-center gap-3 rounded-2xl p-3"
              >
                <span className="tabular grid h-11 w-14 shrink-0 place-items-center rounded-xl border border-border bg-secondary/50 font-display text-sm font-bold text-gold">
                  {t.time}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{t.name}</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {t.duration} min · {t.zone} · {t.role}
                  </div>
                </div>
                <StatusPill status={t.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
