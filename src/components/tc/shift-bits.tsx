import { Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShiftPhase } from "@/lib/tc/store";

const PHASE_TONE: Record<ShiftPhase, string> = {
  "En cours": "border-gold/60 bg-gold/15 text-gold",
  "À venir": "border-brand/50 bg-brand/10 text-foreground",
  Terminé: "border-border bg-secondary/50 text-muted-foreground",
  Désactivé: "border-destructive/40 bg-destructive/10 text-destructive",
};

/** Indicateur d'état d'un shift : en cours, à venir, terminé, désactivé. */
export function ShiftPhasePill({ phase, className }: { phase: ShiftPhase; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        PHASE_TONE[phase],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full bg-current", phase === "En cours" && "animate-pulse")} />
      {phase === "En cours" ? "En cours" : phase}
    </span>
  );
}

/** Badge compact « Shift — horaire » utilisé dans les listes, calendriers et historiques. */
export function ShiftBadge({
  name,
  time,
  className,
}: {
  name: string;
  time?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 truncate rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold",
        className,
      )}
    >
      <Clock3 className="h-3 w-3 shrink-0" />
      <span className="truncate">
        {name}
        {time ? ` · ${time}` : ""}
      </span>
    </span>
  );
}
