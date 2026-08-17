import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Camera, MapPin, ShieldAlert, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ComplianceRing, KpiCard, StatusPill } from "@/components/tc/bits";
import { TaskBoard } from "@/components/tc/task-board";
import texasLogo from "@/assets/texas-chicken-logo.svg";
import { cn } from "@/lib/utils";
import { restaurantStats, useStore } from "@/lib/tc/store";

export const Route = createFileRoute("/admin/restaurants/$id")({
  head: () => ({
    meta: [
      { title: "Vue 360° restaurant — Texas Chicken Administration" },
      {
        name: "description",
        content: "Analyse complète d'un restaurant Texas Chicken : conformité, tâches du shift, preuves IA et historique de fraude.",
      },
      { property: "og:title", content: "Vue 360° restaurant — Texas Chicken Administration" },
      { property: "og:description", content: "Dashboard analytique et suivi des tâches d'un restaurant du réseau." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RestaurantPage,
});

function RestaurantPage() {
  const { id } = useParams({ from: "/admin/restaurants/$id" });
  const state = useStore((s) => s);
  const restaurant = state.restaurants.find((r) => r.id === id);
  const [tab, setTab] = useState<"dashboard" | "tasks">("dashboard");

  if (!restaurant) {
    return (
      <div className="glass rounded-3xl p-10 text-center">
        <p className="text-sm text-muted-foreground">Restaurant introuvable.</p>
        <Link to="/admin/restaurants" className="mt-3 inline-block text-sm font-semibold text-gold">
          Retour à la carte
        </Link>
      </div>
    );
  }

  const stats = restaurantStats(restaurant.id, state);
  const manager = state.users.find((u) => u.id === restaurant.managerId);
  const alerts = state.alerts.filter((a) => a.restaurantId === restaurant.id);
  const evidence = state.evidence.filter((e) => e.restaurantId === restaurant.id);
  const controls = state.controls.filter((c) => c.restaurantId === restaurant.id);
  const fraud = evidence.filter((e) => e.status === "Dupliquée" || e.status === "Rejetée" || e.status === "Suspecte");

  const trend = Array.from({ length: 14 }, (_, i) => ({
    j: `J-${13 - i}`,
    conformite: Math.max(60, Math.min(100, restaurant.compliance - 6 + ((i * 7 + restaurant.code.length) % 11))),
  }));
  const zones = ["Cuisine", "Salle", "Stock", "Hygiène"].map((z, i) => ({
    zone: z,
    controles: controls.filter((c) => c.zone === z).length || (i + 2) * 3,
  }));

  return (
    <div className="space-y-5">
      <Link to="/admin/restaurants" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Retour à la carte du réseau
      </Link>

      <header className="glass relative overflow-hidden rounded-3xl p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-6">
          <img src={texasLogo} alt="Texas Chicken" className="h-20 w-20 object-contain drop-shadow-[0_0_18px_oklch(0.86_0.17_82/45%)]" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">Vue 360°</p>
            <h1 className="font-display text-2xl font-bold uppercase">{restaurant.name}</h1>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {restaurant.code} · {restaurant.address}
            </p>
          </div>
          <ComplianceRing value={restaurant.compliance} />
        </div>
        <div className="relative mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Tâches du jour" value={`${stats.done}/${stats.total}`} />
          <KpiCard label="Preuves IA" value={evidence.length} icon={<Camera className="h-4 w-4" />} />
          <KpiCard label="Alertes ouvertes" value={alerts.filter((a) => !a.resolved).length} tone="warning" />
          <KpiCard label="Effectif" value={restaurant.staff} icon={<Users className="h-4 w-4" />} />
        </div>
      </header>

      <div className="flex gap-1 rounded-xl border border-border p-1">
        {(["dashboard", "tasks"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-widest transition-colors",
              tab === t ? "bg-brand/20 text-foreground" : "text-muted-foreground",
            )}
          >
            {t === "dashboard" ? "Dashboard" : "Tâches"}
          </button>
        ))}
      </div>

      {tab === "dashboard" ? (
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="glass rounded-3xl p-5">
              <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider">Tendance de conformité (14 j)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="rc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.62 0.23 28)" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="oklch(0.62 0.23 28)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="j" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                  <Area type="monotone" dataKey="conformite" stroke="oklch(0.62 0.23 28)" fill="url(#rc)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="glass rounded-3xl p-5">
              <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider">Contrôles par zone</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={zones}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="zone" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                  <Bar dataKey="controles" fill="oklch(0.86 0.17 82)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Responsable" value={manager ? `${manager.firstName} ${manager.lastName}` : "—"} />
            <Info label="Ville" value={restaurant.city} />
            <Info label="Ouverture" value={restaurant.openedAt} />
            <Info label="Dernière activité" value={restaurant.lastActivity} />
          </div>

          <div className="glass rounded-3xl p-5">
            <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider">
              <ShieldAlert className="h-4 w-4 text-destructive" /> Historique fraude IA ({fraud.length})
            </h3>
            <div className="space-y-2">
              {fraud.slice(0, 8).map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/25 p-3">
                  <span className="h-9 w-9 shrink-0 rounded-lg" style={{ background: e.gradient }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{e.stepName}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {e.ref} · {e.date} {e.time} · score IA {e.aiScore}% · hash {e.hash.slice(0, 10)}
                    </div>
                  </div>
                  <StatusPill status={e.status} />
                </div>
              ))}
              {fraud.length === 0 && <p className="text-sm text-muted-foreground">Aucune preuve suspecte détectée.</p>}
            </div>
          </div>

          <div className="glass rounded-3xl p-5">
            <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider">Alertes récentes</h3>
            <div className="space-y-2">
              {alerts.slice(0, 6).map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/25 p-3">
                  <StatusPill status={a.level} />
                  <span className="min-w-0 flex-1 truncate text-sm">{a.message}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{a.createdAt}</span>
                </div>
              ))}
              {alerts.length === 0 && <p className="text-sm text-muted-foreground">Aucune alerte.</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass rounded-3xl p-5">
          <TaskBoard title={`Tâches — ${restaurant.name}`} />
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl px-4 py-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
