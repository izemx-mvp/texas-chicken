import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Plus, Power, Trash2, Workflow } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SectionTitle, StatusPill } from "@/components/tc/bits";
import { DataTable, type Column } from "@/components/tc/data-table";
import { can, currentUser, remove, uid, upsert, useStore } from "@/lib/tc/store";
import type { Process } from "@/lib/tc/types";

export const Route = createFileRoute("/admin/processes")({
  head: () => ({
    meta: [
      { title: "Processus & contrôles — Texas Chicken Administration" },
      { name: "description", content: "Bibliothèque des processus opérationnels : versions, étapes, zones et affectations restaurants." },
      { property: "og:title", content: "Processus & contrôles — Texas Chicken Administration" },
      { property: "og:description", content: "Dupliquez, activez et gérez les workflows du réseau." },
    ],
  }),
  component: AdminProcesses,
});

function AdminProcesses() {
  const rows = useStore((s) => s.processes);
  const user = useStore(() => currentUser());
  const [detail, setDetail] = useState<Process | null>(null);

  const columns: Column<Process>[] = [
    {
      key: "name",
      header: "Processus",
      sortable: true,
      value: (p) => p.name,
      render: (p) => (
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-gold" />
          <div>
            <div className="font-semibold">{p.name}</div>
            <div className="text-[11px] text-muted-foreground">v{p.version} · {p.steps.length} étapes</div>
          </div>
        </div>
      ),
    },
    { key: "category", header: "Catégorie", sortable: true, value: (p) => p.category },
    { key: "frequency", header: "Fréquence", sortable: true, value: (p) => p.frequency },
    { key: "priority", header: "Priorité", sortable: true, value: (p) => p.priority, render: (p) => <StatusPill status={p.priority} /> },
    { key: "restaurants", header: "Restaurants", sortable: true, value: (p) => p.restaurantIds.length },
    { key: "status", header: "Statut", sortable: true, value: (p) => p.status, render: (p) => <StatusPill status={p.status} /> },
    {
      key: "actions",
      header: "",
      render: (p) => (
        <div className="flex justify-end gap-1">
          {can(user, "Processus", "Créer") && (
            <Button
              size="icon"
              variant="ghost"
              aria-label="Dupliquer"
              onClick={(e) => {
                e.stopPropagation();
                upsert("processes", { ...p, id: uid("p"), name: `${p.name} (copie)`, status: "Brouillon", version: "1.0" });
                toast.success("Processus dupliqué en brouillon");
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
          {can(user, "Processus", "Modifier") && (
            <Button
              size="icon"
              variant="ghost"
              aria-label="Activer/désactiver"
              onClick={(e) => {
                e.stopPropagation();
                upsert("processes", { ...p, status: p.status === "Actif" ? "Inactif" : "Actif" });
                toast.success(p.status === "Actif" ? "Processus désactivé" : "Processus activé");
              }}
            >
              <Power className={p.status === "Actif" ? "h-4 w-4 text-success" : "h-4 w-4"} />
            </Button>
          )}
          {can(user, "Processus", "Supprimer") && (
            <Button
              size="icon"
              variant="ghost"
              aria-label="Supprimer"
              onClick={(e) => {
                e.stopPropagation();
                remove("processes", p.id);
                toast.success("Processus supprimé");
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Processus & contrôles"
        subtitle={`${rows.length} workflows · ${rows.reduce((a, p) => a + p.steps.length, 0)} étapes`}
        action={
          <Button asChild>
            <Link to="/admin/builder">
              <Plus className="mr-1.5 h-4 w-4" /> Nouveau processus
            </Link>
          </Button>
        }
      />

      <DataTable
        rows={rows}
        columns={columns}
        onRowClick={(p) => setDetail(p)}
        searchFields={(p) => `${p.name} ${p.category} ${p.author}`}
        filters={[
          { key: "cat", label: "Catégorie", options: [...new Set(rows.map((p) => p.category))], match: (p, v) => p.category === v },
          { key: "status", label: "Statut", options: ["Actif", "Brouillon", "Inactif", "Archivé"], match: (p, v) => p.status === v },
          { key: "prio", label: "Priorité", options: ["Basse", "Normale", "Haute", "Critique"], match: (p, v) => p.priority === v },
        ]}
      />

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/70 backdrop-blur-sm" onClick={() => setDetail(null)}>
          <div
            className="glass h-full w-full max-w-xl overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-2xl font-bold uppercase">{detail.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{detail.description}</p>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {[
                ["Catégorie", detail.category],
                ["Version", detail.version],
                ["Auteur", detail.author],
                ["Mise à jour", detail.updatedAt],
                ["Fréquence", detail.frequency],
                ["Restaurants", `${detail.restaurantIds.length}`],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl border border-border bg-secondary/30 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
                  <div className="font-semibold">{v}</div>
                </div>
              ))}
            </div>

            <h3 className="mt-6 font-display text-sm font-bold uppercase tracking-wider">Étapes</h3>
            <ol className="mt-2 space-y-2">
              {detail.steps.map((s, i) => (
                <li key={s.id} className="rounded-xl border border-border bg-secondary/25 p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{i + 1}. {s.name}</span>
                    <StatusPill status={s.priority} />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span>{s.zone}</span><span>{s.role}</span><span>{s.time}</span>
                    <span>{s.duration} min</span><span>{s.type}</span>
                    {s.evidenceRequired && <span className="text-gold">preuve obligatoire</span>}
                  </div>
                </li>
              ))}
            </ol>

            <h3 className="mt-6 font-display text-sm font-bold uppercase tracking-wider">Historique des versions</h3>
            <div className="mt-2 space-y-2">
              {detail.versions.map((v) => (
                <div key={v.version} className="rounded-xl border border-border bg-secondary/25 px-3 py-2 text-xs">
                  <div className="font-semibold">v{v.version} — {v.date}</div>
                  <div className="text-muted-foreground">{v.author} · {v.changes}</div>
                </div>
              ))}
            </div>

            <Button className="mt-6 w-full" variant="outline" onClick={() => setDetail(null)}>Fermer</Button>
          </div>
        </div>
      )}
    </div>
  );
}
