import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ArrowDown, ArrowUp, Check, Plus, Save, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionTitle } from "@/components/tc/bits";
import { cn } from "@/lib/utils";
import { getState, uid, upsert, useStore } from "@/lib/tc/store";
import {
  ZONES,
  type AvailabilityType,
  type Priority,
  type Process,
  type ProcessStep,
  type StepType,
  type Zone,
} from "@/lib/tc/types";

export const Route = createFileRoute("/admin/builder")({
  validateSearch: z.object({ process: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Process Builder — Texas Chicken Administration" },
      {
        name: "description",
        content: "Construisez ou modifiez un processus opérationnel en 8 étapes : période, restaurants, zones, tâches, étapes détaillées et vidéos.",
      },
      { property: "og:title", content: "Process Builder — Texas Chicken Administration" },
      { property: "og:description", content: "Éditeur visuel de workflows avec disponibilité, zones et preuves obligatoires." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Builder,
});

const TYPES: StepType[] = ["Checklist", "Photo", "Vidéo", "Oui / Non", "Score", "Valeur numérique", "Sélection", "Commentaire", "Anomalie"];
const PRIOS: Priority[] = ["Basse", "Normale", "Haute", "Critique"];
const CATEGORIES = ["Ouverture", "Fermeture", "Qualité", "Hygiène", "Sécurité", "Service", "Stock", "Maintenance"];
const WIZARD = [
  "Informations",
  "Période",
  "Restaurants",
  "Zones",
  "Tâches",
  "Étapes détaillées",
  "Instructions & vidéo",
  "Résumé",
];

const newStep = (): ProcessStep => ({
  id: uid("st"),
  name: "Nouvelle tâche",
  description: "",
  instructions: "",
  zone: "Cuisine",
  role: "Manager",
  time: "08:00",
  duration: 10,
  frequency: "Par shift",
  priority: "Normale",
  type: "Checklist",
  evidenceRequired: false,
  critical: false,
  criteria: "",
  conditions: [],
  guide: [],
});

function Builder() {
  const navigate = useNavigate();
  const { process: editId } = Route.useSearch();
  const restaurants = useStore((s) => s.restaurants);
  const existing = useStore((s) => s.processes.find((p) => p.id === editId) ?? null);

  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Ouverture");
  const [targets, setTargets] = useState<string[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [steps, setSteps] = useState<ProcessStep[]>([newStep()]);
  const [sel, setSel] = useState(0);
  const [availType, setAvailType] = useState<AvailabilityType>("Permanent");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [dates, setDates] = useState<string[]>([]);
  const [dateDraft, setDateDraft] = useState("");

  // Charge le processus à modifier (une seule fois par id).
  if (existing && loadedId !== existing.id) {
    setLoadedId(existing.id);
    setName(existing.name);
    setDescription(existing.description);
    setCategory(existing.category);
    setTargets(existing.restaurantIds);
    setZones(existing.zones);
    setSteps(existing.steps.length ? existing.steps : [newStep()]);
    setSel(0);
    const a = existing.availability ?? { type: "Permanent" as const };
    setAvailType(a.type);
    if (a.startDate) setStartDate(a.startDate);
    setEndDate(a.endDate ?? "");
    setDates(a.dates ?? []);
  }

  const current = steps[sel];
  const patch = (p: Partial<ProcessStep>) => setSteps((s) => s.map((x, i) => (i === sel ? { ...x, ...p } : x)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    const copy = [...steps];
    const a = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = a;
    setSteps(copy);
    setSel(j);
  };

  const valid = (i: number): string | null => {
    if (i === 0 && name.trim().length < 3) return "Le nom du processus est obligatoire";
    if (i === 1) {
      if (availType === "Période" && (!startDate || !endDate)) return "Renseignez la date de début et de fin";
      if (availType === "Dates spécifiques" && dates.length === 0) return "Ajoutez au moins une date";
    }
    if (i === 2 && targets.length === 0) return "Sélectionnez au moins un restaurant";
    if (i === 3 && zones.length === 0) return "Sélectionnez au moins une zone";
    if (i === 4 && steps.length === 0) return "Ajoutez au moins une tâche";
    return null;
  };

  const next = () => {
    const err = valid(step);
    if (err) {
      toast.error(err);
      return;
    }
    setStep((s) => Math.min(WIZARD.length - 1, s + 1));
  };

  const save = () => {
    for (let i = 0; i < 5; i++) {
      const err = valid(i);
      if (err) {
        toast.error(err);
        setStep(i);
        return;
      }
    }
    const prev = getState().processes.find((p) => p.id === loadedId);
    const version = prev ? `${(Number(prev.version) + 0.1).toFixed(1)}` : "1.0";
    const today = new Date().toISOString().slice(0, 10);
    const p: Process = {
      id: prev?.id ?? uid("p"),
      name: name.trim(),
      description,
      category,
      restaurantIds: targets,
      zones: zones.length ? zones : [...new Set(steps.map((s) => s.zone))],
      role: prev?.role ?? "Manager",
      priority: prev?.priority ?? "Normale",
      frequency: prev?.frequency ?? "Par shift",
      status: prev?.status ?? "Brouillon",
      version,
      updatedAt: today,
      author: "Process Builder",
      steps,
      versions: [
        ...(prev?.versions ?? []),
        { version, author: "Process Builder", date: today, changes: prev ? "Modification via Process Builder" : "Création du processus" },
      ],
      availability:
        availType === "Permanent"
          ? { type: "Permanent" }
          : availType === "Période"
            ? { type: "Période", startDate, endDate }
            : { type: "Dates spécifiques", dates: [...dates].sort() },
    };
    upsert("processes", p);
    toast.success(prev ? `Processus mis à jour (v${version})` : "Processus créé en brouillon");
    navigate({ to: "/admin/processes" });
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        title={loadedId ? "Modifier le processus" : "Process Builder"}
        subtitle={`Étape ${step + 1}/${WIZARD.length} — ${WIZARD[step]}`}
        action={
          <Button onClick={save}>
            <Save className="mr-1.5 h-4 w-4" /> Enregistrer
          </Button>
        }
      />

      <div className="glass flex flex-wrap items-center gap-2 rounded-2xl p-3">
        {WIZARD.map((w, i) => (
          <button
            key={w}
            onClick={() => setStep(i)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
              i === step ? "bg-brand/20 text-foreground" : i < step ? "text-success" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "grid h-5 w-5 place-items-center rounded-full text-[10px]",
                i === step ? "bg-brand-gradient text-brand-foreground" : i < step ? "bg-success/20 text-success" : "border border-border",
              )}
            >
              {i < step ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span className="hidden sm:block">{w}</span>
          </button>
        ))}
      </div>

      <div className="glass space-y-4 rounded-3xl p-5">
        {step === 0 && (
          <div className="grid gap-3 lg:grid-cols-2">
            <Field label="Nom du processus">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Ouverture restaurant" />
            </Field>
            <Field label="Catégorie">
              <select className="h-10 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <div className="lg:col-span-2">
              <Field label="Description">
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Objectif du processus, périmètre, standards liés..." />
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(["Permanent", "Période", "Dates spécifiques"] as AvailabilityType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setAvailType(t)}
                  className={cn(
                    "rounded-xl border px-4 py-2 text-xs font-semibold transition-colors",
                    availType === t ? "border-gold bg-brand/15" : "border-border text-muted-foreground",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            {availType === "Période" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Début">
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </Field>
                <Field label="Fin">
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </Field>
              </div>
            )}
            {availType === "Dates spécifiques" && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input type="date" value={dateDraft} onChange={(e) => setDateDraft(e.target.value)} />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (dateDraft && !dates.includes(dateDraft)) setDates([...dates, dateDraft]);
                      setDateDraft("");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dates.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDates(dates.filter((x) => x !== d))}
                      className="rounded-lg border border-border bg-secondary/40 px-2.5 py-1 text-xs"
                    >
                      {d} ✕
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setTargets(restaurants.map((r) => r.id))}>
                Tout sélectionner
              </Button>
              <Button variant="ghost" onClick={() => setTargets([])}>
                Tout retirer
              </Button>
            </div>
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((r) => {
                const on = targets.includes(r.id);
                return (
                  <button
                    key={r.id}
                    onClick={() => setTargets(on ? targets.filter((x) => x !== r.id) : [...targets, r.id])}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-colors",
                      on ? "border-gold/50 bg-brand/10" : "border-border text-muted-foreground",
                    )}
                  >
                    <span className={cn("grid h-4 w-4 place-items-center rounded border", on ? "border-success/60 bg-success/25 text-success" : "border-border")}>
                      {on && <Check className="h-3 w-3" />}
                    </span>
                    <span className="truncate">{r.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-wrap gap-2">
            {ZONES.map((z) => {
              const on = zones.includes(z);
              return (
                <button
                  key={z}
                  onClick={() => setZones(on ? zones.filter((x) => x !== z) : [...zones, z])}
                  className={cn(
                    "rounded-xl border px-4 py-2 text-xs font-semibold transition-colors",
                    on ? "border-gold bg-brand/15" : "border-border text-muted-foreground",
                  )}
                >
                  {z}
                </button>
              );
            })}
          </div>
        )}

        {(step === 4 || step === 5 || step === 6) && (
          <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Tâches ({steps.length})</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSteps([...steps, newStep()]);
                    setSel(steps.length);
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {steps.map((s, i) => (
                  <div
                    key={s.id}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-2 py-2 text-xs",
                      i === sel ? "border-gold/60 bg-brand/10" : "border-border",
                    )}
                  >
                    <button className="min-w-0 flex-1 text-left" onClick={() => setSel(i)}>
                      <span className="block truncate font-semibold">
                        {i + 1}. {s.name}
                      </span>
                      <span className="block truncate text-[10px] text-muted-foreground">
                        {s.time} · {s.zone} · {s.guide?.length ?? 0} étapes
                      </span>
                    </button>
                    <button onClick={() => move(i, -1)} aria-label="Monter">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => move(i, 1)} aria-label="Descendre">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setSteps(steps.filter((_, j) => j !== i));
                        setSel(0);
                      }}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {current && (
              <div className="space-y-3 rounded-2xl border border-border p-4">
                {step === 4 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Nom de la tâche">
                      <Input value={current.name} onChange={(e) => patch({ name: e.target.value })} />
                    </Field>
                    <Field label="Zone">
                      <select className="h-10 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm" value={current.zone} onChange={(e) => patch({ zone: e.target.value as Zone })}>
                        {ZONES.map((z) => (
                          <option key={z}>{z}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Heure planifiée">
                      <Input type="time" value={current.time} onChange={(e) => patch({ time: e.target.value })} />
                    </Field>
                    <Field label="Durée (min)">
                      <Input type="number" value={current.duration} onChange={(e) => patch({ duration: Number(e.target.value) })} />
                    </Field>
                    <Field label="Type de saisie">
                      <select className="h-10 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm" value={current.type} onChange={(e) => patch({ type: e.target.value as StepType })}>
                        {TYPES.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Priorité">
                      <select className="h-10 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm" value={current.priority} onChange={(e) => patch({ priority: e.target.value as Priority })}>
                        {PRIOS.map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Critère de conformité">
                      <Input value={current.criteria} onChange={(e) => patch({ criteria: e.target.value })} placeholder="Ex : température ≤ 4°C" />
                    </Field>
                    <div className="flex items-end gap-4">
                      <Toggle label="Preuve obligatoire" on={current.evidenceRequired} onClick={() => patch({ evidenceRequired: !current.evidenceRequired })} />
                      <Toggle label="Tâche critique" on={current.critical} onClick={() => patch({ critical: !current.critical })} />
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Décomposez « {current.name} » en étapes détaillées suivies une par une par le manager.
                    </p>
                    {(current.guide ?? []).map((g, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/20 text-[10px] font-bold text-brand">{i + 1}</span>
                        <Input
                          value={g}
                          onChange={(e) => patch({ guide: (current.guide ?? []).map((x, j) => (j === i ? e.target.value : x)) })}
                        />
                        <button onClick={() => patch({ guide: (current.guide ?? []).filter((_, j) => j !== i) })} aria-label="Supprimer l'étape">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    ))}
                    <Button variant="secondary" onClick={() => patch({ guide: [...(current.guide ?? []), "Nouvelle étape détaillée"] })}>
                      <Plus className="mr-1.5 h-4 w-4" /> Ajouter une étape
                    </Button>
                  </div>
                )}

                {step === 6 && (
                  <div className="space-y-3">
                    <Field label="Instructions opérationnelles">
                      <Textarea value={current.instructions} onChange={(e) => patch({ instructions: e.target.value })} />
                    </Field>
                    <Field label="Description courte">
                      <Input value={current.description} onChange={(e) => patch({ description: e.target.value })} />
                    </Field>
                    <Field label="Vidéo tutoriel (URL)">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-gold" />
                        <Input value={current.videoUrl ?? ""} onChange={(e) => patch({ videoUrl: e.target.value })} placeholder="https://..." />
                      </div>
                    </Field>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 7 && (
          <div className="space-y-3 text-sm">
            <Summary label="Processus" value={`${name || "—"} · ${category}`} />
            <Summary
              label="Disponibilité"
              value={
                availType === "Permanent"
                  ? "Permanent"
                  : availType === "Période"
                    ? `Du ${startDate} au ${endDate}`
                    : `${dates.length} dates spécifiques`
              }
            />
            <Summary label="Restaurants" value={`${targets.length} établissements`} />
            <Summary label="Zones" value={zones.join(", ") || "—"} />
            <Summary
              label="Tâches"
              value={`${steps.length} tâches · ${steps.reduce((a, s) => a + (s.guide?.length ?? 0), 0)} étapes détaillées · ${steps.filter((s) => s.evidenceRequired).length} avec preuve`}
            />
            <div className="space-y-1">
              {steps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 rounded-xl border border-border bg-secondary/25 px-3 py-2 text-xs">
                  <span className="font-display font-bold text-gold">{s.time}</span>
                  <span className="truncate">
                    {i + 1}. {s.name}
                  </span>
                  <span className="ml-auto shrink-0 text-muted-foreground">{s.zone}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            Précédent
          </Button>
          {step < WIZARD.length - 1 ? <Button onClick={next}>Continuer</Button> : <Button onClick={save}>Enregistrer le processus</Button>}
        </div>
      </div>
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

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 text-xs">
      <span className={cn("grid h-5 w-5 place-items-center rounded border", on ? "border-success/60 bg-success/25 text-success" : "border-border")}>
        {on && <Check className="h-3.5 w-3.5" />}
      </span>
      {label}
    </button>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/25 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
