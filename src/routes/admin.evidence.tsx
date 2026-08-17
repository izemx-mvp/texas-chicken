import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, KpiCard, SectionTitle, StatusPill } from "@/components/tc/bits";
import { cn } from "@/lib/utils";
import { upsert, useStore } from "@/lib/tc/store";
import type { Evidence } from "@/lib/tc/types";

export const Route = createFileRoute("/admin/evidence")({
  head: () => ({
    meta: [
      { title: "Galerie de preuves IA — Texas Chicken Administration" },
      { name: "description", content: "Toutes les preuves photo analysées par l'IA anti-fraude : scores, doublons et validations." },
      { property: "og:title", content: "Galerie de preuves IA — Texas Chicken Administration" },
      { property: "og:description", content: "Audit visuel des preuves terrain avec détection de doublons." },
    ],
  }),
  component: AdminEvidence,
});

const STATUSES = ["Toutes", "Valide", "Suspecte", "Dupliquée", "Rejetée", "En analyse"];

function AdminEvidence() {
  const evidence = useStore((s) => s.evidence);
  const restaurants = useStore((s) => s.restaurants);
  const users = useStore((s) => s.users);
  const [status, setStatus] = useState("Toutes");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Evidence | null>(null);

  const list = evidence.filter(
    (e) =>
      (status === "Toutes" || e.status === status) &&
      `${e.ref} ${e.stepName}`.toLowerCase().includes(q.toLowerCase()),
  );

  const rname = (id: string) => restaurants.find((r) => r.id === id)?.name ?? "—";
  const uname = (id: string) => {
    const u = users.find((x) => x.id === id);
    return u ? `${u.firstName} ${u.lastName}` : "—";
  };

  return (
    <div className="space-y-5">
      <SectionTitle title="Preuves & IA anti-fraude" subtitle={`${evidence.length} preuves analysées`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Preuves valides" value={evidence.filter((e) => e.status === "Valide").length} tone="success" icon={<ShieldCheck className="h-4 w-4" />} />
        <KpiCard label="Suspectes" value={evidence.filter((e) => e.status === "Suspecte").length} tone="warning" icon={<ShieldAlert className="h-4 w-4" />} />
        <KpiCard label="Doublons détectés" value={evidence.filter((e) => e.status === "Dupliquée").length} tone="danger" />
        <KpiCard label="Score IA moyen" value={Math.round(evidence.reduce((a, e) => a + e.aiScore, 0) / Math.max(1, evidence.length))} suffix="%" tone="brand" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une preuve..." className="h-10 max-w-xs bg-secondary/40" />
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
              status === s ? "border-gold/50 bg-gold/15 text-gold" : "border-border text-muted-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title="Aucune preuve" description="Aucun élément ne correspond à ces filtres." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((e, i) => (
            <button
              key={e.id}
              onClick={() => setOpen(e)}
              className="glass hover-lift animate-rise overflow-hidden rounded-2xl text-left"
              style={{ animationDelay: `${i * 15}ms` }}
            >
              <div className="relative h-36" style={{ background: e.gradient }}>
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,oklch(0_0_0/0.35))]" />
                <span className="absolute left-2 top-2"><StatusPill status={e.status} /></span>
                <span className="absolute bottom-2 right-2 rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-bold text-gold">
                  IA {e.aiScore}%
                </span>
              </div>
              <div className="p-3">
                <div className="truncate text-sm font-semibold">{e.stepName}</div>
                <div className="truncate text-[11px] text-muted-foreground">{rname(e.restaurantId)}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">{e.date} · {e.time} · {e.ref}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/85 p-4 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <div className="glass animate-rise w-full max-w-lg overflow-hidden rounded-3xl" onClick={(ev) => ev.stopPropagation()}>
            <div className="h-56" style={{ background: open.gradient }} />
            <div className="space-y-3 p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold uppercase">{open.stepName}</h2>
                <StatusPill status={open.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ["Référence", open.ref],
                  ["Restaurant", rname(open.restaurantId)],
                  ["Opérateur", uname(open.userId)],
                  ["Date", `${open.date} ${open.time}`],
                  ["Score IA", `${open.aiScore}%`],
                  ["Empreinte", open.hash.slice(0, 14)],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-xl border border-border bg-secondary/30 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
                    <div className="font-semibold">{v}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    upsert("evidence", { ...open, status: "Valide" });
                    toast.success("Preuve validée");
                    setOpen(null);
                  }}
                >
                  Valider
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    upsert("evidence", { ...open, status: "Rejetée" });
                    toast.error("Preuve rejetée");
                    setOpen(null);
                  }}
                >
                  Rejeter
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
