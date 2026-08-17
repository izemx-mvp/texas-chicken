import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  Check,
  LayoutGrid,
  Map as MapIcon,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ComplianceRing, KpiCard, ProgressBar, SectionTitle, StatusPill } from "@/components/tc/bits";
import { DataTable, type Column } from "@/components/tc/data-table";
import { MoroccoMap } from "@/components/tc/morocco-map";
import { cn } from "@/lib/utils";
import { currentUser, can, remove, uid, upsert, useStore } from "@/lib/tc/store";
import { CITY_COORDS } from "@/lib/tc/data";
import type { Restaurant } from "@/lib/tc/types";

export const Route = createFileRoute("/admin/restaurants")({
  head: () => ({
    meta: [
      { title: "Restaurants du réseau — Texas Chicken Administration" },
      {
        name: "description",
        content:
          "Cartographie interactive du réseau marocain, création guidée et vue 360° de chaque restaurant : conformité, tâches et preuves IA.",
      },
      { property: "og:title", content: "Restaurants du réseau — Texas Chicken Administration" },
      {
        property: "og:description",
        content: "Carte du Maroc, fiches restaurants, tâches exécutées et historique anti-fraude.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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

const STEPS = ["Identité", "Localisation", "Équipe & standards"];

function AdminRestaurants() {
  const rows = useStore((s) => s.restaurants);
  const users = useStore((s) => s.users);
  const user = useStore(() => currentUser());
  const [draft, setDraft] = useState<Restaurant | null>(null);
  const [wizardStep, setWizardStep] = useState(0);
  const [view, setView] = useState<"map" | "list">("map");
  const [city, setCity] = useState<string | null>(null);
  const [detail, setDetail] = useState<Restaurant | null>(null);

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
        <button className="flex items-center gap-2 text-left" onClick={() => setDetail(r)}>
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-secondary/50 text-gold">
            <Building2 className="h-4 w-4" />
          </span>
          <span>
            <span className="block font-semibold">{r.name}</span>
            <span className="block text-[11px] text-muted-foreground">{r.code}</span>
          </span>
        </button>
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
        <span
          className={
            r.compliance >= 90 ? "text-success" : r.compliance >= 75 ? "text-warning" : "text-destructive"
          }
        >
          {r.compliance}%
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      sortable: true,
      value: (r) => r.status,
      render: (r) => <StatusPill status={r.status} />,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex justify-end gap-1">
          {editable && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setDraft(r);
                setWizardStep(0);
              }}
              aria-label="Modifier"
            >
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

  const patch = (p: Partial<Restaurant>) => setDraft((d) => (d ? { ...d, ...p } : d));

  const stepValid = (i: number) => {
    if (!draft) return false;
    if (i === 0) return draft.name.trim().length > 2 && draft.code.trim().length > 2;
    if (i === 1) return draft.city.trim().length > 1 && draft.address.trim().length > 4;
    return draft.staff > 0;
  };

  const save = () => {
    if (!draft) return;
    if (!stepValid(0) || !stepValid(1) || !stepValid(2)) {
      toast.error("Complétez toutes les étapes du formulaire");
      return;
    }
    const coords = CITY_COORDS[draft.city];
    upsert("restaurants", {
      ...draft,
      id: draft.id || uid("r"),
      lat: draft.lat || coords?.[0] || 33.5731,
      lng: draft.lng || coords?.[1] || -7.5898,
    });
    toast.success(draft.id ? "Restaurant mis à jour" : "Restaurant créé");
    setDraft(null);
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Restaurants"
        subtitle={`${rows.length} établissements dans le réseau`}
        action={
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-border p-0.5">
              {(["map", "list"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    view === v ? "bg-brand/20 text-foreground" : "text-muted-foreground",
                  )}
                >
                  {v === "map" ? <MapIcon className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                  {v === "map" ? "Carte" : "Liste"}
                </button>
              ))}
            </div>
            {creatable && (
              <Button
                onClick={() => {
                  setDraft({ ...EMPTY });
                  setWizardStep(0);
                }}
              >
                <Plus className="mr-1.5 h-4 w-4" /> Nouveau restaurant
              </Button>
            )}
          </div>
        }
      />

      {view === "map" ? (
        <MoroccoMap restaurants={rows} onSelect={setDetail} selectedCity={city} onCityChange={setCity} />
      ) : (
        <DataTable rows={rows} columns={columns} searchKeys={(r) => `${r.name} ${r.code} ${r.city}`} />
      )}

      {view === "map" && city && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows
            .filter((r) => r.city === city)
            .map((r) => (
              <button
                key={r.id}
                onClick={() => setDetail(r)}
                className="glass hover-lift rounded-2xl p-4 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-display text-sm font-bold uppercase">{r.name}</span>
                  <StatusPill status={r.status} />
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{r.address}</p>
                <div className="mt-3 flex items-center gap-2">
                  <ProgressBar value={r.compliance} className="flex-1" />
                  <span className="font-display text-sm font-bold text-gold">{r.compliance}%</span>
                </div>
              </button>
            ))}
        </div>
      )}

      {/* --------- wizard multi-étapes --------- */}
      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass animate-rise max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-xl font-bold uppercase">
                  {draft.id ? "Modifier le restaurant" : "Nouveau restaurant"}
                </h2>
                <p className="text-xs text-muted-foreground">Étape {wizardStep + 1} sur {STEPS.length}</p>
              </div>
              <button onClick={() => setDraft(null)} aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2">
              {STEPS.map((s, i) => (
                <div key={s} className="flex flex-1 items-center gap-2">
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                      i < wizardStep
                        ? "bg-success text-background"
                        : i === wizardStep
                          ? "bg-brand-gradient text-brand-foreground"
                          : "border border-border text-muted-foreground",
                    )}
                  >
                    {i < wizardStep ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className="hidden truncate text-xs sm:block">{s}</span>
                  {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              {wizardStep === 0 && (
                <>
                  <Field label="Nom du restaurant">
                    <Input value={draft.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Texas Chicken Casablanca Maarif" />
                  </Field>
                  <Field label="Code établissement">
                    <Input value={draft.code} onChange={(e) => patch({ code: e.target.value.toUpperCase() })} placeholder="TC-CAS-18" />
                  </Field>
                  <Field label="Statut">
                    <select
                      className="h-10 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm"
                      value={draft.status}
                      onChange={(e) => patch({ status: e.target.value as Restaurant["status"] })}
                    >
                      <option>Actif</option>
                      <option>Inactif</option>
                    </select>
                  </Field>
                </>
              )}

              {wizardStep === 1 && (
                <>
                  <Field label="Ville">
                    <select
                      className="h-10 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm"
                      value={draft.city}
                      onChange={(e) => {
                        const c = CITY_COORDS[e.target.value];
                        patch({ city: e.target.value, lat: c?.[0] ?? draft.lat, lng: c?.[1] ?? draft.lng });
                      }}
                    >
                      {Object.keys(CITY_COORDS).map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Adresse complète">
                    <Textarea value={draft.address} onChange={(e) => patch({ address: e.target.value })} placeholder="12 Boulevard Zerktouni, Casablanca" />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Latitude">
                      <Input type="number" step="0.0001" value={draft.lat} onChange={(e) => patch({ lat: Number(e.target.value) })} />
                    </Field>
                    <Field label="Longitude">
                      <Input type="number" step="0.0001" value={draft.lng} onChange={(e) => patch({ lng: Number(e.target.value) })} />
                    </Field>
                  </div>
                </>
              )}

              {wizardStep === 2 && (
                <>
                  <Field label="Responsable restaurant">
                    <select
                      className="h-10 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm"
                      value={draft.managerId}
                      onChange={(e) => patch({ managerId: e.target.value })}
                    >
                      <option value="">— Sélectionner —</option>
                      {users
                        .filter((u) => u.role === "Manager" || u.role === "Responsable restaurant")
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.firstName} {u.lastName}
                          </option>
                        ))}
                    </select>
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Effectif">
                      <Input type="number" value={draft.staff} onChange={(e) => patch({ staff: Number(e.target.value) })} />
                    </Field>
                    <Field label="Processus affectés">
                      <Input type="number" value={draft.processCount} onChange={(e) => patch({ processCount: Number(e.target.value) })} />
                    </Field>
                    <Field label="Objectif conformité (%)">
                      <Input type="number" value={draft.compliance} onChange={(e) => patch({ compliance: Number(e.target.value) })} />
                    </Field>
                  </div>
                  <Field label="Date d'ouverture">
                    <Input type="date" value={draft.openedAt} onChange={(e) => patch({ openedAt: e.target.value })} />
                  </Field>
                </>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between gap-2">
              <Button variant="outline" disabled={wizardStep === 0} onClick={() => setWizardStep((s) => s - 1)}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Précédent
              </Button>
              {wizardStep < STEPS.length - 1 ? (
                <Button
                  onClick={() => {
                    if (!stepValid(wizardStep)) {
                      toast.error("Complétez les champs obligatoires de cette étape");
                      return;
                    }
                    setWizardStep((s) => s + 1);
                  }}
                >
                  Suivant <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={save}>
                  <Check className="mr-1.5 h-4 w-4" /> Enregistrer
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {detail && <RestaurantOverview restaurant={detail} onClose={() => setDetail(null)} />}
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

/* ---------------- vue 360° restaurant ---------------- */
function RestaurantOverview({ restaurant, onClose }: { restaurant: Restaurant; onClose: () => void }) {
  const [tab, setTab] = useState<"dashboard" | "tasks">("dashboard");
  const users = useStore((s) => s.users);
  const alerts = useStore((s) => s.alerts.filter((a) => a.restaurantId === restaurant.id));
  const evidence = useStore((s) => s.evidence.filter((e) => e.restaurantId === restaurant.id));
  const controls = useStore((s) => s.controls.filter((c) => c.restaurantId === restaurant.id));
  const processes = useStore((s) => s.processes.filter((p) => p.restaurantIds.includes(restaurant.id)));
  const [openTask, setOpenTask] = useState<string | null>(null);

  const manager = users.find((u) => u.id === restaurant.managerId);
  const fraud = evidence.filter((e) => e.status === "Dupliquée" || e.status === "Rejetée" || e.status === "Suspecte");

  const tasks = useMemo(
    () =>
      processes
        .flatMap((p) =>
          p.steps.map((s) => ({
            id: `${p.id}-${s.id}`,
            process: p.name,
            processId: p.id,
            step: s,
          })),
        )
        .sort((a, b) => a.step.time.localeCompare(b.step.time)),
    [processes],
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass animate-rise h-full w-full max-w-3xl overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">Vue 360°</p>
            <h2 className="font-display text-2xl font-bold uppercase">{restaurant.name}</h2>
            <p className="text-sm text-muted-foreground">
              {restaurant.code} · {restaurant.address}
            </p>
          </div>
          <button onClick={onClose} aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex gap-1 rounded-xl border border-border p-1">
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
          <div className="mt-5 space-y-5">
            <div className="flex flex-wrap items-center gap-5">
              <ComplianceRing value={restaurant.compliance} />
              <div className="grid flex-1 grid-cols-2 gap-3">
                <KpiCard label="Contrôles" value={controls.length} />
                <KpiCard label="Preuves" value={evidence.length} icon={<Camera className="h-4 w-4" />} />
                <KpiCard label="Alertes ouvertes" value={alerts.filter((a) => !a.resolved).length} tone="warning" />
                <KpiCard label="Effectif" value={restaurant.staff} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow label="Responsable" value={manager ? `${manager.firstName} ${manager.lastName}` : "—"} />
              <InfoRow label="Ville" value={restaurant.city} />
              <InfoRow label="Ouverture" value={restaurant.openedAt} />
              <InfoRow label="Dernière activité" value={restaurant.lastActivity} />
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider">
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
                {fraud.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucune preuve suspecte détectée sur ce restaurant.</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-wider">Alertes récentes</h3>
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
          <div className="mt-5 space-y-2">
            <p className="text-xs text-muted-foreground">
              {tasks.length} tâches issues de {processes.length} processus affectés à ce restaurant.
            </p>
            {tasks.map((t) => {
              const open = openTask === t.id;
              const ev = evidence.find((e) => e.processId === t.processId);
              return (
                <div key={t.id} className="rounded-2xl border border-border bg-secondary/25">
                  <button
                    className="flex w-full items-center gap-3 p-3 text-left"
                    onClick={() => setOpenTask(open ? null : t.id)}
                  >
                    <span className="tabular grid h-10 w-14 shrink-0 place-items-center rounded-xl border border-border bg-secondary/50 font-display text-xs font-bold text-gold">
                      {t.step.time}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{t.step.name}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {t.process} · {t.step.zone} · {t.step.type}
                      </span>
                    </span>
                    {t.step.evidenceRequired && <Camera className="h-4 w-4 shrink-0 text-gold" />}
                  </button>
                  {open && (
                    <div className="space-y-3 border-t border-border p-3 text-sm">
                      <p className="text-muted-foreground">{t.step.instructions}</p>
                      {t.step.guide && (
                        <ol className="space-y-1">
                          {t.step.guide.map((g, i) => (
                            <li key={i} className="flex gap-2 text-xs">
                              <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand/20 text-[9px] font-bold text-brand">
                                {i + 1}
                              </span>
                              {g}
                            </li>
                          ))}
                        </ol>
                      )}
                      <div className="grid gap-2 sm:grid-cols-2">
                        <InfoRow label="Critère" value={t.step.criteria} />
                        <InfoRow label="Priorité" value={t.step.priority} />
                        <InfoRow label="Durée" value={`${t.step.duration} min`} />
                        <InfoRow label="Rôle" value={t.step.role} />
                      </div>
                      {t.step.evidenceRequired && (
                        <div className="rounded-xl border border-border bg-secondary/30 p-3">
                          <div className="mb-1 text-[10px] uppercase tracking-widest text-gold">Preuve associée</div>
                          {ev ? (
                            <div className="flex items-center gap-3">
                              <span className="h-9 w-9 rounded-lg" style={{ background: ev.gradient }} />
                              <div className="min-w-0 flex-1 text-xs">
                                <div className="font-semibold">{ev.ref}</div>
                                <div className="text-muted-foreground">
                                  score IA {ev.aiScore}% · {ev.date} {ev.time}
                                </div>
                              </div>
                              <StatusPill status={ev.status} />
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Aucune preuve enregistrée pour cette étape.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/25 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
