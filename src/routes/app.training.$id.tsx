import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  CircleAlert,
  Download,
  FileText,
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
import { currentUser, toggleTrainingStep, trainingView, useStore } from "@/lib/tc/store";
import { MediaGrid } from "@/components/tc/media-viewer";
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
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [tab, setTab] = useState<"parcours" | "ressources" | "quiz">("parcours");

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

  const quizDone = t.quiz.every((_, i) => quizAnswers[i] !== undefined);
  const quizScore = t.quiz.length
    ? Math.round((t.quiz.filter((q, i) => quizAnswers[i] === q.answer).length / t.quiz.length) * 100)
    : 100;

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
            ["quiz", "Quiz"],
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
        <>
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

            {current.instructions && (
              <div className="rounded-2xl border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
                <div className="mb-1 text-[10px] uppercase tracking-widest text-gold">Instructions</div>
                {current.instructions}
              </div>
            )}

            <MediaGrid items={current.media ?? []} title="Contenu de l'étape" />

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
                    setTab("quiz");
                    toast.success("Parcours terminé — passez le quiz de validation");
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

          <div className="space-y-3">
            {t.modules.map((m, mi) => {
              const total = m.steps.length;
              const okCount = m.steps.filter((s) => done.includes(s.id)).length;
              return (
                <div key={m.id} className="glass rounded-3xl p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={cn(
                        "grid h-7 w-7 place-items-center rounded-lg text-xs font-bold",
                        okCount === total
                          ? "bg-success/25 text-success"
                          : "bg-brand-gradient text-brand-foreground",
                      )}
                    >
                      {okCount === total ? <Check className="h-4 w-4" /> : mi + 1}
                    </span>
                    <span className="font-display text-sm font-bold uppercase">{m.title}</span>
                    <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">
                      {okCount}/{total}
                    </span>
                  </div>

                  {m.instructions && (
                    <p className="mb-2 rounded-xl bg-secondary/40 p-2 text-[11px] text-muted-foreground">{m.instructions}</p>
                  )}

                  <MediaGrid items={m.media ?? []} title="Contenu du module" className="mb-3" />

                  <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                    Parcours du module — {total} étapes
                  </div>
                  <div className="space-y-1">
                    {m.steps.map((s) => {
                      const isDone = done.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            setActiveStep(s.id);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                            s.id === current?.id ? "bg-brand/15" : "hover:bg-secondary/50",
                          )}
                        >
                          <span
                            className={cn(
                              "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                              isDone
                                ? "border-success/60 bg-success/25 text-success"
                                : "border-border text-muted-foreground",
                            )}
                          >
                            {isDone ? <Check className="h-3 w-3" /> : <PlayCircle className="h-3 w-3" />}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{s.title}</span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">{s.duration} min</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
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

      {tab === "quiz" && (
        <div className="glass rounded-3xl p-5">
          <div className="mb-1 font-display text-sm font-bold uppercase">Validation des acquis</div>
          <p className="mb-3 text-[11px] text-muted-foreground">
            Score minimum requis : 80 %. {view.completed ? "Toutes les étapes sont validées." : "Terminez d'abord toutes les étapes du parcours."}
          </p>
          <div className="space-y-4">
            {t.quiz.map((q, qi) => (
              <div key={q.question}>
                <div className="text-sm font-medium">{q.question}</div>
                <div className="mt-2 grid gap-1">
                  {q.options.map((o, oi) => {
                    const picked = quizAnswers[qi];
                    const state2 =
                      picked === undefined ? "idle" : oi === q.answer ? "good" : picked === oi ? "bad" : "idle";
                    return (
                      <button
                        key={o}
                        onClick={() => setQuizAnswers((a) => ({ ...a, [qi]: oi }))}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-left text-xs transition-colors",
                          state2 === "good"
                            ? "border-success/60 bg-success/15 text-success"
                            : state2 === "bad"
                              ? "border-destructive/60 bg-destructive/10 text-destructive"
                              : "border-border hover:bg-secondary/50",
                        )}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {quizDone && (
            <div
              className={cn(
                "mt-4 flex items-center gap-3 rounded-2xl border p-4 text-xs",
                quizScore >= 80 && view.completed
                  ? "border-success/50 bg-success/10"
                  : "border-border bg-secondary/40",
              )}
            >
              <Award className={cn("h-6 w-6", quizScore >= 80 ? "text-success" : "text-muted-foreground")} />
              <div>
                <div className="font-display text-sm font-bold uppercase">Score : {quizScore}%</div>
                <div className="text-muted-foreground">
                  {quizScore >= 80 && view.completed
                    ? "Formation validée — attestation enregistrée dans votre dossier."
                    : quizScore >= 80
                      ? "Quiz réussi. Validez toutes les étapes du parcours pour finaliser."
                      : "Score insuffisant — revoyez les modules puis retentez le quiz."}
                </div>
              </div>
              <Button variant="ghost" className="ml-auto" onClick={() => setQuizAnswers({})}>
                Recommencer
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
