import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Pencil, Plus, Shield, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionTitle, StatusPill } from "@/components/tc/bits";
import { DataTable, type Column } from "@/components/tc/data-table";
import { cn } from "@/lib/utils";
import { can, currentUser, remove, uid, upsert, useStore } from "@/lib/tc/store";
import { MODULES, PERMISSIONS, type PermissionName, type Role, type User, type UserRole } from "@/lib/tc/types";
import { TCSelect } from "@/components/tc/select";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Utilisateurs & permissions — Texas Chicken Administration" },
      {
        name: "description",
        content: "Gérez les comptes du réseau Texas Chicken : rôles, restaurants affectés et matrice de permissions par interface.",
      },
      { property: "og:title", content: "Utilisateurs & permissions — Texas Chicken Administration" },
      { property: "og:description", content: "CRUD complet des utilisateurs et matrice de permissions Voir / Créer / Modifier / Supprimer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UsersPage,
});

const ROLES: UserRole[] = [
  "Super Admin",
  "Operations Admin",
  "Operations Manager",
  "Restaurant Admin",
  "General Manager",
  "Auditeur",
  "Manager",
  "Responsable restaurant",
  "Restaurant Manager",
  "Assistant Manager",
  "Shift Leader",
  "Crew Member",
  "Cook",
  "Cashier",
  "Drive-Thru Staff",
  "Cleaning / Hygiene Staff",
  "Maintenance",
];


