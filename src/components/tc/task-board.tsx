import { useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, Camera, CheckCircle2, ChevronLeft, ChevronRight, Clock, ListOrdered, ShieldAlert } from "lucide-react";
import { StatusPill } from "./bits";
import { cn } from "@/lib/utils";
import { dayKind, dayReport, useStore, type DayTaskReport } from "@/lib/tc/store";
import { TODAY } from "@/lib/tc/data";

const WEEK = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function shift(date: string, days: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function monthLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}
function longDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

/** Vue tâches partagée : bascule Liste / Calendrier + historique opérationnel détaillé. */
export function TaskBoard({ title = "Tâches" }: { title?: string }) {
  const state = useStore((s) => s);
  const [mode, setMode] = useState<"list" | "calendar">("list");
  const [date, setDate] = useState(TODAY);
  const [openId, setOpenId] = useState<string | null>(null);

  const reports = useMemo(() => dayReport(date, TODAY, state), [date, state]);
  const kind = dayKind(date, TODAY);

  const monthDays = useMemo(() => {
    const d = new Date(`${date}T12:00:00`);
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const lead = (first.getDay() + 6) % 7;
    const cells: (string | null)[] = Array.from({ length: lead }, () => null);
    for (let i = 1; i <= last.getDate(); i++) {
      cells.push(`${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`);
    }
    return cells;
  }, [date]);

  const done = reports.filter((r) => r.status === "Terminé").length;
  const issues = reports.filter((r) => r.status === "Non conforme" || r.evidenceRejected || r.fraud).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold uppercase">{title}</h3>
          <p className="text-xs capitalize text-muted-foreground">
            {longDate(date)} ·{" "}
            {kind === "past" ? "historique opérationnel" : kind === "future" ? "planification" : "shift en cours"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-border p-0.5">
            <button className="grid h-8 w-8 place-items-center rounded-lg" onClick={() => setDate(shift(date, -1))} aria-label="Jour précédent">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="px-2 text-xs font-semibold" onClick={() => setDate(TODAY)}>
              Aujourd'hui
            </button>
            <button className="grid h-8 w-8 place-items-center rounded-lg" onClick={() => setDate(shift(date, 1))} aria-label="Jour suivant">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex rounded-xl border border-border p-0.5">
            {(["list", "calendar"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  mode === m ? "bg-brand/20 text-foreground" : "text-muted-foreground",
                )}
              >
                {m === "list" ? <ListOrdered className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
                {m === "list" ? "Liste" : "Calendrier"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Mini label="Tâches" value={`${reports.length}`} />
        <Mini label="Terminées" value={`${done}`} tone="success" />
        <Mini label="Écarts" value={`${issues}`} tone={issues ? "danger" : "muted"} />
      </div>

      {mode === "calendar" && (
        <div className="glass rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <button onClick={() => setDate(shift(date, -28))} aria-label="Mois précédent">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-display text-sm font-bold uppercase">{monthLabel(date)}</span>
            <button onClick={() => setDate(shift(date, 28))} aria-label="Mois suivant">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase text-muted-foreground">
            {WEEK.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {monthDays.map((d, i) => {
              if (!d) return <div key={`e${i}`} />;
              const count = dayReport(d, TODAY, state).length;
              const k = dayKind(d, TODAY);
              return (
                <button
                  key={d}
                  onClick={() => setDate(d)}
                  className={cn(
                    "aspect-square rounded-lg border text-xs transition-colors",
                    d === date ? "border-gold bg-brand/20 font-bold" : "border-border bg-secondary/25",
                    !count && "opacity-40",
                  )}
                >
                  <div>{Number(d.slice(-2))}</div>
                  {count > 0 && (
                    <div
                      className={cn(
                        "mx-auto mt-0.5 h-1.5 w-1.5 rounded-full",
                        k === "past" ? "bg-muted-foreground" : k === "today" ? "bg-gold" : "bg-brand",
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {reports.map((r) => (
          <ReportRow key={r.task.id} r={r} open={openId === r.task.id} onToggle={() => setOpenId(openId === r.task.id ? null : r.task.id)} />
        ))}
        {reports.length === 0 && (
          <p className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
            Aucune tâche planifiée pour cette date.
          </p>
        )}
      </div>
    </div>
  );
}

function ReportRow({ r, open, onToggle }: { r: DayTaskReport; open: boolean; onToggle: () => void }) {
  const late = r.startedAt && r.startedAt > r.planned;
  return (
    <div className="rounded-2xl border border-border bg-secondary/25">
      <button className="flex w-full items-center gap-3 p-3 text-left" onClick={onToggle}>
        <span className="tabular grid h-11 w-16 shrink-0 place-items-center rounded-xl border border-border bg-secondary/50 font-display text-xs font-bold text-gold">
          {r.planned}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{r.task.name}</span>
          <span className="block truncate text-[11px] text-muted-foreground">
            {r.task.processName} · {r.task.zone} · {r.stepsDone}/{r.stepsTotal} étapes
          </span>
        </span>
        {r.fraud && <ShieldAlert className="h-4 w-4 shrink-0 text-destructive" />}
        {r.evidenceRequiredIcon}
        {r.task.evidenceRequired && <Camera className="h-4 w-4 shrink-0 text-gold" />}
        <StatusPill status={r.status} />
      </button>
      {open && (
        <div className="grid gap-2 border-t border-border p-3 sm:grid-cols-2">
          <Info icon={<Clock className="h-3.5 w-3.5" />} label="Heure planifiée" value={r.planned} />
          <Info
            icon={<Clock className="h-3.5 w-3.5" />}
            label="Heure réelle de démarrage"
            value={r.startedAt ? `${r.startedAt}${late ? " (retard)" : ""}` : "—"}
            tone={late ? "danger" : undefined}
          />
          <Info icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Clôture" value={r.completedAt ?? "—"} />
          <Info icon={<ListOrdered className="h-3.5 w-3.5" />} label="Résultat" value={r.result ?? "—"} />
          {r.evidence && (
            <div className="rounded-xl border border-border bg-secondary/30 p-3 sm:col-span-2">
              <div className="mb-1 text-[10px] uppercase tracking-widest text-gold">Preuve photo</div>
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-lg" style={{ background: r.evidence.gradient }} />
                <div className="min-w-0 flex-1 text-xs">
                  <div className="font-semibold">{r.evidence.ref}</div>
                  <div className="text-muted-foreground">
                    score IA {r.evidence.aiScore}% · {r.evidence.date} {r.evidence.time}
                  </div>
                </div>
                <StatusPill status={r.evidence.status} />
              </div>
              {(r.evidenceRejected || r.fraud) && (
                <p className="mt-2 flex items-start gap-1.5 text-[11px] text-destructive">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Preuve non retenue par l'IA — la conformité du jour a été impactée et une alerte a été remontée au siège.
                </p>
              )}
            </div>
          )}
          {r.comment && (
            <p className="rounded-xl border border-border bg-secondary/30 p-3 text-xs text-muted-foreground sm:col-span-2">
              {r.comment}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Info({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: "danger" }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={cn("text-sm font-semibold", tone === "danger" && "text-destructive")}>{value}</div>
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: "success" | "danger" | "muted" }) {
  return (
    <div className="glass rounded-2xl p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div
        className={cn(
          "font-display text-xl font-bold",
          tone === "success" && "text-success",
          tone === "danger" && "text-destructive",
        )}
      >
        {value}
      </div>
    </div>
  );
}
