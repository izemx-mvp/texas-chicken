import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Flame, ListChecks, Timer } from "lucide-react";
import { ComplianceRing, KpiCard, ProgressBar, SectionTitle, StatusPill, SkeletonRows, useFakeLoading } from "@/components/tc/bits";
import { currentUser, nextShiftTask, useStore } from "@/lib/tc/store";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Shift Command Center — Texas Chicken Operations" },
      { name: "description", content: "Pilotez votre shift : tâches, processus, retards, preuves et conformité en temps réel." },
      { property: "og:title", content: "Shift Command Center — Texas Chicken Operations" },
      { property: "og:description", content: "Exécution des standards Texas Chicken en temps réel pendant le shift." },
    ],
  }),
  component: ShiftCommandCenter,
});

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function ShiftCommandCenter() {
  const loading = useFakeLoading(450);
  const now = useClock();
  const user = useStore(() => currentUser());
  const restaurant = useStore((s) => s.restaurants.find((r) => r.id === user?.restaurantId));
  const tasks = useStore((s) => s.shiftTasks);
  const next = useStore((s) => nextShiftTask(s));
  const processes = useStore((s) => s.processes);
  const alerts = useStore((s) => s.alerts.filter((a) => a.restaurantId === user?.restaurantId && !a.resolved));
  const evidence = useStore((s) => s.evidence.filter((e) => e.restaurantId === user?.restaurantId));

  const done = tasks.filter((t) => t.status === "Terminé").length;
  const late = tasks.filter((t) => t.status === "En retard").length;
  const remaining = tasks.length - done;
  const progress = Math.round((done / Math.max(1, tasks.length)) * 100);
  const compliance = restaurant?.compliance ?? 89;
  const rejected = evidence.filter((e) => e.status === "Rejetée" || e.status === "Dupliquée").length;

  const end = new Date(now);
  end.setHours(16, 0, 0, 0);
  const minsLeft = Math.max(0, Math.round((end.getTime() - now.getTime()) / 60000));

  const shiftProcesses = [...new Set(tasks.map((t) => t.processId))].map((pid) => {
    const p = processes.find((x) => x.id === pid)!;
    const list = tasks.filter((t) => t.processId === pid);
    const d = list.filter((t) => t.status === "Terminé").length;
    return {
      p,
      total: list.length,
      done: d,
      late: list.filter((t) => t.status === "En retard").length,
      progress: Math.round((d / Math.max(1, list.length)) * 100),
    };
  });

  if (loading) return <SkeletonRows rows={8} />;

  return (
    <div className="space-y-5">
      <div className="glass panel-glow relative overflow-hidden rounded-3xl p-5">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-gradient opacity-20 blur-3xl" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-gold">Shift Command Center</p>
        <h1 className="mt-1 font-display text-3xl font-bold uppercase">
          {user?.firstName} {user?.lastName}
        </h1>
        <p className="text-sm text-muted-foreground">{restaurant?.name}</p>

        <div className="mt-5 flex flex-wrap items-center gap-5">
          <ComplianceRing value={compliance} />
          <div className="min-w-[190px] flex-1 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Info label="Shift" value="08:00 → 16:00" />
              <Info label="Heure" value={now.toTimeString().slice(0, 8)} />
              <Info label="Temps restant" value={`${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m`} />
              <Info label="Alertes" value={String(alerts.length)} />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                <span>Progression du shift</span>
                <span className="font-display text-lg font-bold text-gold">{progress}%</span>
              </div>
              <ProgressBar value={progress} />
            </div>
          </div>
        </div>
      </div>

      {next && (
        <Link
          to="/app/task/$id"
          params={{ id: next.id }}
          className="glass panel-glow hover-lift block rounded-3xl border border-gold/45 p-5"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">
              Prochaine étape à effectuer
            </span>
            <StatusPill status={next.status} />
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span className="tabular grid h-14 w-20 place-items-center rounded-2xl bg-brand-gradient font-display text-lg font-bold text-brand-foreground">
              {next.time}
            </span>
            <div className="min-w-0">
              <h2 className="truncate font-display text-xl font-bold uppercase">{next.name}</h2>
              <p className="truncate text-xs text-muted-foreground">
                {processes.find((p) => p.id === next.processId)?.name} · {next.zone} · {next.role} · priorité{" "}
                {next.priority}
              </p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Sélectionnée sur l'ensemble du shift (retards et criticité prioritaires), tous processus confondus.
          </p>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Terminées" value={done} tone="success" icon={<CheckCircle2 className="h-4 w-4" />} />
        <KpiCard label="Restantes" value={remaining} icon={<ListChecks className="h-4 w-4" />} />
        <KpiCard label="En retard" value={late} tone="warning" icon={<Clock className="h-4 w-4" />} />
        <KpiCard label="Preuves rejetées" value={rejected} tone="danger" icon={<AlertTriangle className="h-4 w-4" />} />
      </div>

      <div>
        <SectionTitle title="Processus du jour" subtitle="Workflow d'exécution du shift" />
        <div className="space-y-3">
          {shiftProcesses.map((sp, i) => (
            <Link
              key={sp.p.id}
              to="/app/process/$id"
              params={{ id: sp.p.id }}
              className="glass hover-lift animate-rise block rounded-2xl p-4"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-gold" />
                    <h3 className="truncate font-display text-lg font-bold uppercase">{sp.p.name}</h3>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {sp.done}/{sp.total} étapes · {sp.p.category} · {sp.p.frequency}
                  </p>
                </div>
                <StatusPill
                  status={sp.late > 0 ? "En retard" : sp.progress === 100 ? "Terminé" : sp.progress > 0 ? "En cours" : "À faire"}
                />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <ProgressBar value={sp.progress} className="flex-1" />
                <span className="font-display text-sm font-bold text-gold">{sp.progress}%</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sp.p.steps.slice(0, 6).map((s) => (
                  <span key={s.id} className="rounded-full border border-border bg-secondary/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {s.zone}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle title="Actions urgentes" subtitle="Tâches en retard ou en cours" />
        <div className="space-y-2">
          {tasks
            .filter((t) => t.status === "En retard" || t.status === "En cours")
            .slice(0, 6)
            .map((t) => (
              <Link
                key={t.id}
                to="/app/task/$id"
                params={{ id: t.id }}
                className="glass hover-lift flex items-center gap-3 rounded-2xl p-3"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-secondary/50 text-gold">
                  <Timer className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t.zone} · {t.time} · {t.duration} min
                  </div>
                </div>
                <StatusPill status={t.status} />
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="tabular font-display text-base font-bold">{value}</div>
    </div>
  );
}
