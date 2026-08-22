/**
 * Système de quiz QCM Texas Chicken.
 * - QuizEditor : configuration des questions (une ou plusieurs bonnes réponses, points).
 * - QuizPlayer : passage du quiz par le collaborateur (les réponses correctes ne sont
 *   révélées qu'après validation).
 */
import { useMemo, useState } from "react";
import { Award, Check, ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TCSelect } from "@/components/tc/select";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/lib/tc/ops";

export const newQuestion = (id: string): QuizQuestion => ({
  id,
  question: "Nouvelle question",
  options: ["Réponse A", "Réponse B", "Réponse C"],
  correct: [0],
  multiple: false,
  points: 1,
});

/* ============================== ÉDITEUR ============================== */

export function QuizEditor({
  value,
  onChange,
  makeId,
}: {
  value: QuizQuestion[];
  onChange: (q: QuizQuestion[]) => void;
  makeId: () => string;
}) {
  const total = value.reduce((a, q) => a + (q.points || 0), 0);

  const patch = (i: number, p: Partial<QuizQuestion>) =>
    onChange(value.map((q, qi) => (qi === i ? { ...q, ...p } : q)));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Quiz de l'étape — {value.length} question{value.length > 1 ? "s" : ""} · {total} point{total > 1 ? "s" : ""}
        </div>
        <Button size="sm" variant="ghost" onClick={() => onChange([...value, newQuestion(makeId())])}>
          <Plus className="mr-1.5 h-4 w-4" /> Ajouter une question
        </Button>
      </div>

      {value.map((q, qi) => (
        <div key={q.id} className="rounded-2xl border border-border bg-secondary/20 p-3">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-gold">
              Question {String(qi + 1).padStart(2, "0")}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                aria-label="Monter"
                disabled={qi === 0}
                onClick={() => {
                  const next = [...value];
                  const [x] = next.splice(qi, 1);
                  next.splice(qi - 1, 0, x!);
                  onChange(next);
                }}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Descendre"
                disabled={qi === value.length - 1}
                onClick={() => {
                  const next = [...value];
                  const [x] = next.splice(qi, 1);
                  next.splice(qi + 1, 0, x!);
                  onChange(next);
                }}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Supprimer la question"
                onClick={() => onChange(value.filter((_, i) => i !== qi))}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>

          <Input
            className="mt-2"
            value={q.question}
            onChange={(e) => patch(qi, { question: e.target.value })}
            placeholder="Intitulé de la question"
          />

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                Type de question
              </span>
              <TCSelect
                value={q.multiple ? "multi" : "single"}
                onChange={(v) => {
                  const multiple = v === "multi";
                  patch(qi, {
                    multiple,
                    correct: multiple ? q.correct : q.correct.slice(0, 1),
                  });
                }}
                options={[
                  { value: "single", label: "Une seule bonne réponse" },
                  { value: "multi", label: "Plusieurs bonnes réponses" },
                ]}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Points</span>
              <Input
                type="number"
                min={0}
                value={q.points}
                onChange={(e) => patch(qi, { points: Math.max(0, Number(e.target.value) || 0) })}
              />
            </label>
          </div>

          <div className="mt-2 space-y-1.5">
            {q.options.map((o, oi) => {
              const on = q.correct.includes(oi);
              return (
                <div key={oi} className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Bonne réponse"
                    onClick={() =>
                      patch(qi, {
                        correct: q.multiple
                          ? on
                            ? q.correct.filter((x) => x !== oi)
                            : [...q.correct, oi].sort((a, b) => a - b)
                          : [oi],
                      })
                    }
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center border transition-colors",
                      q.multiple ? "rounded-md" : "rounded-full",
                      on ? "border-success bg-success/25 text-success" : "border-border text-transparent hover:border-gold/50",
                    )}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <Input
                    value={o}
                    onChange={(e) => patch(qi, { options: q.options.map((x, i) => (i === oi ? e.target.value : x)) })}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Supprimer la réponse"
                    disabled={q.options.length <= 2}
                    onClick={() =>
                      patch(qi, {
                        options: q.options.filter((_, i) => i !== oi),
                        correct: q.correct.filter((x) => x !== oi).map((x) => (x > oi ? x - 1 : x)),
                      })
                    }
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              );
            })}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => patch(qi, { options: [...q.options, `Réponse ${q.options.length + 1}`] })}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Ajouter une proposition
            </Button>
          </div>

          <div className="mt-2 text-[11px] text-muted-foreground">
            Bonnes réponses :{" "}
            <span className="text-success">
              {q.correct.length
                ? q.correct.map((i) => String.fromCharCode(65 + i)).join(" + ")
                : "aucune sélectionnée"}
            </span>{" "}
            · {q.points} point{q.points > 1 ? "s" : ""}
          </div>
        </div>
      ))}

      {value.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          Aucune question. Cette étape contient uniquement du contenu pédagogique.
        </p>
      )}
    </div>
  );
}