function UsersPage() {
  const users = useStore((s) => s.users);
  const roles = useStore((s) => s.roles);
  const restaurants = useStore((s) => s.restaurants);
  const me = useStore(() => currentUser());
  const [tab, setTab] = useState<"users" | "roles">("users");
  const [draft, setDraft] = useState<User | null>(null);

  const editable = can(me, "Utilisateurs", "Modifier");
  const creatable = can(me, "Utilisateurs", "Créer");
  const deletable = can(me, "Utilisateurs", "Supprimer");

  const empty = (): User => ({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    restaurantId: restaurants[0]?.id ?? null,
    restaurantIds: [],
    role: "Manager",
    status: "Actif",
    lastLogin: "—",
    score: 90,
    tasks: 0,
    late: 0,
    processes: 0,
    alerts: 0,
    password: "texas2024",
    roleId: roles[0]?.id ?? "",
  });

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Utilisateur",
      sortable: true,
      value: (u) => `${u.firstName} ${u.lastName}`,
      render: (u) => (
        <div>
          <div className="font-semibold">
            {u.firstName} {u.lastName}
          </div>
          <div className="text-[11px] text-muted-foreground">{u.email}</div>
        </div>
      ),
    },
    { key: "role", header: "Rôle", sortable: true, value: (u) => u.role },
    {
      key: "restaurants",
      header: "Restaurants",
      value: (u) => (u.restaurantIds?.length ? u.restaurantIds.length + 1 : 1),
      render: (u) => {
        const main = restaurants.find((r) => r.id === u.restaurantId);
        const extra = u.restaurantIds?.filter((id) => id !== u.restaurantId).length ?? 0;
        return (
          <span className="text-xs">
            {main?.name ?? "Siège"}
            {extra > 0 && <span className="ml-1 text-gold">+{extra}</span>}
          </span>
        );
      },
    },
    { key: "score", header: "Score", sortable: true, value: (u) => u.score, render: (u) => `${u.score}%` },
    { key: "status", header: "Statut", sortable: true, value: (u) => u.status, render: (u) => <StatusPill status={u.status} /> },
    {
      key: "actions",
      header: "",
      render: (u) => (
        <div className="flex justify-end gap-1">
          {editable && (
            <Button size="icon" variant="ghost" aria-label="Modifier" onClick={() => setDraft({ ...u })}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {deletable && (
            <Button
              size="icon"
              variant="ghost"
              aria-label="Supprimer"
              onClick={() => {
                remove("users", u.id);
                toast.success("Utilisateur supprimé");
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const patch = (p: Partial<User>) => setDraft((d) => (d ? { ...d, ...p } : d));

  const save = () => {
    if (!draft) return;
    if (!draft.firstName.trim() || !draft.lastName.trim() || !/.+@.+\..+/.test(draft.email)) {
      toast.error("Nom, prénom et email valide sont obligatoires");
      return;
    }
    upsert("users", { ...draft, id: draft.id || uid("u") });
    toast.success(draft.id ? "Utilisateur mis à jour" : "Utilisateur créé");
    setDraft(null);
  };

  const togglePerm = (role: Role, module: string, perm: PermissionName) => {
    const list = role.permissions[module] ?? [];
    const next = list.includes(perm) ? list.filter((p) => p !== perm) : [...list, perm];
    upsert("roles", { ...role, permissions: { ...role.permissions, [module]: next } });
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Utilisateurs & permissions"
        subtitle={`${users.length} comptes · ${roles.length} rôles`}
        action={
          creatable && tab === "users" ? (
            <Button onClick={() => setDraft(empty())}>
              <Plus className="mr-1.5 h-4 w-4" /> Nouvel utilisateur
            </Button>
          ) : undefined
        }
      />

      <div className="flex gap-1 rounded-xl border border-border p-1">
        {(["users", "roles"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-widest transition-colors",
              tab === t ? "bg-brand/20 text-foreground" : "text-muted-foreground",
            )}
          >
            {t === "users" ? "Utilisateurs" : "Rôles & permissions"}
          </button>
        ))}
      </div>

      {tab === "users" ? (
        <DataTable
          rows={users}
          columns={columns}
          searchFields={(u) => `${u.firstName} ${u.lastName} ${u.email} ${u.role}`}
        />
      ) : (
        <div className="space-y-4">
          {roles.map((role) => {
            const superRole = /super/i.test(role.name) || role.id === "role-super";
            return (
            <div key={role.id} className="glass rounded-3xl p-5">
              <div className="mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-gold" />
                <div>
                  <div className="font-display text-sm font-bold uppercase">{role.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {superRole ? "Accès total automatique à toutes les interfaces et actions" : role.description}
                  </div>
                </div>
                {role.system && <span className="ml-auto text-[10px] uppercase tracking-widest text-gold">Système</span>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-xs">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      <th className="py-2">Module (interface)</th>
                      {PERMISSIONS.map((p) => (
                        <th key={p} className="py-2 text-center">
                          {p}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map((m) => (
                      <tr key={m} className="border-t border-border/60">
                        <td className="py-2 font-medium">{m}</td>
                        {PERMISSIONS.map((p) => {
                          const on = superRole || role.permissions[m]?.includes(p);
                          return (
                            <td key={p} className="py-1.5 text-center">
                              <button
                                disabled={superRole}
                                onClick={() => togglePerm(role, m, p)}
                                aria-label={`${m} ${p}`}
                                className={cn(
                                  "grid h-6 w-6 place-items-center rounded-md border transition-colors",
                                  on ? "border-success/50 bg-success/20 text-success" : "border-border text-muted-foreground",
                                  superRole && "opacity-70",
                                )}
                              >
                                {on ? <Check className="h-3.5 w-3.5" /> : <X className="h-3 w-3 opacity-40" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass animate-rise max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl p-6">
            <div className="flex items-start justify-between">
              <h2 className="font-display text-xl font-bold uppercase">
                {draft.id ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
              </h2>
              <button onClick={() => setDraft(null)} aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Prénom">
                <Input value={draft.firstName} onChange={(e) => patch({ firstName: e.target.value })} />
              </Field>
              <Field label="Nom">
                <Input value={draft.lastName} onChange={(e) => patch({ lastName: e.target.value })} />
              </Field>
              <Field label="Email">
                <Input value={draft.email} onChange={(e) => patch({ email: e.target.value })} />
              </Field>
              <Field label="Mot de passe">
                <Input value={draft.password ?? ""} onChange={(e) => patch({ password: e.target.value })} />
              </Field>
              <Field label="Rôle métier">
                <TCSelect value={draft.role} onChange={(v) => patch({ role: v as UserRole })} searchable options={ROLES.map((r) => ({ value: r, label: r }))} />
              </Field>
              <Field label="Rôle de permissions">
                <TCSelect
                  value={draft.roleId}
                  onChange={(v) => patch({ roleId: v })}
                  searchable
                  options={roles.map((r) => ({ value: r.id, label: r.name, description: r.description }))}
                />
              </Field>
              <Field label="Restaurant principal">
                <TCSelect
                  value={draft.restaurantId ?? ""}
                  onChange={(v) => patch({ restaurantId: v || null })}
                  searchable
                  options={[{ value: "", label: "Siège / réseau", description: "Accès transverse" }, ...restaurants.map((r) => ({ value: r.id, label: r.name, description: r.city, group: "Restaurants" }))]}
                />
              </Field>
              <Field label="Statut">
                <TCSelect
                  value={draft.status}
                  onChange={(v) => patch({ status: v as User["status"] })}
                  options={[
                    { value: "Actif", label: "Actif", description: "Compte opérationnel" },
                    { value: "Inactif", label: "Inactif", description: "Accès suspendu" },
                  ]}
                />
              </Field>
            </div>

            <div className="mt-4">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                Restaurants autorisés (multi-sites)
              </div>
              <div className="grid max-h-40 gap-1 overflow-y-auto rounded-2xl border border-border p-2 sm:grid-cols-2">
                {restaurants.map((r) => {
                  const on = draft.restaurantIds?.includes(r.id) || draft.restaurantId === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() =>
                        patch({
                          restaurantIds: draft.restaurantIds?.includes(r.id)
                            ? draft.restaurantIds.filter((x) => x !== r.id)
                            : [...(draft.restaurantIds ?? []), r.id],
                        })
                      }
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs transition-colors",
                        on ? "bg-brand/15 text-foreground" : "text-muted-foreground hover:bg-secondary/50",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-4 w-4 place-items-center rounded border",
                          on ? "border-success/60 bg-success/25 text-success" : "border-border",
                        )}
                      >
                        {on && <Check className="h-3 w-3" />}
                      </span>
                      <span className="truncate">{r.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDraft(null)}>
                Annuler
              </Button>
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
