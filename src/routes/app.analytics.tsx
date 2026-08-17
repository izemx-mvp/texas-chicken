import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { ComplianceRing, KpiCard, SectionTitle, StatusPill } from "@/components/tc/bits";
import { currentUser, useStore } from "@/lib/tc/store";
import { ZONE_GROUP } from "@/lib/tc/types";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics restaurant — Texas Chicken Operations" },
      {
        name: "description",
        content:
          "Analysez la performance de votre restaurant : conformité, retards, preuves IA et répartition BOH / FOH.",
      },
      { property: "og:title", content: "Analytics restaurant — Texas Chicken Operations" },
      {
        property: "og:description",
        content: "Tendances de conformité, exécution des tâches et qualité des preuves photo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManagerAnalytics,
});

const RANGES = ["7 jours", "30 jours", "90 jours"] as const;

function ManagerAnalytics() {
  const user = useStore(() => currentUser());
  const restaurant = useStore((s) => s.restaurants.find((r) => r.id === user?.restaurantId));
  const tasks = useStore((s) => s.shiftTasks);
  const alerts = useStore((s) => s.alerts.filter((a) => a.restaurantId === user?.restaurantId));
  const evidence = useStore((s) => s.evidence.filter((e) => e.restaurantId === user?.restaurantId));
  const [range, setRange] = useState<(typeof RANGES)[number]>("30 jours");

  const days = range === "7 jours" ? 7 : range === "30 jours" ? 30 : 90;
  const compliance = restaurant?.compliance ?? 88;

  const trend = useMemo(
    () =>
      Array.from({ length: days > 30 ? 18 : days > 7 ? 15 : 7 }, (_, i, arr) => ({
        label: `J-${(arr.length - i - 1) * Math.round(days / arr.length)}`,
        conformite: Math.max(
          50,
          Math.min(100, Math.round(compliance - 9 + i * (9 / arr.length) + Math.sin(i / 1.8) * 4)),
        ),
        retards: Math.max(0, Math.round(6 - i * 0.25 + Math.cos(i / 2) * 2)),
      })),
    [days, compliance],
  );

  const done = tasks.filter((t) => t.status === "Terminé").length;
  const late = tasks.filter((t) => t.status === "En retard").length;
  const nonConf = tasks.filter((t) => t.status === "Non conforme").length;

  const byZone = useMemo(() => {
    const map = new Map<string, { zone: string; total: number; done: number }>();
    for (const t of tasks) {
      const e = map.get(t.zone) ?? { zone: t.zone, total: 0, done: 0 };
      e.total += 1;
      if (t.status === "Terminé") e.done += 1;
      map.set(t.zone, e);
    }
    return [...map.values()].map((e) => ({
      ...e,
      taux: Math.round((e.done / Math.max(1, e.total)) * 100),
    }));
  }, [tasks]);

  const bohFoh = useMemo(() => {
    const boh = tasks.filter((t) => ZONE_GROUP[t.zone] === "BOH").length;
    return [
      { name: "BOH", value: boh },
      { name: "FOH", value: tasks.length - boh },
    ];
  }, [tasks]);

  const evidenceSplit = useMemo(
    () => [
      { name: "Valides", value: evidence.filter((e) => e.status === "Valide").length },
      { name: "Suspectes", value: evidence.filter((e) => e.status === "Suspecte").length },
      { name: "Rejetées", value: evidence.filter((e) => e.status === "Rejetée" || e.status === "Dupliquée").length },
    ],
    [evidence],
  );

  const COLORS = ["oklch(0.62 0.23 28)", "oklch(0.86 0.17 82)", "oklch(0.55 0.15 250)"];

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Analytics"
        subtitle={restaurant?.name ?? "Performance de votre restaurant"}
        action={
          <div className="flex gap-1.5">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={
                  "rounded-full border px-3 py-1 text-xs font-semibold transition-colors " +
                  (range === r ? "border-gold/60 bg-gold/15 text-gold" : "border-border text-muted-foreground")
                }
              >
                {r}
              </button>
            ))}
          </div>
        }
      />

      <div className="glass flex flex-wrap items-center gap-5 rounded-3xl p-5">
        <ComplianceRing value={compliance} />
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Terminées" value={done} tone="success" icon={<CheckCircle2 className="h-4 w-4" />} />
          <KpiCard label="En retard" value={late} tone="warning" icon={<Clock className="h-4 w-4" />} />
          <KpiCard label="Non conformes" value={nonConf} tone="danger" icon={<AlertTriangle className="h-4 w-4" />} />
          <KpiCard label="Preuves IA" value={evidence.length} icon={<ShieldCheck className="h-4 w-4" />} />
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider">
          Tendance de conformité — {range}
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="conf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.62 0.23 28)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="oklch(0.62 0.23 28)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeOpacity={0.12} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="conformite"
                stroke="oklch(0.62 0.23 28)"
                fill="url(#conf)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider">Exécution par zone</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byZone}>
                <CartesianGrid strokeOpacity={0.12} vertical={false} />
                <XAxis dataKey="zone" tick={{ fontSize: 9 }} interval={0} angle={-25} height={50} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="taux" fill="oklch(0.86 0.17 82)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider">Répartition BOH / FOH</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bohFoh} dataKey="value" nameKey="name" innerRadius={50} outerRadius={82} paddingAngle={4}>
                  {bohFoh.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider">
          Qualité des preuves (contrôle IA anti-fraude)
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {evidenceSplit.map((e, i) => (
            <div key={e.name} className="rounded-xl border border-border bg-secondary/30 p-4">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{e.name}</div>
              <div className="font-display text-3xl font-bold" style={{ color: COLORS[i] }}>
                {e.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider">Dernières alertes</h3>
          <Link to="/app/alerts" className="text-xs font-semibold uppercase tracking-widest text-gold">
            Tout voir
          </Link>
        </div>
        <div className="space-y-2">
          {alerts.slice(0, 6).map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/25 p-3">
              <StatusPill status={a.level} />
              <span className="min-w-0 flex-1 truncate text-sm">{a.message}</span>
              <span className="shrink-0 text-[10px] text-muted-foreground">{a.createdAt}</span>
            </div>
          ))}
          {alerts.length === 0 && <p className="text-sm text-muted-foreground">Aucune alerte sur la période.</p>}
        </div>
      </div>
    </div>
  );
}
