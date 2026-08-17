import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Camera, CheckCircle2, ListOrdered, Pause, Play, PlayCircle, ShieldCheck, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { EmptyState, StatusPill } from "@/components/tc/bits";
import { EvidenceCapture } from "@/components/tc/evidence-capture";
import { currentUser, executionDetail, finishTask, pushAlert, updateTask, useStore } from "@/lib/tc/store";
import { TaskDetailFilled } from "@/components/tc/task-detail-filled";
import { TODAY } from "@/lib/tc/data";

export const Route = createFileRoute("/app/task/$id")({
  head: () => ({
    meta: [
      { title: "Exécution de tâche — Texas Chicken Operations" },
      { name: "description", content: "Exécutez la tâche : instructions, timer, preuve photo contrôlée par IA et validation." },
      { property: "og:title", content: "Exécution de tâche — Texas Chicken Operations" },
      { property: "og:description", content: "Timer, checklist, preuve photo anti-fraude et validation de tâche." },
    ],
  }),
  component: TaskExecution,
});

function TaskExecution() {
  const { id } = useParams({ from: "/app/task/$id" });
  const navigate = useNavigate();
  const task = useStore((s) => s.shiftTasks.find((t) => t.id === id));
  const user = useStore(() => currentUser());
  const evidence = useStore((s) => s.evidence.find((e) => e.id === task?.evidenceId));
  const exec = useStore((s) =>
    task && task.status === "Terminé"
      ? executionDetail(task.date ?? TODAY, task.id, currentUser()?.restaurantId ?? undefined, s)
      : null,
  );

  const [started, setStarted] = useState(false);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [capture, setCapture] = useState(false);
  const [checks, setChecks] = useState<boolean[]>([false, false, false]);
  const [answer, setAnswer] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  if (!task) return <EmptyState title="Tâche introuvable" />;

  const total = task.duration * 60;
  const remaining = Math.max(0, total - elapsed);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  const evidenceOk = !task.evidenceRequired || !!task.evidenceId;
  const inputOk =
    task.type === "Checklist"
      ? checks.every(Boolean)
      : task.type === "Commentaire"
        ? note.trim().length > 3
        : task.type === "Oui / Non" || task.type === "Sélection"
          ? !!answer
          : task.type === "Score" || task.type === "Valeur numérique"
            ? answer !== ""
            : true;
  const canFinish = started && evidenceOk && inputOk && task.status !== "Terminé";

  const finish = () => {
    const numeric = Number(answer);
    let nonCompliant = false;
    if (task.type === "Valeur numérique" && !Number.isNaN(numeric) && numeric > 5) nonCompliant = true;
    if (task.type === "Score" && !Number.isNaN(numeric) && numeric < 70) nonCompliant = true;

    const result = answer || note || (task.type === "Checklist" ? "Checklist complétée" : "Conforme");
    if (nonCompliant) {
      updateTask(task.id, {
        status: "Non conforme",
        result,
        completedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      });
    } else {
      finishTask(task.id, { result });
    }
    setRunning(false);

    if (nonCompliant) {
      pushAlert({
        type: "Non-conformité",
        level: "Critique",
        message: `Non-conformité sur « ${task.name} » (valeur ${answer})`,
        restaurantId: user?.restaurantId ?? "r1",
        userId: user?.id ?? null,
        processId: task.processId,
      });
      toast.error("Tâche non conforme — alerte créée", {
        description: "Une alerte critique a été transmise au back-office.",
      });
    } else {
      toast.success("Tâche terminée", { description: "Conformité et KPI mis à jour." });
    }
    setTimeout(() => navigate({ to: "/app/process/$id", params: { id: task.processId } }), 700);
  };

  if (exec)
    return (
      <div className="space-y-4">
        <Link
          to="/app/process/$id"
          params={{ id: task.processId }}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" /> Retour au processus
        </Link>
        <TaskDetailFilled exec={exec} />
      </div>
    );

  return (
    <div className="space-y-4">
      <Link
        to="/app/process/$id"
        params={{ id: task.processId }}
        className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="h-4 w-4" /> Retour au processus
      </Link>


      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-bold uppercase">{task.name}</h1>
          <StatusPill status={task.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
          {[
            ["Zone", task.zone],
            ["Rôle", task.role],
            ["Heure prévue", task.time],
            ["Durée", `${task.duration} min`],
            ["Fréquence", task.frequency],
            ["Priorité", task.priority],
            ["Type", task.type],
            ["Preuve", task.evidenceRequired ? "Obligatoire" : "Facultative"],
          ].map(([l, v]) => (
            <div key={l} className="rounded-xl border border-border bg-secondary/30 px-3 py-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
              <div className="font-semibold">{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-border bg-secondary/20 p-3 text-sm text-foreground/85">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-gold">Instructions</span>
          {task.instructions}
        </div>

        {task.guide && task.guide.length > 0 && (
          <div className="mt-3 rounded-xl border border-border bg-secondary/20 p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-gold">
              <ListOrdered className="h-3.5 w-3.5" /> Étapes détaillées de la tâche
            </div>
            <ol className="space-y-1.5">
              {task.guide.map((g, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground/85">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand/20 text-[10px] font-bold text-brand">
                    {i + 1}
                  </span>
                  {g}
                </li>
              ))}
            </ol>
          </div>
        )}

        {task.videoUrl && (
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-secondary/20">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-[10px] uppercase tracking-widest text-gold">
              <PlayCircle className="h-3.5 w-3.5" /> Vidéo tutorielle — comment exécuter cette tâche
            </div>
            <video src={task.videoUrl} controls preload="metadata" className="aspect-video w-full bg-black" />
          </div>
        )}
      </div>

      {!started ? (
        <Button className="h-14 w-full text-base font-bold uppercase tracking-widest" onClick={() => {
            setStarted(true);
            setRunning(true);
            if (task.status !== "Terminé")
              updateTask(task.id, { status: "En cours", startedAt: new Date().toISOString().slice(0, 16).replace("T", " ") });
          }}>
          <Play className="mr-2 h-5 w-5" /> Commencer la tâche
        </Button>
      ) : (
        <>
          <div className="glass flex items-center gap-4 rounded-2xl p-5">
            <Timer className="h-6 w-6 text-gold" />
            <div className="tabular font-display text-4xl font-bold">
              {mm}:{ss}
            </div>
            <Button variant="outline" className="ml-auto" onClick={() => setRunning((r) => !r)}>
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {running ? "Pause" : "Reprendre"}
            </Button>
          </div>

          <div className="glass space-y-3 rounded-2xl p-5">
            <span className="text-[10px] uppercase tracking-widest text-gold">Saisie — {task.type}</span>

            {task.type === "Checklist" &&
              ["Zone dégagée et accessible", "Matériel conforme", "Nettoyage effectué"].map((c, i) => (
                <label key={c} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 px-3 py-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={checks[i]}
                    onChange={(e) => setChecks((s) => s.map((v, j) => (j === i ? e.target.checked : v)))}
                    className="h-4 w-4 accent-[oklch(0.62_0.23_28)]"
                  />
                  {c}
                </label>
              ))}

            {(task.type === "Oui / Non") && (
              <div className="flex gap-2">
                {["Oui", "Non"].map((o) => (
                  <Button key={o} variant={answer === o ? "default" : "outline"} className="flex-1" onClick={() => setAnswer(o)}>
                    {o}
                  </Button>
                ))}
              </div>
            )}

            {task.type === "Sélection" && (
              <select
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="h-11 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm"
              >
                <option value="">Sélectionner...</option>
                {["Conforme", "Écart mineur", "Écart majeur"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            )}

            {(task.type === "Valeur numérique" || task.type === "Score") && (
              <div>
                <Input
                  type="number"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={task.type === "Score" ? "Score sur 100" : "Valeur mesurée (°C)"}
                  className="h-11 bg-secondary/40"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {task.type === "Score" ? "Alerte si score < 70 %" : "Non conforme si valeur > 5 °C"}
                </p>
              </div>
            )}

            {(task.type === "Commentaire" || task.type === "Anomalie") && (
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Décrivez la situation observée..."
                className="bg-secondary/40"
              />
            )}

            {(task.type === "Photo" || task.type === "Vidéo" || task.evidenceRequired) && (
              <div className="rounded-xl border border-border bg-secondary/20 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-gold" /> Preuve obligatoire — capture in-app uniquement
                </div>
                {task.evidenceId ? (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-success/40 bg-success/10 p-3">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <div className="text-sm">
                      <div className="font-semibold text-success">Preuve validée</div>
                      <div className="text-xs text-muted-foreground">
                        {evidence?.ref} · score IA {evidence?.aiScore}%
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button className="mt-3 h-12 w-full" onClick={() => setCapture(true)}>
                    <Camera className="mr-2 h-4 w-4" /> Prendre une photo
                  </Button>
                )}
              </div>
            )}
          </div>

          <Button
            className="h-14 w-full text-base font-bold uppercase tracking-widest"
            disabled={!canFinish}
            onClick={finish}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" /> Terminer la tâche
          </Button>
          {!canFinish && task.status !== "Terminé" && (
            <p className="text-center text-xs text-muted-foreground">
              Complétez la saisie{task.evidenceRequired ? " et validez la preuve photo" : ""} pour terminer.
            </p>
          )}
        </>
      )}

      <EvidenceCapture
        open={capture}
        onClose={() => setCapture(false)}
        taskName={task.name}
        processId={task.processId}
        restaurantId={user?.restaurantId ?? "r1"}
        userId={user?.id ?? "u1"}
        onValidated={(eid) => {
          updateTask(task.id, { evidenceId: eid });
          setCapture(false);
          toast.success("Preuve validée par l'IA");
        }}
      />
    </div>
  );
}
