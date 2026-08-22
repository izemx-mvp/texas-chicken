import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Download,
  FileText,
  HelpCircle,
  Lightbulb,
  ListChecks,
  Lock,
  PlayCircle,
  Target,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/tc/bits";
import { cn } from "@/lib/utils";
import {
  currentUser,
  submitStepQuiz,
  toggleTrainingStep,
  trainingAdminStats,
  trainingView,
  useStore,
} from "@/lib/tc/store";
import { MediaGrid } from "@/components/tc/media-viewer";
import { QuizPlayer } from "@/components/tc/quiz";
import { useIsMobile } from "@/hooks/use-mobile";
import type { TrainingStep } from "@/lib/tc/ops";

export const Route = createFileRoute("/app/training/$id")({
  head: () => ({
    meta: [
      { title: "Parcours de formation — Texas Chicken Operations" },
      {
        name: "description",
        content:
          "Suivez votre formation métier Texas Chicken étape par étape : vidéos, consignes, points de vigilance et quiz de validation.",
      },
      { property: "og:title", content: "Parcours de formation — Texas Chicken Operations" },
      { property: "og:description", content: "Modules vidéo, étapes guidées et validation des acquis." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrainingDetail,
});

function TrainingDetail() {
  const { id } = useParams({ from: "/app/training/$id" });
  const state = useStore((s) => s);
  const me = currentUser();
  const view = useMemo(() => trainingView(id, me?.id, state), [id, me?.id, state]);
  const stats = useMemo(() => trainingAdminStats(id, state), [id, state]);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [tab, setTab] = useState<"parcours" | "ressources" | "resultats">("parcours");
  const [sideWidth, setSideWidth] = useState(300);
  const isMobile = useIsMobile();
  const compact = !isMobile && sideWidth < 150;

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = sideWidth;
    const move = (ev: MouseEvent) =>
      setSideWidth(Math.min(460, Math.max(76, startW + ev.clientX - startX)));
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };


  if (!view || !me) {
    return (
      <div className="glass rounded-3xl p-10 text-center text-sm text-muted-foreground">Formation introuvable.</div>
    );
  }

  const t = view.training;
  const progress = state.trainingProgress.find((p) => p.trainingId === t.id && p.userId === me.id);
  const done = progress?.completedStepIds ?? [];
  const flat: TrainingStep[] = t.modules.flatMap((m) => m.steps);
  const current = flat.find((s) => s.id === (activeStep ?? view.nextStepId)) ?? flat[0];
  const currentIndex = current ? flat.findIndex((s) => s.id === current.id) : 0;
  const currentModule = t.modules.find((m) => m.steps.some((s) => s.id === current?.id));

  /** Réponses déjà enregistrées pour le quiz d'une étape. */
  const savedAnswersFor = (step: TrainingStep) => {
    const saved = progress?.quizAnswers ?? {};
    const entries = (step.quiz ?? []).filter((q) => saved[q.id]).map((q) => [q.id, saved[q.id]!] as const);
    return entries.length === (step.quiz?.length ?? 0) && entries.length
      ? Object.fromEntries(entries)
      : undefined;
  };

  const goto = (i: number) => {
    const s = flat[i];
    if (s) {
      setActiveStep(s.id);
      setTab("parcours");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };


  return (
    <div className="space-y-4">
      <Link to="/app/trainings" className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold">
        <ArrowLeft className="h-4 w-4" /> Toutes les formations
      </Link>

      <div className="glass overflow-hidden rounded-3xl">
        <div className="relative h-36 w-full" style={{ background: t.cover }}>
          {t.coverPhoto && (
            <img src={t.coverPhoto} alt={t.title} width={1024} height={576} className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="rounded-full bg-secondary/60 px-2 py-0.5">{t.category}</span>
            <span className="rounded-full bg-secondary/60 px-2 py-0.5">{t.level}</span>
            <span className="rounded-full bg-secondary/60 px-2 py-0.5">{t.duration} min</span>
            <span className="rounded-full bg-secondary/60 px-2 py-0.5">
              {t.modules.length} modules · {view.totalSteps} étapes
            </span>
            {t.mandatory && (
              <span className="rounded-full border border-brand/40 bg-brand/15 px-2 py-0.5 text-brand">Obligatoire</span>
            )}
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold uppercase">{t.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
          <div className="mt-2 text-[11px] text-muted-foreground">
            Métiers concernés : <span className="text-gold">{t.roles.join(" · ")}</span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <ProgressBar value={view.percent} className="flex-1" />
            <span className="text-sm font-bold text-gold">{view.percent}%</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Module {(t.modules.findIndex((m) => m.steps.some((s) => s.id === (activeStep ?? view.nextStepId))) + 1) || 1}/{t.modules.length} ·{" "}
            {view.doneSteps}/{view.totalSteps} étapes validées
            {progress?.dueDate ? ` · échéance ${progress.dueDate}` : ""}
          </div>
        </div>
      </div>

      {(t.objectives?.length || t.prerequisites?.length) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {t.objectives?.length ? (
            <div className="glass rounded-3xl p-4">
              <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-widest text-gold">
                <Target className="h-4 w-4" /> Objectifs pédagogiques
              </div>
              <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {t.objectives.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {t.prerequisites?.length ? (
            <div className="glass rounded-3xl p-4">
              <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-widest text-gold">
                <Lock className="h-4 w-4" /> Prérequis
              </div>
              <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {t.prerequisites.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      <div className="flex gap-1 rounded-xl border border-border p-1">
        {(
          [
            ["parcours", "Parcours"],
            ["ressources", "Ressources"],
            ["resultats", "Résultats"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-widest transition-colors",
              tab === k ? "bg-brand/20 text-foreground" : "text-muted-foreground",
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "parcours" && current && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
          <aside
            className="glass w-full shrink-0 overflow-hidden rounded-3xl p-2 lg:max-h-[78vh] lg:overflow-y-auto"
            style={isMobile ? undefined : { width: sideWidth }}
          >
            {!compact && (
              <div className="px-2 py-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                Étapes — {view.doneSteps}/{view.totalSteps}
              </div>
            )}
            <div className="space-y-3">
              {t.modules.map((m, mi) => {
                const total = m.steps.length;
                const okCount = m.steps.filter((s) => done.includes(s.id)).length;
                return (
                  <div key={m.id} className="rounded-2xl border border-border/60 p-2">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={cn(
                          "grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold",
                          okCount === total
                            ? "bg-success/25 text-success"
                            : "bg-brand-gradient text-brand-foreground",
                        )}
                      >
                        {okCount === total ? <Check className="h-4 w-4" /> : mi + 1}
                      </span>
                      {!compact && (
                        <>
                          <span className="font-display min-w-0 truncate text-sm font-bold uppercase">{m.title}</span>
                          <span className="ml-auto shrink-0 text-[10px] uppercase tracking-widest text-muted-foreground">
                            {okCount}/{total}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="space-y-1">
                      {m.steps.map((s) => {
                        const isDone = done.includes(s.id);
                        const num = flat.findIndex((f) => f.id === s.id) + 1;
                        return (
                          <button
                            key={s.id}
                            title={s.title}
                            onClick={() => {
                              setActiveStep(s.id);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm transition-colors",
                              s.id === current?.id ? "bg-brand/15" : "hover:bg-secondary/50",
                            )}
                          >
                            <span
                              className={cn(
                                "grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[9px] font-bold",
                                isDone
                                  ? "border-success/60 bg-success/25 text-success"
                                  : "border-border text-muted-foreground",
                              )}
                            >
                              {isDone ? <Check className="h-3 w-3" /> : compact ? num : <PlayCircle className="h-3 w-3" />}
                            </span>
                            {!compact && (
                              <>
                                <span className="min-w-0 flex-1 truncate">
                                  {num}. {s.title}
                                </span>
                                <span className="shrink-0 text-[10px] text-muted-foreground">{s.duration} min</span>
                              </>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          <div
            onMouseDown={startResize}
            title="Redimensionner"
            className="hidden w-1.5 shrink-0 cursor-col-resize self-stretch rounded-full bg-border transition-colors hover:bg-brand/70 lg:block"
          />
          <div className="min-w-0 flex-1 space-y-3">
          <div className="glass space-y-3 rounded-3xl p-5">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-gold">
              <span>
                {currentModule?.title} — étape {currentIndex + 1}/{flat.length}
              </span>
              <span className="text-muted-foreground">{current.duration} min</span>
            </div>
            <h2 className="font-display text-lg font-bold uppercase">{current.title}</h2>

            {current.videoUrl ? (
              <video
                key={current.id}
                src={current.videoUrl}
                poster={current.image}
                controls
                playsInline
                className="aspect-video w-full rounded-2xl bg-black/60 object-cover"
              />
            ) : current.image ? (
              <img src={current.image} alt={current.title} loading="lazy" className="aspect-video w-full rounded-2xl object-cover" />
            ) : null}

            {current.objective && (
              <div className="rounded-2xl border border-gold/30 bg-gold/10 p-3 text-xs">
                <div className="mb-1 flex items-center gap-2 font-semibold text-gold">
                  <Target className="h-3.5 w-3.5" /> Objectif
                </div>
                {current.objective}
              </div>
            )}

            <p className="text-sm text-muted-foreground">{current.content}</p>

            <MediaGrid items={current.media ?? []} title="Contenu de l'étape" />

            {current.quiz?.length ? (
              <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                <QuizPlayer
                  key={current.id}
                  questions={current.quiz}
                  savedAnswers={savedAnswersFor(current)}
                  onSubmit={(answers) => {
                    const res = submitStepQuiz(t.id, me.id, current.id, answers);
                    toast.success(`Quiz enregistré — ${res.score}/${res.max} points`);
                  }}
                />
              </div>
            ) : null}


            {current.procedure?.length ? (
              <div>
                <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                  <ListChecks className="h-4 w-4 text-gold" /> Procédure
                </div>
                <ol className="space-y-1 text-xs">
                  {current.procedure.map((p, i) => (
                    <li key={p} className="flex gap-2">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-secondary/70 text-[10px] font-bold">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground">{p}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {current.tips.length > 0 && (
              <ul className="space-y-1 text-xs">
                {current.tips.map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <Lightbulb className="h-4 w-4 shrink-0 text-gold" /> {tip}
                  </li>
                ))}
              </ul>
            )}

            {current.mistakes?.length ? (
              <div className="rounded-2xl border border-border p-3">
                <div className="mb-1 text-[11px] uppercase tracking-widest text-muted-foreground">Erreurs fréquentes</div>
                <ul className="space-y-1 text-xs">
                  {current.mistakes.map((m) => (
                    <li key={m} className="flex gap-2 text-muted-foreground">
                      <XCircle className="h-4 w-4 shrink-0 text-destructive" /> {m}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {current.warnings.map((w) => (
              <div key={w} className="flex gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs">
                <CircleAlert className="h-4 w-4 shrink-0 text-destructive" /> {w}
              </div>
            ))}

            {current.document && (
              <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs">
                <FileText className="h-4 w-4 text-gold" />
                <span className="min-w-0 flex-1 truncate">{current.document.name}</span>
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button variant="ghost" disabled={currentIndex === 0} onClick={() => goto(currentIndex - 1)}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Précédent
              </Button>
              <Button
                onClick={() => {
                  const isDone = done.includes(current.id);
                  toggleTrainingStep(t.id, me.id, current.id, !isDone);
                  if (isDone) {
                    toast.success("Étape réouverte");
                    return;
                  }
                  toast.success("Étape validée");
                  if (currentIndex < flat.length - 1) goto(currentIndex + 1);
                  else {
                    setTab("resultats");
                    toast.success("Parcours terminé — consultez vos résultats");
                  }
                }}
              >
                {done.includes(current.id) ? "Annuler la validation" : "Valider cette étape"}
              </Button>
              <Button
                variant="ghost"
                disabled={currentIndex === flat.length - 1}
                onClick={() => goto(currentIndex + 1)}
              >
                Suivant <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>

          </div>
        </div>
      )}

      {tab === "ressources" && (
        <div className="space-y-3">
          <div className="glass rounded-3xl p-5">
            <div className="mb-2 font-display text-sm font-bold uppercase">Vidéo de présentation</div>
            <video src={t.mainVideo} poster={t.coverPhoto} controls playsInline className="aspect-video w-full rounded-2xl bg-black/60" />
          </div>
          <div className="glass rounded-3xl p-5">
            <div className="mb-2 font-display text-sm font-bold uppercase">Règles importantes</div>
            <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              {t.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {t.documents.map((d) => (
                <div key={d.name} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs">
                  <FileText className="h-4 w-4 text-gold" />
                  <span className="min-w-0 flex-1 truncate">{d.name}</span>
                  <span className="text-[10px] text-muted-foreground">{d.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "resultats" && (
        <div className="glass overflow-hidden rounded-3xl">
          <div className="flex flex-wrap items-center justify-between gap-2 p-5 pb-3">
            <div>
              <div className="font-display text-sm font-bold uppercase">Résultats des participants</div>
              <p className="text-[11px] text-muted-foreground">
                Score maximum : {view.maxScore} points · moyenne réseau {stats?.avgScorePercent ?? 0}%
              </p>
            </div>
            <div className="rounded-2xl border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs text-gold">
              Mon score : {view.score}/{view.maxScore} ({view.scorePercent}%)
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="bg-secondary/40 text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Nom</th>
                  <th className="px-4 py-2">Restaurant</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Score</th>
                  <th className="px-4 py-2">Pourcentage</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.results ?? []).map((r) => (
                  <tr key={r.user.id} className="border-t border-border/60">
                    <td className="px-4 py-2 font-medium">{r.user.fullName}</td>
                    <td className="px-4 py-2 text-muted-foreground">{r.restaurantName}</td>
                    <td className="px-4 py-2 text-muted-foreground">{r.completedAt ?? r.lastActivity ?? "—"}</td>
                    <td className="px-4 py-2">
                      {r.score}/{r.maxScore}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold",
                          r.scorePercent >= 80 ? "bg-success/20 text-success" : "bg-secondary/60 text-muted-foreground",
                        )}
                      >
                        {r.scorePercent}%
                      </span>
                    </td>
                  </tr>
                ))}
                {!stats?.results.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Aucun participant n'a encore terminé cette formation.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
