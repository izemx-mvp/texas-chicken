import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, RefreshCw, ScanLine, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addEvidence, getState, uid } from "@/lib/tc/store";
import type { Evidence } from "@/lib/tc/types";

type Phase = "viewfinder" | "captured" | "analyzing" | "valid" | "duplicate";

const STAGES = [
  "Analyse de la preuve...",
  "Extraction de la signature visuelle...",
  "Comparaison avec les preuves historiques...",
  "Validation IA...",
];

const FRAMES = [
  "from-amber-500/70 via-orange-700/60 to-neutral-900",
  "from-lime-500/50 via-emerald-800/60 to-neutral-900",
  "from-sky-500/50 via-indigo-800/60 to-neutral-900",
  "from-rose-500/60 via-red-800/60 to-neutral-900",
];

export function EvidenceCapture({
  open,
  onClose,
  taskName,
  processId,
  restaurantId,
  userId,
  onValidated,
}: {
  open: boolean;
  onClose: () => void;
  taskName: string;
  processId: string;
  restaurantId: string;
  userId: string;
  onValidated: (evidenceId: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>("viewfinder");
  const [stage, setStage] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [frame, setFrame] = useState(FRAMES[0]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (open) {
      setPhase("viewfinder");
      setStage(0);
      setAttempts(0);
    }
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [open]);

  if (!open) return null;

  const capture = () => {
    const n = attempts + 1;
    setAttempts(n);
    setFrame(FRAMES[n % FRAMES.length]);
    setPhase("analyzing");
    setStage(0);
    STAGES.forEach((_, i) => {
      timers.current.push(setTimeout(() => setStage(i), i * 750));
    });
    timers.current.push(
      setTimeout(() => {
        // Anti-fraude : la première capture correspond à une empreinte déjà connue.
        const hash = n === 1 ? getState().evidence[0]?.hash ?? "sha1:known" : `sha1:${uid("")}`;
        const isDuplicate = n === 1 || getState().usedPhotoHashes.includes(hash);
        if (isDuplicate) {
          setPhase("duplicate");
        } else {
          const ev: Evidence = {
            id: uid("e"),
            ref: `EVD-${Math.floor(Math.random() * 9000) + 1000}`,
            kind: "Photo",
            restaurantId,
            userId,
            processId,
            stepName: taskName,
            date: new Date().toISOString().slice(0, 10),
            time: new Date().toTimeString().slice(0, 5),
            aiScore: 92 + Math.floor(Math.random() * 8),
            hash,
            status: "Valide",
            gradient: "from-amber-500/70 to-red-700/70",
          };
          addEvidence(ev);
          setPhase("valid");
          timers.current.push(setTimeout(() => onValidated(ev.id), 1100));
        }
      }, STAGES.length * 750 + 400),
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6">
      <div className="glass animate-rise relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-gold" />
            <span className="font-display text-sm font-bold uppercase tracking-widest">Preuve photo</span>
          </div>
          <button onClick={onClose} aria-label="Fermer">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4">
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">{taskName}</p>

          <div className={cn("relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br", frame)}>
            <div className="grid-lines absolute inset-0 opacity-30" />
            {/* viewfinder corners */}
            <div className="absolute inset-4 rounded-xl border border-white/40 [clip-path:polygon(0_0,22%_0,22%_2%,2%_2%,2%_22%,0_22%,0_78%,2%_78%,2%_98%,22%_98%,22%_100%,0_100%,100%_100%,100%_78%,98%_78%,98%_98%,78%_98%,78%_100%,100%_100%,100%_0,78%_0,78%_2%,98%_2%,98%_22%,100%_22%)]" />

            {phase === "viewfinder" && (
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <div className="mx-auto mb-2 h-10 w-10 animate-pulse rounded-full border-2 border-white/60" />
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
                    Caméra application
                  </p>
                  <p className="mt-1 text-[10px] text-white/60">Import galerie désactivé — capture en direct obligatoire</p>
                </div>
              </div>
            )}

            {phase === "analyzing" && (
              <>
                <div className="animate-scan absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-[oklch(0.86_0.17_82_/_45%)] to-transparent" />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="rounded-2xl bg-black/50 px-4 py-3 text-center backdrop-blur-md">
                    <ScanLine className="mx-auto mb-2 h-6 w-6 animate-pulse text-gold" />
                    <p className="text-sm font-semibold text-white">{STAGES[stage]}</p>
                    <div className="mt-2 flex justify-center gap-1">
                      {STAGES.map((_, i) => (
                        <span
                          key={i}
                          className={cn(
                            "h-1 w-8 rounded-full transition-colors",
                            i <= stage ? "bg-gold" : "bg-white/25",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {phase === "valid" && (
              <div className="absolute inset-0 grid place-items-center bg-success/20 backdrop-blur-[2px]">
                <div className="animate-rise text-center">
                  <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
                  <p className="mt-2 font-display text-xl font-bold uppercase text-white">Preuve validée</p>
                </div>
              </div>
            )}

            {phase === "duplicate" && (
              <div className="absolute inset-0 grid place-items-center bg-destructive/25 backdrop-blur-[2px]">
                <div className="animate-rise text-center">
                  <ShieldAlert className="mx-auto h-14 w-14 text-destructive" />
                  <p className="mt-2 font-display text-xl font-bold uppercase text-white">Photo déjà utilisée</p>
                </div>
              </div>
            )}
          </div>

          {phase === "duplicate" && (
            <div className="mt-4 flex gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <p className="text-xs text-foreground/90">
                Cette photo semble avoir déjà été utilisée comme preuve pour une autre tâche ou une précédente
                vérification. Veuillez prendre une nouvelle photo.
              </p>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            {phase === "viewfinder" && (
              <Button className="h-12 w-full" onClick={capture}>
                <Camera className="mr-2 h-4 w-4" /> Prendre une photo
              </Button>
            )}
            {phase === "analyzing" && (
              <Button className="h-12 w-full" disabled>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Analyse IA en cours...
              </Button>
            )}
            {phase === "duplicate" && (
              <Button variant="destructive" className="h-12 w-full" onClick={capture}>
                <Camera className="mr-2 h-4 w-4" /> Prendre une nouvelle photo
              </Button>
            )}
            {phase === "valid" && (
              <Button className="h-12 w-full" disabled>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Preuve enregistrée
              </Button>
            )}
          </div>
          <p className="mt-2 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Anti-fraude IA active — comparaison avec {getState().evidence.length} preuves historiques
          </p>
        </div>
      </div>
    </div>
  );
}
