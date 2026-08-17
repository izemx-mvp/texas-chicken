import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ListOrdered,
  Search,
  ShieldAlert,
  Workflow,
} from "lucide-react";
import { StatusPill } from "./bits";
import { EvidenceGallery, EvidenceThumb } from "./evidence-gallery";
import { TaskDetailFilled } from "./task-detail-filled";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  dateLabel,
  dayKind,
  dayReport,
  dayStats,
  executionDetail,
  longDateLabel,
  processDayReports,
  shiftDate,
  useActiveDate,
  useStore,
  type DayTaskReport,
  type ProcessDayReport,
} from "@/lib/tc/store";
import { TODAY } from "@/lib/tc/data";
import { PRIORITIES_LIST, STATUS_LIST } from "@/lib/tc/view-options";

const WEEK = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function monthLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export type BoardMode = "list" | "calendar" | "process";

/**
 * Vue opérationnelle partagée Admin / Manager : Liste, Calendrier et Processus,
 * toutes branchées sur la date active globale.
 */
export function TaskBoard({
  title = "Tâches",
  defaultMode = "list",
  restaurantId,
}: {
  title?: string;
  defaultMode?: BoardMode;
  restaurantId?: string;
}) {
  const state = useStore((s) => s);
  const [date, setDate] = useActiveDate();
  const [mode, setMode] = useState<BoardMode>(defaultMode);
  const [openId, setOpenId] = useState<string | null>(null);
  const [openProcess, setOpenProcess] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [zone, setZone] = useState("Toutes zones");
  const [status, setStatus] = useState("Tous statuts");
  const [priority, setPriority] = useState("Toutes priorités");
  const [processId, setProcessId] = useState("Tous processus");

  const allReports = useMemo(() => dayReport(date, TODAY, state, restaurantId), [date, state, restaurantId]);
  const procReports = useMemo(
    () => processDayReports(date, TODAY, state, restaurantId),
    [date, state, restaurantId],
  );
  const kind = dayKind(date, TODAY);

  const reports = useMemo(
    () =>
      allReports.filter((r) => {
        const t = r.task;
        if (zone !== "Toutes zones" && t.zone !== zone) return false;
        if (status !== "Tous statuts" && r.status !== status) return false;
        if (priority !== "Toutes priorités" && t.priority !== priority) return false;
        if (processId !== "Tous processus" && t.processId !== processId) return false;
        const term = q.trim().toLowerCase();
        if (term && !`${t.name} ${t.zone} ${t.role}`.toLowerCase().includes(term)) return false;
        return true;
      }),
    [allReports, zone, status, priority, processId, q],
  );

  const stats = useMemo(() => dayStats(reports), [reports]);

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

  const zones = useMemo(
    () => ["Toutes zones", ...Array.from(new Set(allReports.map((r) => r.task.zone)))],
    [allReports],
  );

  return (
    <div className="space-y-4">
      {/* en-tête + date active */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold uppercase">{title}</h3>
          <p className="text-xs capitalize text-muted-foreground">
            <span className={cn("font-semibold", date === TODAY ? "text-gold" : "text-foreground")}>
              {dateLabel(date, TODAY)}
            </span>{" "}
            · {longDateLabel(date)} ·{" "}
            {kind === "past" ? "historique opérationnel" : kind === "future" ? "planification" : "shift en cours"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-border p-0.5">
            <button
              className="grid h-8 w-8 place-items-center rounded-lg"
              onClick={() => setDate(shiftDate(date, -1))}
              aria-label="Jour précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              className={cn("px-2 text-xs font-semibold", date === TODAY && "text-gold")}
              onClick={() => setDate(TODAY)}
            >
              Aujourd'hui
            </button>
            <button
              className="grid h-8 w-8 place-items-center rounded-lg"
              onClick={() => setDate(shiftDate(date, 1))}
              aria-label="Jour suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex rounded-xl border border-border p-0.5">
            {(["list", "calendar", "process"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  mode === m ? "bg-brand/20 text-foreground" : "text-muted-foreground",
                )}
              >
                {m === "list" ? (
                  <ListOrdered className="h-4 w-4" />
                ) : m === "calendar" ? (
                  <CalendarDays className="h-4 w-4" />
                ) : (
                  <Workflow className="h-4 w-4" />
                )}
                {m === "list" ? "Liste" : m === "calendar" ? "Calendrier" : "Processus"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs de la journée */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Mini label="Tâches" value={`${stats.total}`} />
        <Mini label={kind === "future" ? "Planifiées" : "Terminées"} value={`${kind === "future" ? stats.planned : stats.done}`} tone="success" />
        <Mini label="En retard" value={`${stats.late}`} tone={stats.late ? "danger" : "muted"} />
        <Mini label="Écarts" value={`${stats.issues}`} tone={stats.issues ? "danger" : "muted"} />
        <Mini label="Progression" value={`${kind === "future" ? 0 : stats.progress} %`} />
      </div>

      {/* filtres */}
      {mode !== "calendar" && (
        <div className="glass space-y-2 rounded-2xl p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher une tâche, une zone, un rôle..."
              className="h-10 bg-secondary/40 pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={zone} onChange={setZone} options={zones} />
            <Select value={status} onChange={setStatus} options={["Tous statuts", ...STATUS_LIST]} />
            <Select value={priority} onChange={setPriority} options={["Toutes priorités", ...PRIORITIES_LIST]} />
            <Select
              value={processId}
              onChange={setProcessId}
              options={["Tous processus", ...procReports.map((p) => p.process.id)]}
              labels={Object.fromEntries(procReports.map((p) => [p.process.id, p.process.name]))}
            />
          </div>
        </div>
      )}

      {mode === "calendar" && (
        <div className="glass rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <button onClick={() => setDate(shiftDate(date, -28))} aria-label="Mois précédent">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-display text-sm font-bold uppercase">{monthLabel(date)}</span>
            <button onClick={() => setDate(shiftDate(date, 28))} aria-label="Mois suivant">
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
              const count = dayReport(d, TODAY, state, restaurantId).length;
              const k = dayKind(d, TODAY);
              return (
                <button
                  key={d}
                  onClick={() => {
                    setDate(d);
                    setMode("list");
                  }}
                  className={cn(
                    "aspect-square rounded-lg border text-xs transition-colors hover:border-gold/50",
                    d === date ? "border-gold bg-brand/20 font-bold" : "border-border bg-secondary/25",
                    d === TODAY && d !== date && "border-brand/60",
                    !count && "opacity-40",
                  )}
                >
                  <div>{Number(d.slice(-2))}</div>
                  {count > 0 && (
                    <>
                      <div
                        className={cn(
                          "mx-auto mt-0.5 h-1.5 w-1.5 rounded-full",
                          k === "past" ? "bg-muted-foreground" : k === "today" ? "bg-gold" : "bg-brand",
                        )}
                      />
                      <div className="text-[9px] text-muted-foreground">{count}</div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {mode === "process" ? (
        <div className="space-y-2">
          {procReports.length === 0 && (
            <p className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
              Aucun processus disponible à cette date.
            </p>
          )}
          {procReports.map((p) => (
            <ProcessRow
              key={p.process.id}
              p={p}
              future={kind === "future"}
              open={openProcess === p.process.id}
              onToggle={() => setOpenProcess(openProcess === p.process.id ? null : p.process.id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <ReportRow
              key={r.task.id}
              r={r}
              date={date}
              {...(restaurantId ? { restaurantId } : {})}
              open={openId === r.task.id}
              onToggle={() => setOpenId(openId === r.task.id ? null : r.task.id)}
            />
          ))}
          {reports.length === 0 && (
            <p className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
              Aucune tâche pour cette date avec ces filtres.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  labels,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-xl border border-border bg-secondary/40 px-2 text-xs font-semibold"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {labels?.[o] ?? o}
        </option>
      ))}
    </select>
  );
}

function ProcessRow({
  p,
  open,
  future,
  onToggle,
}: {
  p: ProcessDayReport;
  open: boolean;
  future: boolean;
  onToggle: () => void;
}) {
  const progress = future ? 0 : p.progress;
  return (
    <div className="rounded-2xl border border-border bg-secondary/25">
      <button className="w-full p-3 text-left" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <Workflow className="h-4 w-4 shrink-0 text-gold" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold uppercase">{p.process.name}</span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {p.tasks} tâches · {p.steps} étapes · {p.duration} min
            </span>
          </span>
          <span className="tabular font-display text-lg font-bold">{progress} %</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-brand-gradient transition-all" style={{ width: `${progress}%` }} />
        </div>
      </button>
      {open && (
        <div className="border-t border-border p-3">
          <p className="mb-3 text-xs text-muted-foreground">{p.process.description}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Info icon={<ListOrdered className="h-3.5 w-3.5" />} label="Tâches" value={`${p.tasks}`} />
            <Info icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Terminées" value={future ? "0" : `${p.done}`} />
            <Info icon={<Clock className="h-3.5 w-3.5" />} label="Restantes" value={`${future ? p.tasks : p.remaining}`} />
            <Info
              icon={<ShieldAlert className="h-3.5 w-3.5" />}
              label="Fraudes"
              value={`${future ? 0 : p.fraud}`}
              {...(p.fraud && !future ? { tone: "danger" as const } : {})}
            />
            <Info icon={<ListOrdered className="h-3.5 w-3.5" />} label="Étapes" value={`${p.steps}`} />
            <Info icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Étapes faites" value={future ? "0" : `${p.stepsDone}`} />
            <Info icon={<Camera className="h-3.5 w-3.5" />} label="Preuves" value={future ? "0" : `${p.evidence}`} />
            <Info icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Conformité" value={`${future ? 0 : p.compliance} %`} />
          </div>
          <div className="mt-3 space-y-1.5">
            {p.reports.map((r) => (
              <div key={r.task.id} className="flex items-center gap-2 rounded-xl border border-border bg-background/40 px-3 py-2">
                <span className="tabular text-xs font-bold text-gold">{r.planned}</span>
                <span className="min-w-0 flex-1 truncate text-xs">{r.task.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {future ? 0 : r.stepsDone}/{r.stepsTotal}
                </span>
                <StatusPill status={r.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportRow({
  r,
  date,
  restaurantId,
  open,
  onToggle,
}: {
  r: DayTaskReport;
  date: string;
  restaurantId?: string;
  open: boolean;
  onToggle: () => void;
}) {
  const [gallery, setGallery] = useState<number | null>(null);
  const state = useStore((s) => s);
  const detail = useMemo(
    () => (open ? executionDetail(date, r.task.id, restaurantId, state) : null),
    [open, date, r.task.id, restaurantId, state],
  );
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
            {r.task.zone} · {r.stepsDone}/{r.stepsTotal} étapes · priorité {r.task.priority}
          </span>
        </span>
        {r.fraud && <ShieldAlert className="h-4 w-4 shrink-0 text-destructive" />}
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
            {...(late ? { tone: "danger" as const } : {})}
          />
          <Info icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Clôture" value={r.completedAt ?? "—"} />
          <Info icon={<ListOrdered className="h-3.5 w-3.5" />} label="Résultat" value={r.result ?? "—"} />
          {detail && (
            <div className="sm:col-span-2">
              <TaskDetailFilled exec={detail} />
            </div>
          )}
          {r.evidences.length > 0 && (
            <div className="rounded-xl border border-border bg-secondary/30 p-3 sm:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-widest text-gold">
                  Preuves soumises ({r.evidences.length})
                </div>
                <span className="flex gap-2">
                  {restaurantId && (
                    <Link
                      to="/admin/execution/$id"
                      params={{ id: `${date}__${r.task.id}__${restaurantId}` }}
                      className="rounded-lg border border-gold/40 bg-gold/10 px-2 py-1 text-[11px] font-semibold text-gold"
                    >
                      Voir détails
                    </Link>
                  )}
                  <button
                    onClick={() => setGallery(0)}
                    className="rounded-lg border border-border px-2 py-1 text-[11px] font-semibold"
                  >
                    Voir les preuves
                  </button>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {r.evidences.map((e, i) => (
                  <EvidenceThumb key={e.id} evidence={e} onClick={() => setGallery(i)} />
                ))}
              </div>
              {(r.evidenceRejected || r.fraud) && (
                <p className="mt-2 flex items-start gap-1.5 text-[11px] text-destructive">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Preuve non retenue par l'IA — la conformité du jour a été impactée et une alerte anti-fraude a été
                  remontée au siège.
                </p>
              )}
              {gallery !== null && (
                <EvidenceGallery
                  items={r.evidences}
                  index={gallery}
                  onIndexChange={setGallery}
                  onClose={() => setGallery(null)}
                  title={r.task.name}
                />
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
