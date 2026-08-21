import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, Check, Eye, LayoutGrid, Map as MapIcon, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionTitle, StatusPill } from "@/components/tc/bits";
import { DataTable, type Column } from "@/components/tc/data-table";
import { LiveMap } from "@/components/tc/live-map";
import { cn } from "@/lib/utils";
import { can, currentUser, remove, restaurantStats, uid, upsert, useStore } from "@/lib/tc/store";
import { CITY_COORDS } from "@/lib/tc/data";
import type { Restaurant } from "@/lib/tc/types";
import { TCSelect } from "@/components/tc/select";

export const Route = createFileRoute("/admin/restaurants/")({
  head: () => ({
    meta: [
      { title: "Carte du réseau — Texas Chicken Administration" },
      {
        name: "description",
        content:
          "Carte satellite interactive du réseau Texas Chicken au Maroc : clustering, zoom cinématique par ville et accès direct à chaque restaurant.",
      },
      { property: "og:title", content: "Carte du réseau — Texas Chicken Administration" },
      { property: "og:description", content: "Explorez le réseau marocain depuis une vraie carte satellite interactive." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RestaurantsIndex,
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

function RestaurantsIndex() {
  const rows = useStore((s) => s.restaurants);
  const users = useStore((s) => s.users);
  const state = useStore((s) => s);
  const user = useStore(() => currentUser());
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Restaurant | null>(null);
  const [wizardStep, setWizardStep] = useState(0);
  const [view, setView] = useState<"map" | "list">("map");

  const editable = can(user, "Restaurants", "Modifier");
  const creatable = can(user, "Restaurants", "Créer");
  const deletable = can(user, "Restaurants", "Supprimer");

  const open = (r: Restaurant) => navigate({ to: "/admin/restaurants/$id", params: { id: r.id } });

  const columns: Column<Restaurant>[] = [
    {
      key: "name",
      header: "Restaurant",
      sortable: true,
      value: (r) => r.name,
      render: (r) => (
        <button className="flex items-center gap-2 text-left" onClick={() => open(r)}>
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
          <Button size="sm" variant="outline" onClick={() => open(r)}>
            <Eye className="mr-1.5 h-4 w-4" /> Voir détails
          </Button>
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
        subtitle={`${rows.length} établissements — explorez le réseau depuis la carte satellite`}
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
        <LiveMap restaurants={rows} stats={(r) => restaurantStats(r.id, state)} onSelect={open} />
      ) : (
        <DataTable rows={rows} columns={columns} searchFields={(r) => `${r.name} ${r.code} ${r.city}`} />
      )}

      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass animate-rise max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-xl font-bold uppercase">
                  {draft.id ? "Modifier le restaurant" : "Nouveau restaurant"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Étape {wizardStep + 1} sur {STEPS.length}
                </p>
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
                    <TCSelect
                      value={draft.status}
                      onChange={(v) => patch({ status: v as Restaurant["status"] })}
                      options={[
                        { value: "Actif", label: "Actif", description: "Restaurant en exploitation" },
                        { value: "Inactif", label: "Inactif", description: "Fermé ou en travaux" },
                      ]}
                    />
                  </Field>
                </>
              )}

              {wizardStep === 1 && (
                <>
                  <Field label="Ville">
                    <TCSelect
                      value={draft.city}
                      searchable
                      onChange={(v) => {
                        const c = CITY_COORDS[v];
                        patch({ city: v, lat: c?.[0] ?? draft.lat, lng: c?.[1] ?? draft.lng });
                      }}
                      options={Object.keys(CITY_COORDS).map((c) => ({ value: c, label: c, description: "Coordonnées GPS pré-remplies" }))}
                    />
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
                    <TCSelect
                      value={draft.managerId}
                      onChange={(v) => patch({ managerId: v })}
                      placeholder="— Sélectionner —"
                      searchable
                      options={users
                        .filter((u) => u.role === "Manager" || u.role === "Responsable restaurant")
                        .map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName}`, description: u.email, hint: u.role }))}
                    />
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
              <Button variant="ghost" onClick={() => (wizardStep === 0 ? setDraft(null) : setWizardStep((s) => s - 1))}>
                {wizardStep === 0 ? "Annuler" : "Précédent"}
              </Button>
              {wizardStep < STEPS.length - 1 ? (
                <Button
                  onClick={() => (stepValid(wizardStep) ? setWizardStep((s) => s + 1) : toast.error("Complétez cette étape"))}
                >
                  Continuer
                </Button>
              ) : (
                <Button onClick={save}>{draft.id ? "Enregistrer" : "Créer le restaurant"}</Button>
              )}
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
