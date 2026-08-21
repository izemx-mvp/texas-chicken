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

/* ===================== Uploader de contenus pédagogiques ===================== */

import type { TrainingMedia, TrainingMediaKind } from "@/lib/tc/ops";

const humanSize = (b?: number) => (b ? `${(b / 1024 / 1024).toFixed(1)} Mo` : "—");

const mid = () => `md${Math.random().toString(36).slice(2, 9)}`;

/** Lit la durée d'une vidéo locale pour l'afficher dans la fiche média. */
function probeDuration(url: string, cb: (d: number) => void) {
  const v = document.createElement("video");
  v.preload = "metadata";
  v.onloadedmetadata = () => cb(Math.round(v.duration));
  v.src = url;
}

/**
 * Bibliothèque de contenus d'un module ou d'une étape : vidéos, images,
 * documents et blocs de texte. Les médias sont TOUJOURS importés depuis
 * l'appareil — aucun champ URL n'est proposé.
 */
export function MediaUploader({
  value,
  onChange,
  title = "Contenu",
  hint,
}: {
  value: TrainingMedia[];
  onChange: (items: TrainingMedia[]) => void;
  title?: string;
  hint?: string;
}) {
  const items = value ?? [];
  const videoRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [over, setOver] = useState(false);

  const kindOf = (f: File): TrainingMediaKind =>
    f.type.startsWith("video/") ? "video" : f.type.startsWith("image/") ? "image" : "document";

  const simulate = (id: string) => {
    setProgress((p) => ({ ...p, [id]: 8 }));
    const t = setInterval(() => {
      setProgress((p) => {
        const n = Math.min(100, (p[id] ?? 0) + 18);
        if (n >= 100) {
          clearInterval(t);
          const { [id]: _drop, ...rest } = p;
          return rest;
        }
        return { ...p, [id]: n };
      });
    }, 160);
  };

  const build = (f: File, id = mid()): TrainingMedia => {
    const url = URL.createObjectURL(f);
    const kind = kindOf(f);
    if (kind === "video") probeDuration(url, (d) => onChange(current.current.map((x) => (x.id === id ? { ...x, duration: d } : x))));
    return {
      id,
      kind,
      title: f.name.replace(/\.[^.]+$/, ""),
      url,
      fileName: f.name,
      fileType: (f.name.split(".").pop() ?? "FILE").toUpperCase(),
      size: f.size,
    };
  };

  // référence toujours à jour pour les callbacks asynchrones (durée vidéo)
  const current = useRef(items);
  current.current = items;

  const add = (files: File[]) => {
    if (!files.length) return;
    if (replaceId) {
      const f = files[0]!;
      const next = items.map((x) => (x.id === replaceId ? { ...build(f, replaceId), title: x.title } : x));
      simulate(replaceId);
      setReplaceId(null);
      onChange(next);
      return;
    }
    const created = files.map((f) => build(f));
    created.forEach((c) => simulate(c.id));
    onChange([...items, ...created]);
  };

  const pick = (ref: React.RefObject<HTMLInputElement | null>, id?: string) => {
    setReplaceId(id ?? null);
    ref.current?.click();
  };

  const patch = (id: string, p: Partial<TrainingMedia>) =>
    onChange(items.map((x) => (x.id === id ? { ...x, ...p } : x)));

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-secondary/20 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto text-[10px] uppercase tracking-widest text-muted-foreground">{title}</span>
        <button type="button" onClick={() => pick(videoRef)} className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] hover:border-gold/60 hover:text-gold">
          <Film className="h-3.5 w-3.5" /> Ajouter une vidéo
        </button>
        <button type="button" onClick={() => pick(docRef)} className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] hover:border-gold/60 hover:text-gold">
          <FileText className="h-3.5 w-3.5" /> Ajouter un document
        </button>
        <button type="button" onClick={() => pick(imageRef)} className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] hover:border-gold/60 hover:text-gold">
          <ImageIcon className="h-3.5 w-3.5" /> Ajouter une image
        </button>
        <button
          type="button"
          onClick={() => onChange([...items, { id: mid(), kind: "text", title: "Contenu texte", body: "" }])}
          className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] hover:border-gold/60 hover:text-gold"
        >
          <UploadCloud className="h-3.5 w-3.5" /> Ajouter du contenu
        </button>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          add(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "rounded-xl border border-dashed p-3 text-center text-[11px] transition-colors",
          over ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground",
        )}
      >
        Glisser-déposer vos vidéos, images ou documents ici {hint ? `— ${hint}` : ""}
      </div>

      <div className="space-y-2">
        {items.map((m) => (
          <div key={m.id} className="rounded-xl border border-border bg-background/30 p-2">
            <div className="flex items-start gap-2">
              <span className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-gradient text-brand-foreground">
                {m.kind === "image" && m.url ? (
                  <img src={m.url} alt={m.title} className="h-full w-full object-cover" />
                ) : m.kind === "video" ? (
                  <Film className="h-4 w-4" />
                ) : m.kind === "document" ? (
                  <FileText className="h-4 w-4" />
                ) : (
                  <UploadCloud className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <input
                  value={m.title}
                  onChange={(e) => patch(m.id, { title: e.target.value })}
                  className="w-full rounded-lg border border-border bg-secondary/40 px-2 py-1 text-xs outline-none"
                />
                {m.kind === "text" ? (
                  <textarea
                    value={m.body ?? ""}
                    onChange={(e) => patch(m.id, { body: e.target.value })}
                    rows={3}
                    placeholder="Instructions, consignes, points clés…"
                    className="w-full rounded-lg border border-border bg-secondary/40 px-2 py-1 text-xs outline-none"
                  />
                ) : (
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {m.fileType ?? "FICHIER"} · {humanSize(m.size)}
                    {m.duration ? ` · ${m.duration}s` : ""} ·{" "}
                    <span className={progress[m.id] ? "text-gold" : "text-success"}>
                      {progress[m.id] ? `Upload ${progress[m.id]}%` : "Importé"}
                    </span>
                  </div>
                )}
                {progress[m.id] !== undefined && (
                  <div className="h-1 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-brand-gradient transition-all" style={{ width: `${progress[m.id]}%` }} />
                  </div>
                )}
                {m.kind === "video" && m.url && (
                  <video src={m.url} controls className="mt-1 aspect-video w-full max-w-xs rounded-lg bg-black/60" />
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                {m.kind !== "text" && (
                  <button
                    type="button"
                    onClick={() => pick(m.kind === "video" ? videoRef : m.kind === "image" ? imageRef : docRef, m.id)}
                    className="rounded-lg border border-border px-2 py-1 text-[10px] uppercase tracking-widest hover:border-gold/60 hover:text-gold"
                  >
                    Remplacer
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Supprimer le contenu"
                  onClick={() => onChange(items.filter((x) => x.id !== m.id))}
                  className="rounded-lg border border-border px-2 py-1 text-muted-foreground hover:border-destructive/60 hover:text-destructive"
                >
                  <Trash2 className="mx-auto h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="py-3 text-center text-[11px] text-muted-foreground">Aucun contenu pour l'instant.</p>
        )}
      </div>

      <input ref={videoRef} type="file" accept="video/*" multiple hidden onChange={(e) => add(Array.from(e.target.files ?? []))} />
      <input ref={imageRef} type="file" accept="image/*" multiple hidden onChange={(e) => add(Array.from(e.target.files ?? []))} />
      <input
        ref={docRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
        multiple
        hidden
        onChange={(e) => add(Array.from(e.target.files ?? []))}
      />
    </div>
  );
}

/** Photo (groupe, utilisateur…) : import de fichier uniquement, avec aperçu. */
export function PhotoUpload({
  value,
  onChange,
  label = "Photo",
  hint = "JPG ou PNG — 512×512 minimum",
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
    <div className="flex items-center gap-3">
      <div
        {...handlers}
        onClick={() => input.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && input.current?.click()}
        className={cn(
          "grid h-24 w-24 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed transition-colors",
          over ? "border-gold bg-gold/10" : "border-border hover:border-gold/50",
        )}
      >
        {value ? (
          <img src={value} alt={label} className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 space-y-1.5">
        <div className="text-xs font-semibold">{label}</div>
        <div className="text-[10px] text-muted-foreground">Glisser-déposer une image ou importer un fichier — {hint}</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="rounded-full border border-border px-3 py-1 text-[11px] hover:border-gold/60 hover:text-gold"
          >
            {value ? "Remplacer" : "Importer une image"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground hover:border-destructive/60 hover:text-destructive"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => take(Array.from(e.target.files ?? []))} />
    </div>
  );
}
