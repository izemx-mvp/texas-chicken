import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Layers,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionTitle } from "@/components/tc/bits";
import { TCSelect } from "@/components/tc/select";
import { DocumentUpload, ImageUpload, MediaUploader, VideoUpload } from "@/components/tc/upload";
import { MemberPicker } from "@/components/tc/member-picker";
import { QuizEditor } from "@/components/tc/quiz";
import { cn } from "@/lib/utils";
import { uid, upsertTraining, useStore } from "@/lib/tc/store";
import { trainingMaxScore } from "@/lib/tc/ops";
import type { Training, TrainingLevel, TrainingModule, TrainingStep } from "@/lib/tc/ops";

export const Route = createFileRoute("/admin/trainings/builder/$id")({
  head: () => ({
    meta: [
      { title: "Créateur de formation — Texas Chicken Administration" },
      {
        name: "description",
        content:
          "Construisez une formation Texas Chicken : informations, affectation, modules, étapes et quiz QCM notés, sur une page dédiée.",
      },
      { property: "og:title", content: "Créateur de formation — Texas Chicken Administration" },
      { property: "og:description", content: "Formation → Modules → Étapes → Contenus et quiz notés." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrainingBuilderPage,
});

const WIZARD = ["Informations", "Affectation", "Modules & étapes", "Récapitulatif"];
const LEVELS: TrainingLevel[] = ["Débutant", "Intermédiaire", "Avancé"];

const emptyTraining = (today: string): Training => ({
  id: "",
  title: "",
  description: "",
  category: "Opérations",
  roles: ["Crew Member"],
  level: "Débutant",
  duration: 30,
  mandatory: false,
  cover: "linear-gradient(135deg,#d8452f,#f0a32f)",
  mainVideo: "",
  documents: [],
  rules: [],
  modules: [{ id: uid("m"), title: "Module 1 — Fondamentaux", description: "", steps: [] }],
  restaurantIds: [],
  userIds: [],
  createdAt: today,
  status: "Brouillon",
});

function TrainingBuilderPage() {
  const { id } = useParams({ from: "/admin/trainings/builder/$id" });
  const navigate = useNavigate();
  const state = useStore((s) => s);
  const existing = state.trainings.find((t) => t.id === id);

  const [draft, setDraft] = useState<Training>(() =>
    existing ? (JSON.parse(JSON.stringify(existing)) as Training) : emptyTraining(state.activeDate),
  );
  const [step, setStep] = useState(0);

  const patch = (p: Partial<Training>) => setDraft((d) => ({ ...d, ...p }));
  const roles = useMemo(() => Array.from(new Set(state.users.map((u) => u.role))).sort(), [state.users]);

  const stepCount = draft.modules.reduce((a, m) => a + m.steps.length, 0);
  const questionCount = draft.modules.reduce((a, m) => a + m.steps.reduce((b, s) => b + (s.quiz?.length ?? 0), 0), 0);
  const back = () => navigate({ to: "/admin/trainings" });

  const save = (status: Training["status"]) => {
    if (!draft.title.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }
    upsertTraining({ ...draft, id: draft.id || uid("tr"), status });
    toast.success(status === "Publiée" ? "Formation publiée" : "Brouillon enregistré");
    back();
  };

  return (
    <div className="space-y-5 pb-24">
      <button onClick={back} className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold">
        <ArrowLeft className="h-4 w-4" /> Retour aux formations
      </button>

      <SectionTitle
        title={draft.id ? "Modifier la formation" : "Nouvelle formation"}
        subtitle={`${draft.modules.length} modules · ${stepCount} étapes · ${questionCount} questions · ${trainingMaxScore(draft)} points`}
      />

      <div className="glass grid grid-cols-2 gap-1 rounded-2xl p-1 sm:grid-cols-4">
        {WIZARD.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={cn(
              "rounded-xl px-3 py-2 text-[10px] uppercase tracking-widest transition-colors",
              i === step ? "bg-brand/20 text-foreground" : i < step ? "bg-success/15 text-success" : "text-muted-foreground",
            )}
          >
            {String(i + 1).padStart(2, "0")} · {s}
          </button>
        ))}
      </div>

      <div className="glass rounded-3xl p-4 sm:p-5">
        {step === 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Titre</span>
              <Input
                value={draft.title}
                onChange={(e) => patch({ title: e.target.value })}
                placeholder="Hygiène & HACCP niveau 1"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Description</span>
              <Input value={draft.description} onChange={(e) => patch({ description: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Catégorie</span>
              <Input value={draft.category} onChange={(e) => patch({ category: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Niveau</span>
              <TCSelect
                value={draft.level}
                onChange={(v) => patch({ level: v as TrainingLevel })}
                options={LEVELS.map((l) => ({ value: l, label: l }))}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Durée (min)</span>
              <Input
                type="number"
                value={draft.duration}
                onChange={(e) => patch({ duration: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Obligatoire</span>
              <TCSelect
                value={draft.mandatory ? "1" : "0"}
                onChange={(v) => patch({ mandatory: v === "1" })}
                options={[
                  { value: "1", label: "Oui — formation obligatoire" },
                  { value: "0", label: "Non — formation optionnelle" },
                ]}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                Objectifs pédagogiques (un par ligne)
              </span>
              <textarea
                value={(draft.objectives ?? []).join("\n")}
                onChange={(e) => patch({ objectives: e.target.value.split("\n").filter(Boolean) })}
                rows={3}
                className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none"
              />
            </label>
            <div className="border-t border-border pt-4 sm:col-span-2">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                Image d'ouverture
              </div>
              <ImageUpload value={draft.coverPhoto} onChange={(url) => patch({ coverPhoto: url })} />
            </div>

          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Rôles ciblés</div>
              <div className="flex flex-wrap gap-1.5">
                {roles.map((r) => {
                  const on = draft.roles.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => patch({ roles: on ? draft.roles.filter((x) => x !== r) : [...draft.roles, r] })}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs transition-colors",
                        on
                          ? "border-gold/60 bg-gold/15 text-gold"
                          : "border-border text-muted-foreground hover:border-gold/40",
                      )}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                Restaurants (aucun = tout le réseau)
              </div>
              <div className="grid max-h-56 gap-1 overflow-y-auto rounded-2xl border border-border p-2 sm:grid-cols-2">
                {state.restaurants.map((r) => {
                  const on = (draft.restaurantIds ?? []).includes(r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() =>
                        patch({
                          restaurantIds: on
                            ? (draft.restaurantIds ?? []).filter((x) => x !== r.id)
                            : [...(draft.restaurantIds ?? []), r.id],
                        })
                      }
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs transition-colors",
                        on ? "bg-brand/15" : "text-muted-foreground hover:bg-secondary/60",
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
                      <span className="min-w-0 truncate">{r.name}</span>
                      <span className="ml-auto shrink-0 text-[10px]">{r.city}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                Collaborateurs nommément assignés
              </div>
              <MemberPicker value={draft.userIds ?? []} onChange={(ids) => patch({ userIds: ids })} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="rounded-2xl border border-border bg-secondary/30 p-3 text-[11px] text-muted-foreground">
              Un module ne contient qu'une description. Tous les contenus pédagogiques (vidéos, documents, images,
              textes) et les quiz notés se configurent au niveau des étapes.
            </p>
            {draft.modules.map((m, mi) => (
              <ModuleEditor
                key={m.id}
                module={m}
                index={mi}
                count={draft.modules.length}
                onChange={(next) => {
                  const modules = [...draft.modules];
                  modules[mi] = next;
                  patch({ modules });
                }}
                onMove={(dir) => {
                  const modules = [...draft.modules];
                  const [x] = modules.splice(mi, 1);
                  modules.splice(mi + dir, 0, x!);
                  patch({ modules });
                }}
                onRemove={() => patch({ modules: draft.modules.filter((x) => x.id !== m.id) })}
              />
            ))}
            <Button
              variant="ghost"
              onClick={() =>
                patch({
                  modules: [
                    ...draft.modules,
                    { id: uid("m"), title: `Module ${draft.modules.length + 1}`, description: "", steps: [] },
                  ],
                })
              }
            >
              <Plus className="mr-1.5 h-4 w-4" /> Ajouter un module
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-border p-4">
              <div className="font-display text-lg font-bold uppercase">{draft.title || "Sans titre"}</div>
              <p className="text-xs text-muted-foreground">{draft.description || "Aucune description"}</p>
              <div className="mt-2 text-[10px] uppercase tracking-widest text-gold">
                {draft.category} · {draft.level} · {draft.duration} min ·{" "}
                {draft.mandatory ? "Obligatoire" : "Optionnelle"}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                ["Modules", draft.modules.length],
                ["Étapes", stepCount],
                ["Questions", questionCount],
                ["Points", trainingMaxScore(draft)],
              ].map(([l, v]) => (
                <div key={String(l)} className="rounded-2xl border border-border p-3">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
                  <div className="font-display text-2xl font-bold">{v}</div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-border p-3 text-xs">
              <span className="text-muted-foreground">Affectation : </span>
              {draft.roles.join(", ") || "aucun rôle"} ·{" "}
              {(draft.restaurantIds ?? []).length ? `${draft.restaurantIds!.length} restaurants` : "tout le réseau"} ·{" "}
              {(draft.userIds ?? []).length} collaborateurs nommés
            </div>
          </div>
        )}
      </div>

      <div className="glass sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl p-3">
        <Button variant="ghost" onClick={() => (step === 0 ? back() : setStep((s) => s - 1))}>
          {step === 0 ? (
            "Annuler"
          ) : (
            <>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Retour
            </>
          )}
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => save("Brouillon")}>
            Enregistrer en brouillon
          </Button>
          {step < WIZARD.length - 1 ? (
            <Button onClick={() => setStep((s) => Math.min(WIZARD.length - 1, s + 1))}>
              Continuer <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => save("Publiée")}>
              <Check className="mr-1.5 h-4 w-4" /> Publier
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===================== Éditeur de module & d'étapes ===================== */

function ModuleEditor({
  module: m,
  index,
  count,
  onChange,
  onMove,
  onRemove,
}: {
  module: TrainingModule;
  index: number;
  count: number;
  onChange: (m: TrainingModule) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const [openStep, setOpenStep] = useState<string | null>(null);
  const [stepTab, setStepTab] = useState<"contenu" | "quiz">("contenu");

  const setStep = (si: number, patchStep: Partial<TrainingStep>) => {
    const steps = [...m.steps];
    steps[si] = { ...steps[si]!, ...patchStep };
    onChange({ ...m, steps });
  };

  return (
    <div className="rounded-2xl border border-border p-3">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:flex">
        <span className="shrink-0 text-[10px] uppercase tracking-widest text-gold">
          Module {String(index + 1).padStart(2, "0")}
        </span>
        <Input value={m.title} onChange={(e) => onChange({ ...m, title: e.target.value })} />
        <div className="col-span-2 flex shrink-0 items-center gap-1">
          <Button size="icon" variant="ghost" aria-label="Monter" disabled={index === 0} onClick={() => onMove(-1)}>
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Descendre"
            disabled={index === count - 1}
            onClick={() => onMove(1)}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" aria-label="Supprimer le module" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      <label className="mt-2 block">
        <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
          Description du module
        </span>
        <textarea
          value={m.description ?? ""}
          onChange={(e) => onChange({ ...m, description: e.target.value })}
          rows={2}
          placeholder="À quoi sert ce module et ce que le collaborateur saura faire à la fin."
          className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none"
        />
      </label>

      <div className="mt-3 space-y-2">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Étapes du module ({m.steps.length})
        </div>
        {m.steps.map((st, si) => {
          const open = openStep === st.id;
          return (
            <div key={st.id} className="rounded-xl border border-border">
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 p-2 sm:flex">
                <span className="shrink-0 text-[10px] uppercase tracking-widest text-gold">
                  {String(si + 1).padStart(2, "0")}
                </span>
                <Input value={st.title} onChange={(e) => setStep(si, { title: e.target.value })} />
                <div className="col-span-2 flex items-center gap-2">
                  <Input
                    type="number"
                    aria-label="Durée en minutes"
                    className="w-20"
                    value={st.duration}
                    onChange={(e) => setStep(si, { duration: Number(e.target.value) || 0 })}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setOpenStep((v) => (v === st.id ? null : st.id));
                      setStepTab("contenu");
                    }}
                  >
                    {open ? "Fermer" : "Éditer"}
                    <span className="ml-1.5 flex items-center gap-1 text-[10px] text-gold">
                      <Layers className="h-3 w-3" />
                      {(st.media ?? []).length}
                      <HelpCircle className="ml-1 h-3 w-3" />
                      {(st.quiz ?? []).length}
                    </span>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Supprimer l'étape"
                    onClick={() => onChange({ ...m, steps: m.steps.filter((x) => x.id !== st.id) })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {open && (
                <div className="space-y-3 border-t border-border p-3">
                  <div className="flex gap-1 rounded-xl border border-border p-1">
                    {(
                      [
                        ["contenu", "Contenu pédagogique"],
                        ["quiz", `Quiz (${(st.quiz ?? []).length})`],
                      ] as const
                    ).map(([k, l]) => (
                      <button
                        key={k}
                        onClick={() => setStepTab(k)}
                        className={cn(
                          "flex-1 rounded-lg px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors",
                          stepTab === k ? "bg-brand/20 text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {l}
                      </button>
                    ))}
                  </div>

                  {stepTab === "contenu" ? (
                    <>
                      <label className="block">
                        <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                          Instructions de l'étape
                        </span>
                        <textarea
                          value={st.instructions ?? st.content ?? ""}
                          onChange={(e) => setStep(si, { instructions: e.target.value })}
                          rows={3}
                          className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none"
                        />
                      </label>
                      <MediaUploader
                        value={st.media ?? []}
                        onChange={(media) => setStep(si, { media })}
                        title="Contenu de l'étape (vidéos, documents, images, texte)"
                      />
                    </>
                  ) : (
                    <QuizEditor
                      value={st.quiz ?? []}
                      onChange={(quiz) => setStep(si, { quiz })}
                      makeId={() => uid("q")}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            onChange({
              ...m,
              steps: [
                ...m.steps,
                {
                  id: uid("s"),
                  title: `Étape ${m.steps.length + 1}`,
                  content: "",
                  duration: 5,
                  tips: [],
                  warnings: [],
                  media: [],
                  quiz: [],
                },
              ],
            })
          }
        >
          <Plus className="mr-1.5 h-4 w-4" /> Ajouter une étape
        </Button>
      </div>
    </div>
  );
}
