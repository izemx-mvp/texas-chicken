import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, MessageSquare, Pencil, Plus, Power, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionTitle, StatusPill } from "@/components/tc/bits";
import { DataTable, type Column } from "@/components/tc/data-table";
import { cn } from "@/lib/utils";
import { messagesOf, removeGroup, toggleGroupStatus, uid, upsertGroup, useStore } from "@/lib/tc/store";
import { GROUP_TYPES, type ChatGroup, type GroupType } from "@/lib/tc/ops";

export const Route = createFileRoute("/admin/groups")({
  head: () => ({
    meta: [
      { title: "Groupes de communication — Texas Chicken Administration" },
      {
        name: "description",
        content:
          "Créez et administrez les groupes de discussion du réseau Texas Chicken : membres, type de groupe, restaurant rattaché et activité.",
      },
      { property: "og:title", content: "Groupes de communication — Texas Chicken Administration" },
      { property: "og:description", content: "CRUD complet des groupes, gestion des membres et suivi des échanges." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GroupsPage,
});

const AVATARS = [
  "linear-gradient(135deg,#d8452f,#f0a32f)",
  "linear-gradient(135deg,#2f6fd8,#39c2c9)",
  "linear-gradient(135deg,#8e44ad,#e8b23a)",
  "linear-gradient(135deg,#1f8a54,#a8d94a)",
  "linear-gradient(135deg,#34495e,#5f8fb0)",
];

function GroupsPage() {
  const state = useStore((s) => s);
  const [draft, setDraft] = useState<ChatGroup | null>(null);

  const empty = (): ChatGroup => ({
    id: "",
    name: "",
    description: "",
    type: "Groupe restaurant",
    restaurantId: state.restaurants[0]?.id ?? null,
    avatar: AVATARS[state.chatGroups.length % AVATARS.length]!,
    memberIds: [],
    adminId: state.users[0]?.id ?? "",
    createdAt: state.activeDate,
    status: "Actif",
  });

  const columns: Column<ChatGroup>[] = [
    {
      key: "name",
      header: "Groupe",
      sortable: true,
      value: (g) => g.name,
      render: (g) => (
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 shrink-0 rounded-lg" style={{ background: g.avatar }} />
          <div>
            <div className="font-semibold">{g.name}</div>
            <div className="text-[11px] text-muted-foreground">{g.description}</div>
          </div>
        </div>
      ),
    },
    { key: "type", header: "Type", sortable: true, value: (g) => g.type },
    {
      key: "restaurant",
      header: "Restaurant",
      value: (g) => state.restaurants.find((r) => r.id === g.restaurantId)?.name ?? "Réseau",
    },
    { key: "members", header: "Membres", sortable: true, value: (g) => g.memberIds.length },
    { key: "messages", header: "Messages", sortable: true, value: (g) => messagesOf(g.id, state).length },
    { key: "status", header: "Statut", value: (g) => g.status, render: (g) => <StatusPill status={g.status} /> },
    {
      key: "actions",
      header: "",
      render: (g) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" aria-label="Activer" onClick={() => toggleGroupStatus(g.id)}>
            <Power className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" aria-label="Modifier" onClick={() => setDraft({ ...g })}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Supprimer"
            onClick={() => {
              removeGroup(g.id);
              toast.success("Groupe supprimé");
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const patch = (p: Partial<ChatGroup>) => setDraft((d) => (d ? { ...d, ...p } : d));

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Groupes de communication"
        subtitle={`${state.chatGroups.length} groupes · ${state.chatMessages.length} messages échangés`}
        action={
          <Button onClick={() => setDraft(empty())}>
            <Plus className="mr-1.5 h-4 w-4" /> Nouveau groupe
          </Button>
        }
      />

      <DataTable rows={state.chatGroups} columns={columns} searchFields={(g) => `${g.name} ${g.type} ${g.description}`} />

      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass animate-rise max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl p-6">
            <div className="flex items-start justify-between">
              <h2 className="font-display text-xl font-bold uppercase">
                {draft.id ? "Modifier le groupe" : "Nouveau groupe"}
              </h2>
              <button onClick={() => setDraft(null)} aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Nom</span>
                <Input value={draft.name} onChange={(e) => patch({ name: e.target.value })} />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Description</span>
                <Input value={draft.description} onChange={(e) => patch({ description: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Type</span>
                <select
                  className="h-10 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm"
                  value={draft.type}
                  onChange={(e) => patch({ type: e.target.value as GroupType })}
                >
                  {GROUP_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Restaurant</span>
                <select
                  className="h-10 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm"
                  value={draft.restaurantId ?? ""}
                  onChange={(e) => patch({ restaurantId: e.target.value || null })}
                >
                  <option value="">Réseau / siège</option>
                  {state.restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                  Administrateur du groupe
                </span>
                <select
                  className="h-10 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm"
                  value={draft.adminId}
                  onChange={(e) => patch({ adminId: e.target.value })}
                >
                  {state.users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} — {u.role}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                Membres ({draft.memberIds.length})
              </div>
              <div className="grid max-h-52 gap-1 overflow-y-auto rounded-2xl border border-border p-2 sm:grid-cols-2">
                {state.users.map((u) => {
                  const on = draft.memberIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() =>
                        patch({
                          memberIds: on ? draft.memberIds.filter((x) => x !== u.id) : [...draft.memberIds, u.id],
                        })
                      }
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs transition-colors",
                        on ? "bg-brand/15 text-foreground" : "text-muted-foreground hover:bg-secondary/50",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-4 w-4 shrink-0 place-items-center rounded border",
                          on ? "border-success/60 bg-success/25 text-success" : "border-border",
                        )}
                      >
                        {on && <Check className="h-3 w-3" />}
                      </span>
                      <span className="truncate">
                        {u.firstName} {u.lastName}
                      </span>
                      <span className="ml-auto shrink-0 text-[10px]">{u.role}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDraft(null)}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  if (!draft.name.trim()) {
                    toast.error("Le nom du groupe est obligatoire");
                    return;
                  }
                  upsertGroup({ ...draft, id: draft.id || uid("g") });
                  toast.success(draft.id ? "Groupe mis à jour" : "Groupe créé");
                  setDraft(null);
                }}
              >
                <MessageSquare className="mr-1.5 h-4 w-4" /> Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