/* ============================== PARTICIPANT ============================== */

export function QuizPlayer({
  questions,
  savedAnswers,
  onSubmit,
  className,
}: {
  questions: QuizQuestion[];
  /** Réponses déjà enregistrées (quiz déjà passé) : affichage en mode correction. */
  savedAnswers?: Record<string, number[]>;
  onSubmit: (answers: Record<string, number[]>) => void;
  className?: string;
}) {
  const alreadyDone = !!savedAnswers && questions.every((q) => savedAnswers[q.id]);
  const [answers, setAnswers] = useState<Record<string, number[]>>(savedAnswers ?? {});
  const [revealed, setRevealed] = useState(alreadyDone);

  const max = useMemo(() => questions.reduce((a, q) => a + q.points, 0), [questions]);
  const score = useMemo(
    () =>
      questions.reduce((a, q) => {
        const given = [...(answers[q.id] ?? [])].sort().join(",");
        const good = [...q.correct].sort().join(",");
        return a + (given && given === good ? q.points : 0);
      }, 0),
    [questions, answers],
  );
  const allAnswered = questions.every((q) => (answers[q.id] ?? []).length > 0);
  const percent = max ? Math.round((score / max) * 100) : 0;

  const toggle = (q: QuizQuestion, oi: number) => {
    if (revealed) return;
    setAnswers((a) => {
      const cur = a[q.id] ?? [];
      if (!q.multiple) return { ...a, [q.id]: [oi] };
      return { ...a, [q.id]: cur.includes(oi) ? cur.filter((x) => x !== oi) : [...cur, oi].sort((x, y) => x - y) };
    });
  };

  if (!questions.length) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-display text-sm font-bold uppercase">Quiz de validation</div>
        <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
          {questions.length} question{questions.length > 1 ? "s" : ""} · {max} points
        </span>
      </div>

      {questions.map((q, qi) => {
        const picked = answers[q.id] ?? [];
        return (
          <div key={q.id} className="rounded-2xl border border-border p-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
              <div className="min-w-0 text-sm font-medium">
                {qi + 1}. {q.question}
              </div>
              <span className="shrink-0 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">
                {q.multiple ? "Plusieurs réponses" : "1 réponse"} · {q.points} pt
              </span>
            </div>
            <div className="mt-2 grid gap-1.5">
              {q.options.map((o, oi) => {
                const on = picked.includes(oi);
                const good = revealed && q.correct.includes(oi);
                const bad = revealed && on && !q.correct.includes(oi);
                return (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => toggle(q, oi)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-xs transition-colors",
                      good
                        ? "border-success/60 bg-success/15 text-success"
                        : bad
                          ? "border-destructive/60 bg-destructive/10 text-destructive"
                          : on
                            ? "border-brand/60 bg-brand/15"
                            : "border-border hover:bg-secondary/50",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center border",
                        q.multiple ? "rounded-md" : "rounded-full",
                        on || good ? "border-current" : "border-border",
                      )}
                    >
                      {(on || good) && <Check className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0 flex-1">{o}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {!revealed ? (
        <Button
          className="w-full sm:w-auto"
          disabled={!allAnswered}
          onClick={() => {
            setRevealed(true);
            onSubmit(answers);
          }}
        >
          <Check className="mr-1.5 h-4 w-4" /> Valider le quiz
        </Button>
      ) : (
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 rounded-2xl border p-4 text-xs",
            percent >= 80 ? "border-success/50 bg-success/10" : "border-border bg-secondary/40",
          )}
        >
          <Award className={cn("h-6 w-6 shrink-0", percent >= 80 ? "text-success" : "text-muted-foreground")} />
          <div className="min-w-0">
            <div className="font-display text-sm font-bold uppercase">
              Score : {score}/{max} — {percent}%
            </div>
            <div className="text-muted-foreground">
              {percent >= 80 ? "Quiz réussi, résultat enregistré." : "Score insuffisant — revoyez le contenu de l'étape."}
            </div>
          </div>
          <Button
            variant="ghost"
            className="ml-auto"
            onClick={() => {
              setAnswers({});
              setRevealed(false);
            }}
          >
            Recommencer
          </Button>
        </div>
      )}
    </div>
  );
}
