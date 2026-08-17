import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionTitle, StatusPill } from "@/components/tc/bits";
import { DataTable, type Column } from "@/components/tc/data-table";
import { currentUser, can, remove, uid, upsert, useStore } from "@/lib/tc/store";
import type { Restaurant } from "@/lib/tc/types";

export const Route = createFileRoute("/admin/restaurants")({
  head: () => ({
    meta: [
      { title: "Restaurants du réseau — Texas Chicken Administration" },
      { name: "description", content: "Gérez les restaurants du réseau : création, modification, conformité et effectifs." },
      { property: "og:title", content: "Restaurants du réseau — Texas Chicken Administration" },
      { property: "og:description", content: "CRUD complet des restaurants, scores de conformité et responsables." },
    ],
  }),
  component: AdminRestaurants,
});

const EMPTY: Restaurant = {
  id: "",
  name: "",
  code: "",
  city: "Casablanca",
  address: "",
  managerId: "",
  staff: 12,
  status: "Actif",
  compliance: 90,
  processCount: 6,
  controlCount: 0,
  lastActivity: "à l'instant",
  score: 90,
  openedAt: new Date().toISOString().slice(0, 10),
  lat: 33.5731,
  lng: -7.5898,
};

function AdminRestaurants() {
  const rows = useStore((s) => s.restaurants);
  const users = useStore((s) => s.users);
  const user = useStore(() => currentUser());
  const [draft, setDraft] = useState<Restaurant | null>(null);

  const editable = can(user, "Restaurants", "Modifier");
  const creatable = can(user, "Restaurants", "Créer");
  const deletable = can(user, "Restaurants", "Supprimer");

  const columns: Column<Restaurant>[] = [
    {
      key: "name",
      header: "Restaurant",
      sortable: true,
      value: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-secondary/50 text-gold">
            <Building2 className="h-4 w-4" />
          </span>
          <div>
            <div className="font-semibold">{r.name}</div>
            <div className="text-[11px] text-muted-foreground">{r.code}</div>
          </div>
        </div>
      ),
    },
    { key: "city", header: "Ville", sortable: true, value: (r) => r.city },
    {
      key: "manager",
      header: "Responsable",
      value: (r) => users.find((u) => u.id === r.managerId)?.lastName ?? "—",
      render: (r) => {
        const m = users.find((u) => u.id === r.managerId);
        return <span>{m ? `${m.firstName} ${m.lastName}` : "—"}</span>;
      },
    },
    { key: "staff", header: "Effectif", sortable: true, value: (r) => r.staff },
    {
      key: "compliance",
      header: "Conformité",
      sortable: true,
      value: (r) => r.compliance,
      render: (r) => (
        <span className={r.compliance >= 90 ? "text-success" : r.compliance >= 75 ? "text-warning" : "text-destructive"}>
          {r.compliance}%
        </span>
      ),
    },
    { key: "status", header: "Statut", sortable: true, value: (r) => r.status, render: (r) => <StatusPill status={r.status} /> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex justify-end gap-1">
          {editable && (
            <Button size="icon" variant="ghost" onClick={() => setDraft(r)} aria-label="Modifier">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {deletable && (
            <Button
              size="icon"
              variant="ghost"
              aria-label="Supprimer"
              onClick={() => {
                remove("restaurants", r.id);
                toast.success(`${r.name} supprimé`);
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const save = () => {
    if (!draft) return;
    if (!draft.name.trim() || !draft.code.trim()) {
      toast.error("Nom et code sont obligatoires");
      return;
    }
    upsert("restaurants", { ...draft, id: draft.id || uid("r") });
    toast.success(draft.id ? "Restaurant mis à jour" : "Restaurant créé");
    setDraft(null);
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Restaurants"
        subtitle={`${rows.length} établissements dans le réseau`}
        action={
          creatable && (
            <Button onClick={() => setDraft({ ...EMPTY })}>
              <Plus className="mr-1.5 h-4 w-4" /> Nouveau restaurant
            </Button>
          )
        }
      />

      <DataTable
        rows={rows}
        columns={columns}
        searchFields={(r) => `${r.name} ${r.code} ${r.city} ${r.address}`}
        filters={[
          { key: "city", label: "Ville", options: [...new Set(rows.map((r) => r.city))], match: (r, v) => r.city === v },
          { key: "status", label: "Statut", options: ["Actif", "Inactif"], match: (r, v) => r.status === v },
        ]}
      />

      {draft && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="glass animate-rise w-full max-w-lg rounded-3xl p-6">
            <h2 className="font-display text-xl font-bold uppercase">
              {draft.id ? "Modifier le restaurant" : "Nouveau restaurant"}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Nom"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
              <Field label="Code"><Input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} /></Field>
              <Field label="Ville"><Input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></Field>
              <Field label="Effectif">
                <Input type="number" value={draft.staff} onChange={(e) => setDraft({ ...draft, staff: Number(e.target.value) })} />
              </Field>
              <Field label="Responsable">
                <select
                  className="h-10 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm"
                  value={draft.managerId}
                  onChange={(e) => setDraft({ ...draft, managerId: e.target.value })}
                >
                  <option value="">—</option>
                  {users
                    .filter((u) => u.role === "Manager" || u.role === "Responsable restaurant")
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Statut">
                <select
                  className="h-10 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm"
                  value={draft.status}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value as Restaurant["status"] })}
                >
                  <option>Actif</option>
                  <option>Inactif</option>
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Adresse">
                  <Textarea value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
                </Field>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDraft(null)}>Annuler</Button>
              <Button onClick={save}>Enregistrer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
