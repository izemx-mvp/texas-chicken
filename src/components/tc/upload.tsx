/**
 * Zones d'upload premium (glisser-déposer) pour les médias de formation :
 * image de couverture, vidéo, documents PDF. Les fichiers sont conservés en
 * mémoire via des URL locales (mock, aucune persistance serveur).
 */
import { useRef, useState, type ReactNode } from "react";
import { FileText, Film, ImageIcon, Trash2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

function useDrop(onFiles: (files: File[]) => void) {
  const [over, setOver] = useState(false);
  return {
    over,
    handlers: {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        setOver(true);
      },
      onDragLeave: () => setOver(false),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        setOver(false);
        onFiles(Array.from(e.dataTransfer.files));
      },
    },
  };
}

function Zone({
  over,
  handlers,
  onPick,
  icon,
  label,
  hint,
  children,
}: {
  over: boolean;
  handlers: Record<string, unknown>;
  onPick: () => void;
  icon: ReactNode;
  label: string;
  hint: string;
  children?: ReactNode;
}) {
  return (
    <div
      {...handlers}
      onClick={onPick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onPick()}
      className={cn(
        "cursor-pointer rounded-2xl border border-dashed p-4 text-center transition-colors",
        over ? "border-gold bg-gold/10" : "border-border hover:border-gold/50 hover:bg-secondary/40",
      )}
    >
      {children ?? (
        <div className="flex flex-col items-center gap-1 py-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-brand-foreground">
            {icon}
          </span>
          <span className="text-xs font-semibold">{label}</span>
          <span className="text-[10px] text-muted-foreground">{hint}</span>
        </div>
      )}
    </div>
  );
}

/** Upload d'une image (couverture / illustration d'étape). */
export function ImageUpload({
  value,
  onChange,
  label = "Déposer une image de couverture",
  hint = "JPG ou PNG — 1280×720 recommandé",
}: {
  value?: string;
  onChange: (url: string | undefined) => void;
  label?: string;
  hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const take = (files: File[]) => {
    const f = files.find((x) => x.type.startsWith("image/"));
    if (f) onChange(URL.createObjectURL(f));
  };
  const { over, handlers } = useDrop(take);
  return (
    <div className="space-y-2">
      <Zone
        over={over}
        handlers={handlers}
        onPick={() => input.current?.click()}
        icon={<ImageIcon className="h-5 w-5" />}
        label={label}
        hint={hint}
      >
        {value ? (
          <img
            src={value}
            alt="Couverture"
            loading="lazy"
            className="h-32 w-full rounded-xl object-cover"
          />
        ) : undefined}
      </Zone>
      {value && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" /> Retirer l'image
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => take(Array.from(e.target.files ?? []))}
      />
    </div>
  );
}

/** Upload d'une vidéo (ou saisie d'une URL). */
export function VideoUpload({
  value,
  onChange,
}: {
  value?: string;
  onChange: (url: string | undefined) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const take = (files: File[]) => {
    const f = files.find((x) => x.type.startsWith("video/"));
    if (f) onChange(URL.createObjectURL(f));
  };
  const { over, handlers } = useDrop(take);
  return (
    <div className="space-y-2">
      <Zone
        over={over}
        handlers={handlers}
        onPick={() => input.current?.click()}
        icon={<Film className="h-5 w-5" />}
        label="Déposer une vidéo de démonstration"
        hint="MP4 — 60 à 240 secondes"
      >
        {value ? (
          <video src={value} controls className="aspect-video w-full rounded-xl bg-black/60 object-cover" />
        ) : undefined}
      </Zone>
      {value && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" /> Retirer la vidéo
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="video/*"
        hidden
        onChange={(e) => take(Array.from(e.target.files ?? []))}
      />
    </div>
  );
}

export interface UploadedDoc {
  name: string;
  type: string;
  url?: string;
}

/** Upload de documents (PDF, fiches techniques). */
export function DocumentUpload({
  value,
  onChange,
}: {
  value: UploadedDoc[];
  onChange: (docs: UploadedDoc[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const take = (files: File[]) => {
    if (!files.length) return;
    onChange([
      ...value,
      ...files.map((f) => ({
        name: f.name,
        type: (f.name.split(".").pop() ?? "PDF").toUpperCase(),
        url: URL.createObjectURL(f),
      })),
    ]);
  };
  const { over, handlers } = useDrop(take);
  return (
    <div className="space-y-2">
      <Zone
        over={over}
        handlers={handlers}
        onPick={() => input.current?.click()}
        icon={<UploadCloud className="h-5 w-5" />}
        label="Déposer des documents"
        hint="PDF, fiches techniques, checklists"
      />
      {value.length > 0 && (
        <div className="grid gap-1.5 sm:grid-cols-2">
          {value.map((d, i) => (
            <div key={`${d.name}-${i}`} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs">
              <FileText className="h-4 w-4 shrink-0 text-gold" />
              <span className="min-w-0 flex-1 truncate">{d.name}</span>
              <span className="text-[10px] text-muted-foreground">{d.type}</span>
              <button
                type="button"
                aria-label="Supprimer le document"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <input ref={input} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" multiple hidden onChange={(e) => take(Array.from(e.target.files ?? []))} />
    </div>
  );
}
