import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Building2, Camera, ClipboardCheck, ShieldCheck, Workflow } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ComplianceRing, KpiCard, SectionTitle, StatusPill } from "@/components/tc/bits";
import { kpis, useStore } from "@/lib/tc/store";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Operations Command Center — Texas Chicken Administration" },
      { name: "description", content: "Pilotage temps réel du réseau : conformité, contrôles, preuves IA et alertes critiques." },
      { property: "og:title", content: "Operations Command Center — Texas Chicken Administration" },
      { property: "og:description", content: "Vue consolidée de la performance opérationnelle du réseau Texas Chicken." },
    ],
  }),
  component: AdminHome,
});

const AXIS = { stroke: "oklch(0.62 0.02 60)", fontSize: 11 };

function AdminHome() {
  const s = useStore((st) => st);
  const k = kpis(s);

  const trend = Array.from({ length: 14 }, (_, i) => ({
    day: `J-${13 - i}`,
    conformite: 78 + ((i * 7) % 17),
    controles: 40 + ((i * 11) % 35),
  }));

  const byCity = Object.entries(
    s.restaurants.reduce<Record<string, { total: number; n: number }>>((acc, r) => {
      const cur = acc[r.city] ?? { total: 0, n: 0 };
      acc[r.city] = { total: cur.total + r.compliance, n: cur.n + 1 };
      return acc;
    }, {}),
  ).map(([city, v]) => ({ city, score: Math.round(v.total / v.n) }));

  const evidenceMix = [
    { name: "Valides", value: s.evidence.filter((e) => e.status === "Valide").length, fill: "oklch(0.72 0.17 150)" },
    { name: "Suspectes", value: s.evidence.filter((e) => e.status === "Suspecte").length, fill: "oklch(0.8 0.16 85)" },
    { name: "Dupliquées", value: s.evidence.filter((e) => e.status === "Dupliquée").length, fill: "oklch(0.62 0.23 28)" },
    { name: "Rejetées", value: s.evidence.filter((e) => e.status === "Rejetée").length, fill: "oklch(0.5 0.05 40)" },
  ];

  const worst = [...s.restaurants].sort((a, b) => a.compliance - b.compliance).slice(0, 6);

  return (
    <div className="space-y-6">
      <SectionTitle title="Operations Command Center" subtitle="Pilotage réseau temps réel" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Conformité réseau" value={k.compliance} suffix="%" tone="success" icon={<ShieldCheck className="h-4 w-4" />} hint="Moyenne pondérée des restaurants actifs" />
        <KpiCard label="Restaurants actifs" value={k.restaurants} icon={<Building2 className="h-4 w-4" />} hint="Réseau Maroc" />
        <KpiCard label="Contrôles exécutés" value={k.controls} icon={<ClipboardCheck className="h-4 w-4" />} hint={`${k.nonCompliance} non conformes`} />
        <KpiCard label="Alertes ouvertes" value={k.alerts} tone="danger" icon={<AlertTriangle className="h-4 w-4" />} hint={`${k.criticalAlerts} critiques`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="glass rounded-2xl p-5 xl:col-span-2">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider">Tendance conformité (14 jours)</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.23 28)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="oklch(0.62 0.23 28)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 60)" />
                <XAxis dataKey="day" {...AXIS} />
                <YAxis {...AXIS} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.02 60)", border: "1px solid oklch(0.32 0.02 60)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="conformite" stroke="oklch(0.62 0.23 28)" fill="url(#g1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass flex flex-col items-center justify-center rounded-2xl p-5">
          <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-wider">Score global</h3>
          <ComplianceRing value={k.compliance} size={168} />
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {k.evidenceAnalyzed} preuves analysées par l'IA · {k.evidenceRejected} rejetées
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="glass rounded-2xl p-5 xl:col-span-2">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider">Conformité par ville</h3>
          <div className="mt-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCity}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 60)" />
                <XAxis dataKey="city" {...AXIS} />
                <YAxis {...AXIS} />
                <Tooltip cursor={{ fill: "oklch(0.3 0.02 60 / 0.3)" }} contentStyle={{ background: "oklch(0.18 0.02 60)", border: "1px solid oklch(0.32 0.02 60)", borderRadius: 12 }} />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} fill="oklch(0.78 0.15 80)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider">Preuves IA</h3>
          <div className="mt-2 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={evidenceMix} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3}>
                  {evidenceMix.map((e) => (
                    <Cell key={e.name} fill={e.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.18 0.02 60)", border: "1px solid oklch(0.32 0.02 60)", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <Link to="/admin/evidence" className="mt-2 block text-center text-xs font-semibold uppercase tracking-widest text-gold">
            Ouvrir la galerie de preuves
          </Link>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider">Restaurants à risque</h3>
          <div className="mt-3 space-y-2">
            {worst.map((r) => (
              <Link
                key={r.id}
                to="/admin/restaurants"
                className="flex items-center gap-3 rounded-xl border border-border bg-secondary/25 px-3 py-2.5 transition-colors hover:border-gold/40"
              >
                <Building2 className="h-4 w-4 text-gold" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{r.name}</div>
                  <div className="text-[11px] text-muted-foreground">{r.city} · {r.code}</div>
                </div>
                <span className="font-display text-lg font-bold text-warning">{r.compliance}%</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider">Flux d'alertes</h3>
          <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {s.alerts.slice(0, 12).map((a) => (
              <div key={a.id} className="rounded-xl border border-border bg-secondary/25 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <StatusPill status={a.level} />
                  <span className="text-[10px] text-muted-foreground">{a.createdAt}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{a.message}</p>
              </div>
            ))}
          </div>
          <Link to="/admin/alerts" className="mt-3 block text-center text-xs font-semibold uppercase tracking-widest text-gold">
            <Camera className="mr-1 inline h-3 w-3" /> Alert Center
          </Link>
        </div>
      </div>

      <div className="glass flex flex-wrap items-center gap-3 rounded-2xl p-5">
        <Workflow className="h-5 w-5 text-gold" />
        <span className="text-sm text-muted-foreground">Créer un nouveau workflow opérationnel dans le Process Builder</span>
        <Link
          to="/admin/builder"
          className="ml-auto rounded-xl bg-brand px-4 py-2 text-xs font-bold uppercase tracking-widest text-brand-foreground"
        >
          Ouvrir le builder
        </Link>
      </div>
    </div>
  );
}
