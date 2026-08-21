/**
 * Lecteurs de contenus intégrés (vidéo, image avec zoom, document).
 * Le collaborateur consulte tous les médias sans quitter la plateforme.
 */
import { useState } from "react";
import { FileText, Film, Image as ImageIcon, Maximize2, Minus, Plus, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { TCModal } from "./modal";
import type { TrainingMedia } from "@/lib/tc/ops";

const KIND_ICON = {
  video: Film,
  image: ImageIcon,
  document: FileText,
  text: Type,
} as const;

const KIND_LABEL = {
  video: "Vidéo",
  image: "Image",
  document: "Document",
  text: "Contenu",
} as const;

function Viewer({ media, onClose }: { media: TrainingMedia; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  return (
    <TCModal
      title={media.title}
      subtitle={`${KIND_LABEL[media.kind]}${media.fileName ? ` · ${media.fileName}` : ""}`}
      onClose={onClose}
      size="xl"
      footer={
        media.kind === "image" ? (
          <div className="flex items-center justify-center gap-3 text-xs">
            <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} aria-label="Dézoomer" className="rounded-lg border border-border p-1.5">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-14 text-center text-gold">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(4, z + 0.25))} aria-label="Zoomer" className="rounded-lg border border-border p-1.5">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : undefined
      }
    >
      {media.kind === "video" && media.url && (
        <video src={media.url} controls playsInline className="aspect-video w-full rounded-2xl bg-black/70" />
      )}
      {media.kind === "image" && media.url && (
        <div className="max-h-[60vh] overflow-auto rounded-2xl bg-black/30 p-2">
          <img
            src={media.url}
            alt={media.title}
            style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
            className="rounded-xl transition-transform"
          />
        </div>
      )}
      {media.kind === "document" && (
        <div className="space-y-3">
          {media.url ? (
            <iframe title={media.title} src={media.url} className="h-[60vh] w-full rounded-2xl border border-border bg-white" />
          ) : (
            <div className="grid h-64 place-items-center rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
              <div>
                <FileText className="mx-auto mb-2 h-8 w-8 text-gold" />
                Aperçu du document {media.fileType ?? "PDF"} — {media.fileName ?? media.title}
              </div>
            </div>
          )}
        </div>
      )}
      {media.kind === "text" && (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{media.body}</p>
      )}
    </TCModal>
  );
}

/** Grille de médias cliquables (module ou étape). */
export function MediaGrid({
  items,
  title,
  className,
}: {
  items: TrainingMedia[];
  title?: string;
  className?: string;
}) {
  const [open, setOpen] = useState<TrainingMedia | null>(null);
  if (!items?.length) return null;
  return (
    <div className={cn("space-y-2", className)}>
      {title && <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{title}</div>}
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((m) => {
          const Icon = KIND_ICON[m.kind];
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setOpen(m)}
              className="group flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-secondary/30 p-2 text-left transition-colors hover:border-gold/50"
            >
              <span className="relative grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-gradient text-brand-foreground">
                {m.kind === "image" && m.url ? (
                  <img src={m.url} alt={m.title} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{m.title}</span>
                <span className="block truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                  {KIND_LABEL[m.kind]}
                  {m.duration ? ` · ${Math.round(m.duration)}s` : ""}
                  {m.fileType ? ` · ${m.fileType}` : ""}
                </span>
              </span>
              <Maximize2 className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-gold" />
            </button>
          );
        })}
      </div>
      {open && <Viewer media={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
