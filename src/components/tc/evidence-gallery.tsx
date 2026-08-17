import { useEffect, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Copy, Play, ShieldCheck, X, ZoomIn, ZoomOut } from "lucide-react";
import { StatusPill } from "@/components/tc/bits";
import { cn } from "@/lib/utils";
import type { Evidence } from "@/lib/tc/types";

/** Vignette d'une preuve réellement soumise (rendu contextuel par zone). */
export function EvidenceThumb({
  evidence,
  onClick,
  className,
}: {
  evidence: Evidence;
  onClick?: () => void;
  className?: string;
}) {
  const suspicious = evidence.status === "Dupliquée" || evidence.status === "Suspecte";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative aspect-[4/3] w-full overflow-hidden rounded-xl border transition-transform hover:scale-[1.02]",
        suspicious ? "border-danger/60" : "border-border",
        className,
      )}
      style={{ background: evidence.gradient }}
      title={`${evidence.stepName} — ${evidence.time}`}
    >
      {evidence.imageUrl && (
        <img
          src={evidence.imageUrl}
          alt={`Preuve ${evidence.stepName}`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <span className="absolute inset-0 bg-[linear-gradient(transparent_45%,oklch(0_0_0/0.55))]" />
      <span className="absolute left-1.5 top-1.5 rounded-full bg-background/75 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
        {evidence.kind}
      </span>
      {evidence.kind === "Vidéo" && (
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-background/70">
            <Play className="h-4 w-4 text-gold" />
          </span>
        </span>
      )}
      {suspicious && (
        <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-danger text-danger-foreground">
          <AlertTriangle className="h-3 w-3" />
        </span>
      )}
      <span className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between text-[10px] font-semibold text-white">
        <span className="truncate">{evidence.stepName}</span>
        <span className="tabular">{evidence.time}</span>
      </span>
    </button>

  );
}

/** Galerie plein écran : zoom, navigation, méta-données et verdict IA. */
export function EvidenceGallery({
  items,
  index,
  onIndexChange,
  onClose,
  title,
}: {
  items: Evidence[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  title?: string;
}) {
  const [zoom, setZoom] = useState(1);
  const current = items[index];

  useEffect(() => setZoom(1), [index]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange((index + 1) % items.length);
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, onClose, onIndexChange]);

  if (!current) return null;
  const suspicious = current.status === "Dupliquée" || current.status === "Suspecte";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/90 p-3 backdrop-blur-md sm:p-6"
      onClick={onClose}
    >
      <div
        className="glass animate-rise flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-bold uppercase tracking-wide">
              {title ?? current.taskName ?? current.stepName}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {current.ref} · {current.date} {current.time} · {current.zone ?? "—"}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setZoom((z) => Math.max(1, z - 0.25))} className="rounded-lg border border-border p-2">
              <ZoomOut className="h-4 w-4" />
            </button>
            <button onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))} className="rounded-lg border border-border p-2">
              <ZoomIn className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="rounded-lg border border-border p-2">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative h-[42vh] shrink-0 overflow-hidden bg-black/40">
          {current.kind === "Vidéo" && current.videoUrl ? (
            <video
              src={current.videoUrl}
              poster={current.imageUrl}
              controls
              playsInline
              className="h-full w-full bg-black object-contain"
            />
          ) : current.imageUrl ? (
            <img
              src={current.imageUrl}
              alt={`Preuve ${current.stepName}`}
              className="h-full w-full object-cover transition-transform duration-300"
              style={{ transform: `scale(${zoom})` }}
            />
          ) : (
            <div
              className="h-full w-full transition-transform duration-300"
              style={{ background: current.gradient, transform: `scale(${zoom})` }}
            />
          )}
          {current.kind !== "Vidéo" && (
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_55%,oklch(0_0_0/0.5))]" />
          )}

          <span className="absolute left-3 top-3">
            <StatusPill status={current.status} />
          </span>
          <span className="absolute right-3 top-3 rounded-full bg-background/75 px-2 py-1 text-[11px] font-bold text-gold">
            IA {current.aiScore}%
          </span>
          {items.length > 1 && (
            <>
              <button
                onClick={() => onIndexChange((index - 1 + items.length) % items.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/70 p-2"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => onIndexChange((index + 1) % items.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/70 p-2"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-semibold">
                {index + 1} / {items.length}
              </span>
            </>
          )}
        </div>

        <div className="space-y-3 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            {[
              ["Étape", current.stepName],
              ["Type", current.kind],
              ["Heure", current.time],
              ["Empreinte", current.hash.slice(0, 14)],
            ].map(([l, v]) => (
              <div key={l} className="rounded-xl border border-border bg-secondary/30 px-3 py-2">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
                <div className="truncate font-semibold">{v}</div>
              </div>
            ))}
          </div>

          <div
            className={cn(
              "flex items-start gap-3 rounded-xl border px-3 py-3 text-sm",
              suspicious || current.status === "Rejetée"
                ? "border-danger/50 bg-danger/10 text-danger"
                : "border-success/40 bg-success/10 text-success",
            )}
          >
            {suspicious || current.status === "Rejetée" ? (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <div>
              <div className="font-semibold">
                {suspicious
                  ? `Anti-fraude IA — similarité ${current.similarity ?? 0} %`
                  : current.status === "Rejetée"
                    ? "Preuve rejetée par l'IA"
                    : "Preuve validée par l'IA"}
              </div>
              <p className="text-xs opacity-90">
                {current.note ?? "Aucune anomalie détectée : cadrage, horodatage et empreinte cohérents."}
              </p>
              {current.previousEvidenceId && (
                <p className="mt-1 flex items-center gap-1 text-[11px] opacity-80">
                  <Copy className="h-3 w-3" /> Comparée à la preuve {current.previousEvidenceId}
                </p>
              )}
            </div>
          </div>

          {items.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {items.map((e, i) => (
                <button
                  key={e.id}
                  onClick={() => onIndexChange(i)}
                  className={cn(
                    "h-14 w-20 shrink-0 rounded-lg border",
                    i === index ? "border-gold" : "border-border opacity-70",
                  )}
                  style={{ background: e.gradient }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
