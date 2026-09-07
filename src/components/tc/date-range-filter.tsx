/**
 * Filtre de période (date de début / date de fin) partagé par les tableaux de
 * commandes (interface Fournisseurs et historique d'une fiche fournisseur).
 * Même langage visuel que le filtre de jour : pastilles bordées, icône dorée.
 */
import { CalendarDays, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function DateRangeFilter({
  from,
  to,
  onFrom,
  onTo,
  onReset,
  info,
  className,
}: {
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onReset: () => void;
  info?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <CalendarDays className="h-4 w-4 text-gold" /> Période
      </span>

      <label className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-2.5 py-1.5 text-xs font-semibold">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Du</span>
        <input
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => onFrom(e.target.value)}
          className="bg-transparent outline-none"
          aria-label="Date de début"
        />
      </label>

      <label className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-2.5 py-1.5 text-xs font-semibold">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Au</span>
        <input
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => onTo(e.target.value)}
          className="bg-transparent outline-none"
          aria-label="Date de fin"
        />
      </label>

      {(from || to) && (
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 rounded-xl border border-gold/50 bg-gold/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gold"
        >
          <X className="h-3.5 w-3.5" /> Réinitialiser
        </button>
      )}

      {info && <span className="ml-auto text-[11px] text-muted-foreground">{info}</span>}
    </div>
  );
}
