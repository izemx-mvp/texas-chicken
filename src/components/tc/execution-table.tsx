import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Clock, Image as ImageIcon, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./bits";
import { EvidenceThumb } from "./evidence-gallery";
import { executionsForDate, useStore } from "@/lib/tc/store";

const STATUS_STYLE: Record<string, string> = {
  Terminé: "border-success/50 bg-success/15 text-success",
  "En cours": "border-gold/50 bg-gold/15 text-gold",
  "À faire": "border-border bg-secondary/40 text-muted-foreground",
  "En retard": "border-danger/50 bg-danger/15 text-danger",
  Planifié: "border-border bg-secondary/40 text-muted-foreground",
};

/** Table des exécutions réelles d'une journée — ce que le manager a soumis. */
export function ExecutionTable({ date, restaurantId }: { date: string; restaurantId: string }) {
  const rows = useStore((s) => executionsForDate(date, restaurantId, s));
  const [filter, setFilter] = useState<"Toutes" | "Non conformes" | "Fraude">("Toutes");

  const list = rows.filter((r) =>
    filter === "Toutes" ? true : filter === "Fraude" ? r.kpi.fraud > 0 : r.kpi.rejected + r.kpi.fraud > 0,
  );

  if (!rows.length)
    return <EmptyState title="Aucune exécution" description="Aucune tâche planifiée pour cette date." />;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(["Toutes", "Non conformes", "Fraude"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
              filter === f ? "border-gold/50 bg-gold/15 text-gold" : "border-border text-muted-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title="Rien à signaler" description="Aucune exécution ne correspond à ce filtre." />
      ) : (
        <div className="space-y-2">
          {list.map((e) => (
            <div key={e.key} className="glass rounded-2xl p-4">
              <div className="flex flex-wrap items-start gap-3">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{e.task.name}</span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                        STATUS_STYLE[e.status] ?? STATUS_STYLE["À faire"],
                      )}
                    >
                      {e.status}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                    {e.task.zone} · {e.process?.name ?? "Processus"} · {e.startedAt}
                    {e.completedAt ? ` → ${e.completedAt}` : ""} · {e.manager?.firstName} {e.manager?.lastName}
                  </span>
                </span>
                <Link
                  to="/admin/execution/$id"
                  params={{ id: `${e.date}__${e.task.id}__${restaurantId}` }}
                  className="rounded-xl border border-gold/40 bg-gold/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gold transition-colors hover:bg-gold/20"
                >
                  Voir détails
                </Link>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" /> {e.kpi.done}/{e.kpi.steps} étapes
                </span>
                <span className="inline-flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5 text-gold" /> {e.kpi.proofs} preuves
                </span>
                {e.kpi.rejected > 0 && (
                  <span className="inline-flex items-center gap-1 text-warning">
                    <AlertTriangle className="h-3.5 w-3.5" /> {e.kpi.rejected} rejetée(s)
                  </span>
                )}
                {e.kpi.fraud > 0 && (
                  <span className="inline-flex items-center gap-1 text-danger">
                    <ShieldAlert className="h-3.5 w-3.5" /> {e.kpi.fraud} suspecte(s)
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {e.duration} min
                </span>
                <span className="font-semibold text-foreground">Conformité {e.compliance}%</span>
              </div>

              {e.evidences.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {e.evidences.slice(0, 6).map((ev) => (
                    <EvidenceThumb key={ev.id} evidence={ev} onClick={() => undefined} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
