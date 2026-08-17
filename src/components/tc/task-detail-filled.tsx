import { useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  ListOrdered,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
  Timer,
  XCircle,
} from "lucide-react";
import { StatusPill } from "./bits";
import { EvidenceGallery, EvidenceThumb } from "./evidence-gallery";
import { cn } from "@/lib/utils";
import type { ExecutionDetail } from "@/lib/tc/store";

/**
 * Détail complet d'une tâche, présenté exactement comme l'écran d'exécution
 * du manager, mais avec tous les champs déjà renseignés par ce qui a été
 * réellement saisi sur le terrain (checklist cochée, valeurs, preuves, IA).
 */
export function TaskDetailFilled({ exec, className }: { exec: ExecutionDetail; className?: string }) {
  const [gallery, setGallery] = useState<number | null>(null);
  const task = exec.task;
  const done = exec.status === "Terminé";
  const future = exec.status === "À faire" && !exec.completedAt;

  const meta: [string, string][] = [
    ["Zone", task.zone],
    ["Rôle", task.role],
    ["Heure prévue", task.time],
    ["Durée", `${task.duration} min`],
    ["Fréquence", task.frequency],
    ["Priorité", task.priority],
    ["Type", task.type],
    ["Preuve", task.evidenceRequired ? "Obligatoire" : "Facultative"],
  ];

  return (
    <div className={cn("space-y-3", className)}>
      {/* identité de la tâche */}
      <div className="rounded-2xl border border-border bg-secondary/25 p-4">
        {exec.process && (
          <div className="mb-1.5 text-[10px] uppercase tracking-widest text-gold">
            Processus {exec.process.name}
            {(() => {
              const i = exec.process!.steps.findIndex((s) => s.id === task.stepId);
              return i >= 0 ? ` — étape ${i + 1}/${exec.process!.steps.length}` : "";
            })()}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-lg font-bold uppercase">{task.name}</h3>
          <StatusPill status={exec.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>


        <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          {meta.map(([l, v]) => (
            <div key={l} className="rounded-xl border border-border bg-background/40 px-3 py-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
              <div className="font-semibold">{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-border bg-background/40 p-3 text-sm text-foreground/85">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-gold">Instructions</span>
          {task.instructions}
        </div>

        {task.guide && task.guide.length > 0 && (
          <div className="mt-3 rounded-xl border border-border bg-background/40 p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-gold">
              <ListOrdered className="h-3.5 w-3.5" /> Consignes détaillées de l'étape
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
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-background/40">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-[10px] uppercase tracking-widest text-gold">
              <PlayCircle className="h-3.5 w-3.5" /> Vidéo tutorielle — comment exécuter cette tâche
            </div>
            <video src={task.videoUrl} controls preload="metadata" className="aspect-video w-full bg-black" />
          </div>
        )}
      </div>

      {/* chronomètre réel */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-secondary/25 p-4">
        <Timer className="h-6 w-6 text-gold" />
        <div className="tabular font-display text-3xl font-bold">
          {String(Math.floor(exec.duration)).padStart(2, "0")}:00
        </div>
        <div className="text-xs text-muted-foreground">
          <div>
            Démarrée à <span className="font-semibold text-foreground">{exec.startedAt}</span>
            {exec.completedAt && (
              <>
                {" "}
                · terminée à <span className="font-semibold text-foreground">{exec.completedAt}</span>
              </>
            )}
          </div>
          <div>
            {exec.kpi.done}/{exec.kpi.steps} points de contrôle validés · conformité {exec.compliance} %
          </div>
        </div>
        {done && (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-success/50 bg-success/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-success">
            <CheckCircle2 className="h-3.5 w-3.5" /> Étape terminée
          </span>
        )}
      </div>

      {/* saisie réellement enregistrée */}
      <div className="space-y-2 rounded-2xl border border-border bg-secondary/25 p-4">
        <span className="text-[10px] uppercase tracking-widest text-gold">Points de contrôle saisis — {task.type}</span>
        {exec.steps.map((st) => {
          const ok = st.status === "Validée";
          const ko = st.status === "Non conforme";
          return (
            <div
              key={st.index}
              className={cn(
                "rounded-xl border bg-background/40 px-3 py-2.5 text-sm",
                ok ? "border-success/40" : ko ? "border-destructive/50" : "border-border opacity-70",
              )}
            >
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5">
                  {ok ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : ko ? (
                    <XCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <span className="block h-4 w-4 rounded border border-border" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2">
                    <span className="font-semibold">
                      {st.index}. {st.name}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" /> {st.time}
                    </span>
                  </div>
                  {st.question && <p className="text-[11px] text-muted-foreground">{st.question}</p>}
                  {st.answer !== undefined ? (
                    <p className="mt-0.5 text-[11px]">
                      <span className="text-muted-foreground">Réponse saisie : </span>
                      <span className="font-semibold">{String(st.answer)}</span>
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Aucune saisie enregistrée.</p>
                  )}
                  {st.comment && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Commentaire : {st.comment}</p>
                  )}
                  {st.ai && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      IA ({st.aiScore ?? 0} %) : {st.ai}
                    </p>
                  )}
                  {st.fraud && (
                    <p className="mt-1 flex items-start gap-1.5 text-[11px] font-semibold text-destructive">
                      <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Fraude détectée — preuve dupliquée ou suspecte.
                    </p>
                  )}
                  {st.rejected && !st.fraud && (
                    <p className="mt-1 flex items-start gap-1.5 text-[11px] text-destructive">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Preuve rejetée par l'IA{st.replacement ? " — nouvelle preuve conforme soumise." : "."}
                    </p>
                  )}
                </div>
                {(st.evidence || st.replacement) && (
                  <div className="hidden w-24 shrink-0 sm:block">
                    <EvidenceThumb
                      evidence={(st.replacement ?? st.evidence)!}
                      onClick={() => {
                        const idx = exec.evidences.findIndex((e) => e.id === (st.replacement ?? st.evidence)!.id);
                        setGallery(idx >= 0 ? idx : 0);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* preuves */}
      <div className="rounded-2xl border border-border bg-secondary/25 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-gold" />
          Preuve {task.evidenceRequired ? "obligatoire" : "facultative"} — capture in-app uniquement
        </div>
        {exec.evidences.length > 0 ? (
          <>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {exec.evidences.map((e, i) => (
                <EvidenceThumb key={e.id} evidence={e} onClick={() => setGallery(i)} />
              ))}
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Camera className="h-3.5 w-3.5" /> {exec.kpi.proofs} preuve(s) soumise(s)
              </span>
              <span className="inline-flex items-center gap-1 text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> {exec.kpi.validated} validée(s)
              </span>
              {exec.kpi.rejected > 0 && (
                <span className="inline-flex items-center gap-1 text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5" /> {exec.kpi.rejected} rejetée(s)
                </span>
              )}
              {exec.kpi.fraud > 0 && (
                <span className="inline-flex items-center gap-1 text-destructive">
                  <ShieldAlert className="h-3.5 w-3.5" /> {exec.kpi.fraud} suspicion(s) de fraude
                </span>
              )}
            </p>
          </>
        ) : (
          <p className="mt-2 text-[11px] text-muted-foreground">
            {future ? "Aucune preuve — étape planifiée." : "Aucune preuve enregistrée pour cette étape."}
          </p>
        )}
      </div>

      {gallery !== null && exec.evidences.length > 0 && (
        <EvidenceGallery
          items={exec.evidences}
          index={gallery}
          onIndexChange={setGallery}
          onClose={() => setGallery(null)}
          title={task.name}
        />
      )}
    </div>
  );
}
