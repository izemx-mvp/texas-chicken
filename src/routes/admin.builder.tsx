import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDown, ArrowUp, CalendarDays, Camera, GitBranch, Plus, Save, Trash2, Workflow } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionTitle } from "@/components/tc/bits";
import { uid, upsert, useStore } from "@/lib/tc/store";
import { ZONES, type AvailabilityType, type Priority, type Process, type ProcessStep, type StepType, type Zone } from "@/lib/tc/types";

export const Route = createFileRoute("/admin/builder")({
  head: () => ({
    meta: [
      { title: "Process Builder — Texas Chicken Administration" },
      { name: "description", content: "Construisez des workflows opérationnels : étapes, zones, preuves obligatoires et logique conditionnelle." },
      { property: "og:title", content: "Process Builder — Texas Chicken Administration" },
      { property: "og:description", content: "Éditeur visuel de processus avec conditions et affectation multi-restaurants." },
    ],
  }),
  component: Builder,
});

const TYPES: StepType[] = ["Checklist", "Photo", "Vidéo", "Oui / Non", "Score", "Valeur numérique", "Sélection", "Commentaire", "Anomalie"];
const PRIOS: Priority[] = ["Basse", "Normale", "Haute", "Critique"];

const newStep = (): ProcessStep => ({
  id: uid("st"),
  name: "Nouvelle étape",
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
});

