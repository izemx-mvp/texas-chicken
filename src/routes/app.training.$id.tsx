import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, CircleAlert, FileText, Lightbulb, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/tc/bits";
import { cn } from "@/lib/utils";
import { currentUser, toggleTrainingStep, trainingView, useStore } from "@/lib/tc/store";

export const Route = createFileRoute("/app/training/$id")({
  head: () => ({
    meta: [
      { title: "Parcours de formation — Texas Chicken Operations" },
      {
        name: "description",
        content: "Suivez votre formation métier Texas Chicken étape par étape : vidéos, consignes, points de vigilance et quiz de validation.",
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

  if (!view || !me) {
    return (
      <div className="glass rounded-3xl p-10 text-center text-sm text-muted-foreground">Formation introuvable.</div>
    );
  }

  const t = view.training;
  const progress = state.trainingProgress.find((p) => p.trainingId === t.id && p.userId === me.id);
  const done = progress?.completedStepIds ?? [];
  const current = t.modules.flatMap((m) => m.steps).find((s) => s.id === (activeStep ?? view.nextStepId));

  return (
    <div className="space-y-4">
      <Link to="/app/trainings" className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold">
        <ArrowLeft className="h-4 w-4" /> Toutes les formations
      </Link>

      <div className="glass overflow-hidden rounded-3xl">
        <div className="h-24 w-full" style={{ background: t.cover }} />
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="rounded-full bg-secondary/60 px-2 py-0.5">{t.category}</span>
            <span className="rounded-full bg-secondary/60 px-2 py-0.5">{t.level}</span>
            <span className="rounded-full bg-secondary/60 px-2 py-0.5">{t.duration} min</span>
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
            {view.doneSteps}/{view.totalSteps} étapes validées
          </div>
        </div>
      </div>

      {current && (
        <div className="glass space-y-3 rounded-3xl p-5">
          <div className="text-[10px] uppercase tracking-widest text-gold">
            {view.completed ? "Révision" : "Étape en cours"}
          </div>
          <h2 className="font-display text-lg font-bold uppercase">{current.title}</h2>
          {current.videoUrl && (
            <video
              key={current.id}
              src={current.videoUrl}
              controls
              playsInline
              className="aspect-video w-full rounded-2xl bg-black/60 object-cover"
            />
          )}
          <p className="text-sm text-muted-foreground">{current.content}</p>
          {current.tips.length > 0 && (
            <ul className="space-y-1 text-xs">
              {current.tips.map((tip) => (
                <li key={tip} className="flex gap-2">
                  <Lightbulb className="h-4 w-4 shrink-0 text-gold" /> {tip}
                </li>
              ))}
            </ul>
          )}
          {current.warnings.map((w) => (
            <div key={w} className="flex gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs">
              <CircleAlert className="h-4 w-4 shrink-0 text-destructive" /> {w}
            </div>
          ))}
          <Button
            onClick={() => {
              const isDone = done.includes(current.id);
              toggleTrainingStep(t.id, me.id, current.id, !isDone);
              toast.success(isDone ? "Étape réouverte" : "Étape validée");
              setActiveStep(null);
            }}
          >
            {done.includes(current.id) ? "Annuler la validation" : "Valider cette étape"}
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {t.modules.map((m, mi) => (
          <div key={m.id} className="glass rounded-3xl p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-gradient text-xs font-bold text-brand-foreground">
                {mi + 1}
              </span>
              <span className="font-display text-sm font-bold uppercase">{m.title}</span>
            </div>
            <div className="space-y-1">
              {m.steps.map((s) => {
                const isDone = done.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveStep(s.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                      s.id === current?.id ? "bg-brand/15" : "hover:bg-secondary/50",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                        isDone ? "border-success/60 bg-success/25 text-success" : "border-border text-muted-foreground",
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
        ))}
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
              <span className="truncate">{d.name}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{d.type}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-3xl p-5">
        <div className="mb-3 font-display text-sm font-bold uppercase">Validation des acquis</div>
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
      </div>
    </div>
  );
}
