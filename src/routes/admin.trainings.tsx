import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  GraduationCap,
  Pencil,
  Plus,
  Power,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KpiCard, SectionTitle, StatusPill } from "@/components/tc/bits";
import { DataTable, type Column } from "@/components/tc/data-table";
import { TCSelect } from "@/components/tc/select";
import { UserAvatar } from "@/components/tc/avatar";
import { MemberPicker } from "@/components/tc/member-picker";
import { cn } from "@/lib/utils";
import {
  allTrainingStats,
  duplicateTraining,
  removeTraining,
  toggleTrainingStatus,
  trainingAdminStats,
  uid,
  upsertTraining,
  useStore,
  type TrainingAdminStats,
} from "@/lib/tc/store";
import type { Training, TrainingLevel } from "@/lib/tc/ops";

export const Route = createFileRoute("/admin/trainings")({
  head: () => ({
    meta: [
      { title: "Gestion des formations — Texas Chicken Administration" },
      {
        name: "description",
        content:
          "Créez, assignez et supervisez les formations Texas Chicken : modules, quiz, affectation par rôle et restaurant, progression individuelle des équipes.",
      },
      { property: "og:title", content: "Gestion des formations — Texas Chicken Administration" },
      {
        property: "og:description",
        content: "Dashboard formations, taux de complétion, modules et suivi individuel des collaborateurs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrainingsAdminPage,
});

const EDIT_STEPS = ["Informations", "Médias", "Affectation", "Contenu", "Quiz", "Récapitulatif"];
const LEVELS: TrainingLevel[] = ["Débutant", "Intermédiaire", "Avancé"];

function TrainingsAdminPage() {
  const state = useStore((s) => s);
  const stats = useMemo(() => allTrainingStats(state), [state]);
  const [draft, setDraft] = useState<Training | null>(null);
  const [step, setStep] = useState(0);
  const [viewId, setViewId] = useState<string | null>(null);

  const totals = useMemo(() => {
    const assigned = stats.reduce((a, s) => a + s.assigned, 0);
    const completed = stats.reduce((a, s) => a + s.completed, 0);
    return {
      total: stats.length,
      active: stats.filter((s) => s.training.status === "Publiée").length,
      mandatory: stats.filter((s) => s.training.mandatory).length,
      late: stats.reduce((a, s) => a + s.late, 0),
      rate: assigned ? Math.round((completed / assigned) * 100) : 0,
    };
  }, [stats]);

  const emptyTraining = (): Training => ({
    id: "",
    title: "",
    description: "",
    category: "Opérations",
    roles: ["Crew Member"],
    level: "Débutant",
    duration: 30,
    mandatory: false,
    cover: "linear-gradient(135deg,#d8452f,#f0a32f)",
    mainVideo: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    documents: [],
    rules: [],
    modules: [{ id: uid("m"), title: "Module 1 — Fondamentaux", steps: [] }],
    quiz: [],
    restaurantIds: [],
    userIds: [],
    createdAt: state.activeDate,
    status: "Brouillon",
  });

  const open = (t: Training | null) => {
    setDraft(t ? JSON.parse(JSON.stringify(t)) : emptyTraining());
    setStep(0);
  };
  const patch = (p: Partial<Training>) => setDraft((d) => (d ? { ...d, ...p } : d));

  const roles = useMemo(() => Array.from(new Set(state.users.map((u) => u.role))).sort(), [state.users]);

  type Row = TrainingAdminStats & { id: string };
  const rows: Row[] = useMemo(() => stats.map((s) => ({ ...s, id: s.training.id })), [stats]);

  const columns: Column<Row>[] = [
    {
      key: "title",
      header: "Formation",
      sortable: true,
      value: (s) => s.training.title,
      render: (s) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: s.training.cover }}>
            <BookOpen className="h-4 w-4 text-white" />
          </span>
          <div className="min-w-0">
            <div className="truncate font-semibold">{s.training.title}</div>
            <div className="truncate text-[11px] text-muted-foreground">
              {s.training.category} · {s.training.level} · {s.training.duration} min
              {s.training.mandatory && <span className="ml-1 text-gold">· Obligatoire</span>}
            </div>
          </div>
        </div>
      ),
    },
    { key: "roles", header: "Rôles", value: (s) => s.training.roles.join(", ") },
    { key: "assigned", header: "Assignés", sortable: true, value: (s) => s.assigned },
    {
      key: "progress",
      header: "Complétion",
      sortable: true,
      value: (s) => s.avgPercent,
      render: (s) => (
        <div className="w-32">
          <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
            <span>{s.completed}/{s.assigned} terminés</span>
            <span className="text-gold">{s.avgPercent}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${s.avgPercent}%` }} />
          </div>
        </div>
      ),
    },
    {
      key: "late",
      header: "En retard",
      sortable: true,
      value: (s) => s.late,
      render: (s) => <span className={s.late ? "font-semibold text-destructive" : "text-muted-foreground"}>{s.late}</span>,
    },
    {
      key: "status",
      header: "Statut",
      value: (s) => s.training.status,
      render: (s) => <StatusPill status={s.training.status === "Publiée" ? "Actif" : "Brouillon"} />,
    },
    {
      key: "actions",
      header: "",
      render: (s) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" aria-label="Voir" onClick={() => setViewId(s.training.id)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" aria-label="Publier" onClick={() => toggleTrainingStatus(s.training.id)}>
            <Power className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" aria-label="Modifier" onClick={() => open(s.training)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Dupliquer"
            onClick={() => {
              duplicateTraining(s.training.id);
              toast.success("Formation dupliquée");
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Supprimer"
            onClick={() => {
              removeTraining(s.training.id);
              toast.success("Formation supprimée");
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const detail = viewId ? trainingAdminStats(viewId, state) : null;

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Gestion des formations"
        subtitle="Créer, assigner et superviser la montée en compétence du réseau"
        action={
          <Button onClick={() => open(null)}>
            <Plus className="mr-1.5 h-4 w-4" /> Nouvelle formation
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Formations" value={totals.total} icon={<GraduationCap className="h-4 w-4" />} />
        <KpiCard label="Actives" value={totals.active} icon={<BookOpen className="h-4 w-4" />} tone="brand" />
        <KpiCard label="Obligatoires" value={totals.mandatory} icon={<Check className="h-4 w-4" />} tone="warning" />
        <KpiCard label="En retard" value={totals.late} icon={<X className="h-4 w-4" />} tone="danger" />
        <KpiCard label="Taux de complétion" value={totals.rate} suffix="%" icon={<ArrowRight className="h-4 w-4" />} tone="success" />
      </div>

      <div className="glass rounded-3xl p-4">
        <div className="mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          Complétion par formation
        </div>
        <div className="space-y-2">
          {stats.map((s) => (
            <div key={s.training.id} className="flex items-center gap-3 text-xs">
              <span className="w-52 shrink-0 truncate">{s.training.title}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${s.avgPercent}%` }} />
              </div>
              <span className="w-10 shrink-0 text-right text-gold">{s.avgPercent}%</span>
            </div>
          ))}
        </div>
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        searchFields={(s) => `${s.training.title} ${s.training.category} ${s.training.roles.join(" ")}`}
      />

      {/* ---------------- suivi détaillé ---------------- */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass animate-rise max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-xl font-bold uppercase">{detail.training.title}</h2>
                <p className="text-xs text-muted-foreground">
                  {detail.training.category} · {detail.totalSteps} étapes · {detail.assigned} collaborateurs assignés
                </p>
              </div>
              <button onClick={() => setViewId(null)} aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              {[
                ["Terminés", detail.completed, "text-success"],
                ["En cours", detail.started, "text-gold"],
                ["Non démarrés", detail.notStarted, "text-muted-foreground"],
                ["En retard", detail.late, "text-destructive"],
              ].map(([label, val, tone]) => (
                <div key={String(label)} className="rounded-2xl border border-border p-3">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
                  <div className={cn("font-display text-2xl font-bold", tone as string)}>{val}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1.5">
              {detail.assignees.map((a) => (
                <div key={a.user.id} className="flex items-center gap-3 rounded-2xl border border-border p-2.5">
                  <UserAvatar user={a.user} size={34} presence />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold">
                      {a.user.firstName} {a.user.lastName}
                    </div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      {a.user.role} · {a.restaurantName}
                      {a.dueDate && <span> · échéance {a.dueDate}</span>}
                    </div>
                  </div>
                  <div className="w-28">
                    <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${a.percent}%` }} />
                    </div>
                  </div>
                  <span className="w-9 text-right text-[11px] text-gold">{a.percent}%</span>
                  <span
                    className={cn(
                      "w-24 shrink-0 rounded-full px-2 py-0.5 text-center text-[10px] uppercase tracking-widest",
                      a.status === "Terminé" && "bg-success/15 text-success",
                      a.status === "En cours" && "bg-gold/15 text-gold",
                      a.status === "En retard" && "bg-destructive/15 text-destructive",
                      a.status === "Non démarré" && "bg-secondary text-muted-foreground",
                    )}
                  >
                    {a.status}
                  </span>
                </div>
              ))}
              {detail.assignees.length === 0 && (
                <p className="p-6 text-center text-xs text-muted-foreground">Aucun collaborateur assigné.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- création / édition ---------------- */}
      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass animate-rise max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-xl font-bold uppercase">
                  {draft.id ? "Modifier la formation" : "Nouvelle formation"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Étape {String(step + 1).padStart(2, "0")} — {EDIT_STEPS[step]}
                </p>
              </div>
              <button onClick={() => setDraft(null)} aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-1">
              {EDIT_STEPS.map((s, i) => (
                <button
                  key={s}
                  onClick={() => setStep(i)}
                  className={cn(
                    "flex-1 rounded-full px-2 py-1.5 text-[10px] uppercase tracking-widest transition-colors",
                    i === step
                      ? "bg-brand/20 text-foreground"
                      : i < step
                        ? "bg-success/15 text-success"
                        : "bg-secondary/50 text-muted-foreground",
                  )}
                >
                  {String(i + 1).padStart(2, "0")} · {s}
                </button>
              ))}
            </div>

            <div className="mt-5 min-h-72">
              {step === 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Titre</span>
                    <Input value={draft.title} onChange={(e) => patch({ title: e.target.value })} placeholder="Hygiène & HACCP niveau 1" />
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
                    <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Vidéo principale (URL)</span>
                    <Input value={draft.mainVideo} onChange={(e) => patch({ mainVideo: e.target.value })} />
                  </label>
                </div>
              )}

              {step === 2 && (
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
                            onClick={() =>
                              patch({ roles: on ? draft.roles.filter((x) => x !== r) : [...draft.roles, r] })
                            }
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-xs transition-colors",
                              on ? "border-gold/60 bg-gold/15 text-gold" : "border-border text-muted-foreground hover:border-gold/40",
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
                    <div className="grid max-h-48 gap-1 overflow-y-auto rounded-2xl border border-border p-2 sm:grid-cols-2">
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
                            <span className="truncate">{r.name}</span>
                            <span className="ml-auto text-[10px]">{r.city}</span>
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

              {step === 3 && (
                <div className="space-y-3">
                  {draft.modules.map((m, mi) => (
                    <div key={m.id} className="rounded-2xl border border-border p-3">
                      <div className="flex items-center gap-2">
                        <Input
                          value={m.title}
                          onChange={(e) => {
                            const modules = [...draft.modules];
                            modules[mi] = { ...m, title: e.target.value };
                            patch({ modules });
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Monter"
                          disabled={mi === 0}
                          onClick={() => {
                            const modules = [...draft.modules];
                            const [x] = modules.splice(mi, 1);
                            modules.splice(mi - 1, 0, x!);
                            patch({ modules });
                          }}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Descendre"
                          disabled={mi === draft.modules.length - 1}
                          onClick={() => {
                            const modules = [...draft.modules];
                            const [x] = modules.splice(mi, 1);
                            modules.splice(mi + 1, 0, x!);
                            patch({ modules });
                          }}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Supprimer le module"
                          onClick={() => patch({ modules: draft.modules.filter((x) => x.id !== m.id) })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="mt-2 space-y-1.5 pl-2">
                        {m.steps.map((st, si) => (
                          <div key={st.id} className="flex items-center gap-2">
                            <span className="w-8 shrink-0 text-[10px] uppercase tracking-widest text-gold">
                              {String(si + 1).padStart(2, "0")}
                            </span>
                            <Input
                              value={st.title}
                              onChange={(e) => {
                                const modules = [...draft.modules];
                                const steps = [...m.steps];
                                steps[si] = { ...st, title: e.target.value };
                                modules[mi] = { ...m, steps };
                                patch({ modules });
                              }}
                            />
                            <Input
                              type="number"
                              className="w-20"
                              value={st.duration}
                              onChange={(e) => {
                                const modules = [...draft.modules];
                                const steps = [...m.steps];
                                steps[si] = { ...st, duration: Number(e.target.value) || 0 };
                                modules[mi] = { ...m, steps };
                                patch({ modules });
                              }}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Supprimer la leçon"
                              onClick={() => {
                                const modules = [...draft.modules];
                                modules[mi] = { ...m, steps: m.steps.filter((x) => x.id !== st.id) };
                                patch({ modules });
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const modules = [...draft.modules];
                            modules[mi] = {
                              ...m,
                              steps: [
                                ...m.steps,
                                {
                                  id: uid("s"),
                                  title: `Leçon ${m.steps.length + 1}`,
                                  content: "",
                                  duration: 5,
                                  tips: [],
                                  warnings: [],
                                },
                              ],
                            };
                            patch({ modules });
                          }}
                        >
                          <Plus className="mr-1.5 h-4 w-4" /> Ajouter une leçon
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    onClick={() =>
                      patch({
                        modules: [
                          ...draft.modules,
                          { id: uid("m"), title: `Module ${draft.modules.length + 1}`, steps: [] },
                        ],
                      })
                    }
                  >
                    <Plus className="mr-1.5 h-4 w-4" /> Ajouter un module
                  </Button>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3">
                  {draft.quiz.map((q, qi) => (
                    <div key={qi} className="rounded-2xl border border-border p-3">
                      <div className="flex items-center gap-2">
                        <Input
                          value={q.question}
                          onChange={(e) => {
                            const quiz = [...draft.quiz];
                            quiz[qi] = { ...q, question: e.target.value };
                            patch({ quiz });
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Supprimer la question"
                          onClick={() => patch({ quiz: draft.quiz.filter((_, i) => i !== qi) })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="mt-2 space-y-1.5 pl-2">
                        {q.options.map((o, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-label="Bonne réponse"
                              onClick={() => {
                                const quiz = [...draft.quiz];
                                quiz[qi] = { ...q, answer: oi };
                                patch({ quiz });
                              }}
                              className={cn(
                                "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                                q.answer === oi ? "border-success bg-success/25 text-success" : "border-border",
                              )}
                            >
                              {q.answer === oi && <Check className="h-3 w-3" />}
                            </button>
                            <Input
                              value={o}
                              onChange={(e) => {
                                const quiz = [...draft.quiz];
                                const options = [...q.options];
                                options[oi] = e.target.value;
                                quiz[qi] = { ...q, options };
                                patch({ quiz });
                              }}
                            />
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const quiz = [...draft.quiz];
                            quiz[qi] = { ...q, options: [...q.options, `Réponse ${q.options.length + 1}`] };
                            patch({ quiz });
                          }}
                        >
                          <Plus className="mr-1.5 h-4 w-4" /> Ajouter une réponse
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    onClick={() =>
                      patch({
                        quiz: [
                          ...draft.quiz,
                          { question: "Nouvelle question", options: ["Réponse 1", "Réponse 2"], answer: 0 },
                        ],
                      })
                    }
                  >
                    <Plus className="mr-1.5 h-4 w-4" /> Ajouter une question
                  </Button>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-border p-4">
                    <div className="font-display text-lg font-bold uppercase">{draft.title || "Sans titre"}</div>
                    <p className="text-xs text-muted-foreground">{draft.description || "Aucune description"}</p>
                    <div className="mt-2 text-[10px] uppercase tracking-widest text-gold">
                      {draft.category} · {draft.level} · {draft.duration} min ·{" "}
                      {draft.mandatory ? "Obligatoire" : "Optionnelle"}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      ["Modules", draft.modules.length],
                      ["Leçons", draft.modules.reduce((a, m) => a + m.steps.length, 0)],
                      ["Questions quiz", draft.quiz.length],
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

            <div className="mt-6 flex items-center justify-between gap-2">
              <Button variant="ghost" onClick={() => (step === 0 ? setDraft(null) : setStep((s) => s - 1))}>
                {step === 0 ? (
                  "Annuler"
                ) : (
                  <>
                    <ArrowLeft className="mr-1.5 h-4 w-4" /> Retour
                  </>
                )}
              </Button>
              <div className="flex gap-2">
                {step === EDIT_STEPS.length - 1 && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (!draft.title.trim()) {
                        toast.error("Le titre est obligatoire");
                        return;
                      }
                      upsertTraining({ ...draft, id: draft.id || uid("tr"), status: "Brouillon" });
                      toast.success("Brouillon enregistré");
                      setDraft(null);
                    }}
                  >
                    Enregistrer en brouillon
                  </Button>
                )}
                {step < EDIT_STEPS.length - 1 ? (
                  <Button onClick={() => setStep((s) => Math.min(EDIT_STEPS.length - 1, s + 1))}>
                    Continuer <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      if (!draft.title.trim()) {
                        toast.error("Le titre est obligatoire");
                        return;
                      }
                      upsertTraining({ ...draft, id: draft.id || uid("tr"), status: "Publiée" });
                      toast.success(draft.id ? "Formation mise à jour" : "Formation publiée");
                      setDraft(null);
                    }}
                  >
                    <Check className="mr-1.5 h-4 w-4" /> Publier
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
