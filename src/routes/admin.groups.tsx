import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, MessageSquare, Pencil, Plus, Power, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionTitle, StatusPill } from "@/components/tc/bits";
import { DataTable, type Column } from "@/components/tc/data-table";
import { cn } from "@/lib/utils";
import { messagesOf, removeGroup, toggleGroupStatus, uid, upsertGroup, useStore } from "@/lib/tc/store";
import { GROUP_TYPES, type ChatGroup, type GroupType } from "@/lib/tc/ops";
import { GROUP_PHOTO_LIBRARY } from "@/lib/tc/people";
import { TCSelect } from "@/components/tc/select";
import { GroupAvatar, UserAvatar } from "@/components/tc/avatar";
import { MemberPicker } from "@/components/tc/member-picker";
import { PhotoUpload } from "@/components/tc/upload";
import { TCModal } from "@/components/tc/modal";

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

const STEPS = ["Informations", "Membres", "Administrateurs", "Vérification", "Créer"];

function GroupsPage() {
  const state = useStore((s) => s);
  const [draft, setDraft] = useState<ChatGroup | null>(null);
  const [step, setStep] = useState(0);

  const empty = (): ChatGroup => ({
    id: "",
    name: "",
    description: "",
    type: "Groupe restaurant",
    restaurantId: state.restaurants[0]?.id ?? null,
    avatar: GROUP_PHOTO_LIBRARY[state.chatGroups.length % GROUP_PHOTO_LIBRARY.length]!.url,
    memberIds: [],
    adminId: state.users[0]?.id ?? "",
    adminIds: state.users[0] ? [state.users[0].id] : [],
    createdAt: state.activeDate,
    status: "Actif",
  });

  const open = (g: ChatGroup | null) => {
    setDraft(g ?? empty());
    setStep(0);
  };

  const columns: Column<ChatGroup>[] = [
    {
      key: "name",
      header: "Groupe",
      sortable: true,
      value: (g) => g.name,
      render: (g) => (
        <div className="flex items-center gap-2.5">
          <GroupAvatar avatar={g.avatar} name={g.name} size={38} rounded="rounded-lg" />
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
    {
      key: "members",
      header: "Membres",
      sortable: true,
      value: (g) => g.memberIds.length,
      render: (g) => (
        <div className="flex items-center">
          {g.memberIds.slice(0, 4).map((id) => (
            <span key={id} className="-ml-2 first:ml-0">
              <UserAvatar user={state.users.find((u) => u.id === id)} size={24} rounded="rounded-full" />
            </span>
          ))}
          <span className="ml-2 text-xs text-muted-foreground">{g.memberIds.length}</span>
        </div>
      ),
    },
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
          <Button size="icon" variant="ghost" aria-label="Modifier" onClick={() => open({ ...g })}>
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

  const save = () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast.error("Le nom du groupe est obligatoire");
      setStep(0);
      return;
    }
    const admins = draft.adminIds?.length ? draft.adminIds : [draft.adminId].filter(Boolean);
    upsertGroup({
      ...draft,
      id: draft.id || uid("g"),
      adminId: admins[0] ?? draft.adminId,
      adminIds: admins,
      memberIds: Array.from(new Set([...draft.memberIds, ...admins])),
    });
    toast.success(draft.id ? "Groupe mis à jour" : "Groupe créé");
    setDraft(null);
  };

  const admins = (draft?.adminIds?.length ? draft.adminIds : draft ? [draft.adminId] : []).filter(Boolean);

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Groupes de communication"
        subtitle={`${state.chatGroups.length} groupes · ${state.chatMessages.length} messages échangés`}
        action={
          <Button onClick={() => open(null)}>
            <Plus className="mr-1.5 h-4 w-4" /> Nouveau groupe
          </Button>
        }
      />

      <DataTable rows={state.chatGroups} columns={columns} searchFields={(g) => `${g.name} ${g.type} ${g.description}`} />

      {draft && (
        <TCModal
          title={draft.id ? "Modifier le groupe" : "Nouveau groupe"}
          subtitle={`Étape ${String(step + 1).padStart(2, "0")} — ${STEPS[step]}`}
          onClose={() => setDraft(null)}
          size="lg"
          toolbar={
            <div className="flex items-center gap-1">
              {STEPS.map((s, i) => (
                <button
                  key={s}
                  onClick={() => setStep(i)}
                  className={cn(
                    "flex-1 rounded-full px-2 py-1.5 text-[10px] uppercase tracking-widest transition-colors",
                    i === step ? "bg-brand/20 text-foreground" : i < step ? "bg-success/15 text-success" : "bg-secondary/50 text-muted-foreground",
                  )}
                >
                  {String(i + 1).padStart(2, "0")} · {s}
                </button>
              ))}
            </div>
          }
          footer={
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Button variant="ghost" onClick={() => (step === 0 ? setDraft(null) : setStep((s) => s - 1))}>
                  {step === 0 ? (
                    "Annuler"
                  ) : (
                    <>
                      <ArrowLeft className="mr-1.5 h-4 w-4" /> Retour
                    </>
                  )}
                </Button>
                {step < STEPS.length - 1 ? (
                  <Button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
                    Continuer <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={save}>
                    <Check className="mr-1.5 h-4 w-4" />
                    {draft.id ? "Enregistrer le groupe" : "Créer le groupe"}
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                <MessageSquare className="h-3 w-3 text-gold" /> {draft.memberIds.length} membres · {admins.length} admin(s)
              </div>
            </div>
          }
        >
            <div className="min-h-72">
              {step === 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Nom</span>
                    <Input value={draft.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Restaurant Casablanca — Équipe" />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Description</span>
                    <Input value={draft.description} onChange={(e) => patch({ description: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Type</span>
                    <TCSelect
                      value={draft.type}
                      onChange={(v) => patch({ type: v as GroupType })}
                      options={GROUP_TYPES.map((t) => ({ value: t, label: t }))}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Restaurant</span>
                    <TCSelect
                      value={draft.restaurantId ?? ""}
                      onChange={(v) => patch({ restaurantId: v || null })}
                      searchable
                      options={[
                        { value: "", label: "Réseau / siège", description: "Groupe transverse" },
                        ...state.restaurants.map((r) => ({ value: r.id, label: r.name, description: r.city, group: "Restaurants" })),
                      ]}
                    />
                  </label>
                  <div className="sm:col-span-2 space-y-3">
                    <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
                      Photo du groupe
                    </span>
                    <PhotoUpload
                      value={draft.avatar}
                      onChange={(url) => patch({ avatar: url ?? "" })}
                      label="Photo du groupe"
                      hint="JPG ou PNG — carré recommandé"
                    />
                    <div>
                      <span className="mb-1.5 block text-[10px] uppercase tracking-widest text-muted-foreground">
                        Ou partir d'une photo suggérée
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {GROUP_PHOTO_LIBRARY.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => patch({ avatar: p.url })}
                            className={cn(
                              "overflow-hidden rounded-xl border-2 transition-all",
                              draft.avatar === p.url ? "border-gold" : "border-transparent opacity-70 hover:opacity-100",
                            )}
                            title={p.label}
                          >
                            <img src={p.url} alt={p.label} loading="lazy" width={96} height={64} className="h-16 w-24 object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {step === 1 && (
                <MemberPicker value={draft.memberIds} onChange={(ids) => patch({ memberIds: ids })} />
              )}

              {step === 2 && (
                <MemberPicker
                  title="Administrateurs"
                  value={admins}
                  onChange={(ids) => patch({ adminIds: ids, adminId: ids[0] ?? draft.adminId })}
                />
              )}

              {step >= 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 rounded-2xl border border-border bg-secondary/30 p-4">
                    <GroupAvatar avatar={draft.avatar} name={draft.name} size={72} rounded="rounded-2xl" />
                    <div className="min-w-0">
                      <div className="font-display text-lg font-bold uppercase">{draft.name || "Sans nom"}</div>
                      <div className="text-xs text-muted-foreground">{draft.description || "Aucune description"}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-gold">
                        {draft.type} · {state.restaurants.find((r) => r.id === draft.restaurantId)?.name ?? "Réseau / siège"}
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border p-3">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Membres ({draft.memberIds.length})
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {draft.memberIds.slice(0, 12).map((id) => {
                          const u = state.users.find((x) => x.id === id);
                          return (
                            <span key={id} className="flex items-center gap-1.5 rounded-full bg-secondary/60 py-1 pl-1 pr-2 text-[11px]">
                              <UserAvatar user={u} size={18} rounded="rounded-full" />
                              {u?.firstName} {u?.lastName}
                            </span>
                          );
                        })}
                        {draft.memberIds.length === 0 && <span className="text-xs text-muted-foreground">Aucun membre</span>}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border p-3">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Administrateurs ({admins.length})
                      </div>
                      <div className="mt-2 space-y-1.5">
                        {admins.map((id) => {
                          const u = state.users.find((x) => x.id === id);
                          return (
                            <div key={id} className="flex items-center gap-2 text-xs">
                              <UserAvatar user={u} size={24} presence rounded="rounded-full" />
                              <span>
                                {u?.firstName} {u?.lastName}
                              </span>
                              <span className="ml-auto text-[10px] uppercase text-gold">{u?.role}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

        </TCModal>
      )}
    </div>
  );
}