function Builder() {
  const navigate = useNavigate();
  const restaurants = useStore((s) => s.restaurants);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Ouverture");
  const [targets, setTargets] = useState<string[]>([]);
  const [steps, setSteps] = useState<ProcessStep[]>([newStep()]);
  const [sel, setSel] = useState(0);
  const [availType, setAvailType] = useState<AvailabilityType>("Permanent");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [dates, setDates] = useState<string[]>([]);
  const [dateDraft, setDateDraft] = useState("");

  const step = steps[sel];
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

  const save = () => {
    if (!name.trim()) {
      toast.error("Le nom du processus est obligatoire");
      return;
    }
    if (targets.length === 0) {
      toast.error("Sélectionnez au moins un restaurant");
      return;
    }
    if (availType === "Période" && (!startDate || !endDate)) {
      toast.error("Renseignez la date de début et de fin de la période");
      return;
    }
    if (availType === "Dates spécifiques" && dates.length === 0) {
      toast.error("Ajoutez au moins une date spécifique");
      return;
    }
    const p: Process = {
      id: uid("p"),
      name: name.trim(),
      description,
      category,
      restaurantIds: targets,
      zones: [...new Set(steps.map((s) => s.zone))],
      role: "Manager",
      priority: "Normale",
      frequency: "Par shift",
      status: "Brouillon",
      version: "1.0",
      updatedAt: new Date().toISOString().slice(0, 10),
      author: "Process Builder",
      steps,
      versions: [{ version: "1.0", author: "Process Builder", date: new Date().toISOString().slice(0, 10), changes: "Création du processus" }],
      availability:
        availType === "Permanent"
          ? { type: "Permanent" }
          : availType === "Période"
            ? { type: "Période", startDate, endDate }
            : { type: "Dates spécifiques", dates: [...dates].sort() },
    };
    upsert("processes", p);
    toast.success("Processus créé en brouillon");
    navigate({ to: "/admin/processes" });
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Process Builder"
        subtitle="Éditeur visuel de workflows opérationnels"
        action={
          <Button onClick={save}>
            <Save className="mr-1.5 h-4 w-4" /> Enregistrer
          </Button>
        }
      />

      <div className="glass grid gap-3 rounded-2xl p-5 lg:grid-cols-3">
        <label className="block lg:col-span-1">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Nom du processus</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Ouverture restaurant" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Catégorie</span>
          <select className="h-10 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
            {["Ouverture", "Fermeture", "Qualité", "Hygiène", "Sécurité", "Maintenance", "Service"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Description</span>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Objectif du processus" />
        </label>
        <div className="rounded-2xl border border-border bg-secondary/25 p-4 lg:col-span-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gold" />
            <h3 className="font-display text-sm font-bold uppercase tracking-wider">Disponibilité du processus</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Définit les jours où ce processus apparaît dans le calendrier et le shift des managers.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["Permanent", "Période", "Dates spécifiques"] as AvailabilityType[]).map((t) => (
              <button
                key={t}
                onClick={() => setAvailType(t)}
                className={
                  "rounded-full border px-3 py-1 text-xs font-semibold transition-colors " +
                  (availType === t ? "border-gold/60 bg-gold/15 text-gold" : "border-border text-muted-foreground")
                }
              >
                {t}
              </button>
            ))}
          </div>

          {availType === "Période" && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <L label="Date de début"><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></L>
              <L label="Date de fin"><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></L>
            </div>
          )}

          {availType === "Dates spécifiques" && (
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap items-end gap-2">
                <L label="Ajouter une date">
                  <Input type="date" value={dateDraft} onChange={(e) => setDateDraft(e.target.value)} />
                </L>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!dateDraft) return;
                    if (dates.includes(dateDraft)) {
                      toast.error("Cette date est déjà sélectionnée");
                      return;
                    }
                    setDates([...dates, dateDraft]);
                    setDateDraft("");
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" /> Ajouter
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {dates.sort().map((d) => (
                  <button
                    key={d}
                    onClick={() => setDates(dates.filter((x) => x !== d))}
                    className="rounded-full border border-brand/50 bg-brand/15 px-3 py-1 text-xs"
                  >
                    {d} ✕
                  </button>
                ))}
                {dates.length === 0 && <span className="text-xs text-muted-foreground">Aucune date sélectionnée</span>}
              </div>
            </div>
          )}

          {availType === "Permanent" && (
            <p className="mt-3 text-xs text-success">Actif tous les jours, sans limite de date.</p>
          )}
        </div>

        <div className="lg:col-span-3">
          <span className="mb-2 block text-[10px] uppercase tracking-widest text-muted-foreground">
            Affectation restaurants ({targets.length}/{restaurants.length})
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTargets(targets.length === restaurants.length ? [] : restaurants.map((r) => r.id))}
              className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold"
            >
              {targets.length === restaurants.length ? "Tout désélectionner" : "Tout le réseau"}
            </button>
            {restaurants.map((r) => {
              const on = targets.includes(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => setTargets((t) => (on ? t.filter((x) => x !== r.id) : [...t, r.id]))}
                  className={
                    "rounded-full border px-3 py-1 text-xs transition-colors " +
                    (on ? "border-brand/60 bg-brand/20 text-foreground" : "border-border text-muted-foreground")
                  }
                >
                  {r.code}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider">Étapes ({steps.length})</h3>
            <Button size="sm" variant="outline" onClick={() => { setSteps([...steps, newStep()]); setSel(steps.length); }}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {steps.map((s, i) => (
              <div
                key={s.id}
                className={
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors " +
                  (i === sel ? "border-gold/50 bg-gold/10" : "border-border bg-secondary/25")
                }
              >
                <button className="min-w-0 flex-1 text-left" onClick={() => setSel(i)}>
                  <div className="truncate font-medium">{i + 1}. {s.name}</div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    {s.zone} · {s.type} {s.evidenceRequired ? "· preuve" : ""}
                  </div>
                </button>
                <div className="flex flex-col">
                  <button onClick={() => move(i, -1)} aria-label="Monter"><ArrowUp className="h-3 w-3" /></button>
                  <button onClick={() => move(i, 1)} aria-label="Descendre"><ArrowDown className="h-3 w-3" /></button>
                </div>
                <button
                  aria-label="Supprimer"
                  onClick={() => {
                    if (steps.length === 1) {
                      toast.error("Au moins une étape est requise");
                      return;
                    }
                    setSteps(steps.filter((_, j) => j !== i));
                    setSel(0);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {step && (
          <div className="glass space-y-3 rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <Workflow className="h-4 w-4 text-gold" />
              <h3 className="font-display text-sm font-bold uppercase tracking-wider">Configuration de l'étape</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <L label="Nom"><Input value={step.name} onChange={(e) => patch({ name: e.target.value })} /></L>
              <L label="Rôle"><Input value={step.role} onChange={(e) => patch({ role: e.target.value })} /></L>
              <L label="Zone">
                <select className="h-10 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm" value={step.zone} onChange={(e) => patch({ zone: e.target.value as Zone })}>
                  {ZONES.map((z) => <option key={z}>{z}</option>)}
                </select>
              </L>
              <L label="Type de saisie">
                <select className="h-10 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm" value={step.type} onChange={(e) => patch({ type: e.target.value as StepType })}>
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </L>
              <L label="Heure"><Input type="time" value={step.time} onChange={(e) => patch({ time: e.target.value })} /></L>
              <L label="Durée (min)"><Input type="number" value={step.duration} onChange={(e) => patch({ duration: Number(e.target.value) })} /></L>
              <L label="Priorité">
                <select className="h-10 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm" value={step.priority} onChange={(e) => patch({ priority: e.target.value as Priority })}>
                  {PRIOS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </L>
              <L label="Critère de conformité"><Input value={step.criteria} onChange={(e) => patch({ criteria: e.target.value })} /></L>
              <div className="sm:col-span-2">
                <L label="Instructions terrain">
                  <Textarea value={step.instructions} onChange={(e) => patch({ instructions: e.target.value })} />
                </L>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Toggle on={step.evidenceRequired} onClick={() => patch({ evidenceRequired: !step.evidenceRequired })} icon={<Camera className="h-3.5 w-3.5" />} label="Preuve photo obligatoire" />
              <Toggle on={step.critical} onClick={() => patch({ critical: !step.critical })} icon={<GitBranch className="h-3.5 w-3.5" />} label="Étape critique" />
            </div>

            <div className="rounded-xl border border-border bg-secondary/20 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-gold">Logique conditionnelle</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    patch({
                      conditions: [
                        ...step.conditions,
                        { id: uid("c"), when: "Résultat", operator: "=", value: "Non", then: "Créer une alerte critique" },
                      ],
                    })
                  }
                >
                  <Plus className="mr-1 h-3 w-3" /> Condition
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                {step.conditions.length === 0 && <p className="text-xs text-muted-foreground">Aucune condition définie.</p>}
                {step.conditions.map((c) => (
                  <div key={c.id} className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-muted-foreground">SI</span>
                    <Input className="h-8 w-32" value={c.when} onChange={(e) => patch({ conditions: step.conditions.map((x) => (x.id === c.id ? { ...x, when: e.target.value } : x)) })} />
                    <select
                      className="h-8 rounded-md border border-border bg-secondary/40 px-2"
                      value={c.operator}
                      onChange={(e) => patch({ conditions: step.conditions.map((x) => (x.id === c.id ? { ...x, operator: e.target.value as "=" } : x)) })}
                    >
                      {[">", "<", "=", "!="].map((o) => <option key={o}>{o}</option>)}
                    </select>
                    <Input className="h-8 w-24" value={c.value} onChange={(e) => patch({ conditions: step.conditions.map((x) => (x.id === c.id ? { ...x, value: e.target.value } : x)) })} />
                    <span className="text-muted-foreground">ALORS</span>
                    <Input className="h-8 w-56" value={c.then} onChange={(e) => patch({ conditions: step.conditions.map((x) => (x.id === c.id ? { ...x, then: e.target.value } : x)) })} />
                    <button onClick={() => patch({ conditions: step.conditions.filter((x) => x.id !== c.id) })} aria-label="Supprimer la condition">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ on, onClick, label, icon }: { on: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors " +
        (on ? "border-gold/50 bg-gold/15 text-gold" : "border-border text-muted-foreground")
      }
    >
      {icon} {label}
    </button>
  );
}
