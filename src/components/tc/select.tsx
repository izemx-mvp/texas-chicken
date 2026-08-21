/**
 * Système de dropdown premium Texas Chicken.
 * - TCSelect : sélection simple, recherche, options riches (icône, description, badge).
 * - TCMultiSelect : sélection multiple avec chips, select all / clear all, compteur.
 * Rendu en portal (jamais coupé par une card), animations d'ouverture/fermeture,
 * support light & dark via les tokens du design system.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TCOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  hint?: string;
  /** Pastille / dégradé affiché à gauche. */
  swatch?: string;
  icon?: ReactNode;
  group?: string;
  disabled?: boolean;
}

function useAnchoredPanel(open: boolean) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; drop: "down" | "up" } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const compute = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const below = window.innerHeight - r.bottom;
      const drop: "down" | "up" = below < 280 && r.top > below ? "up" : "down";
      setRect({
        top: drop === "down" ? r.bottom + 6 : r.top - 6,
        left: Math.min(r.left, window.innerWidth - r.width - 8),
        width: r.width,
        drop,
      });
    };
    compute();
    window.addEventListener("scroll", compute, true);
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute, true);
      window.removeEventListener("resize", compute);
    };
  }, [open]);

  return { anchorRef, rect };
}

function Panel({
  rect,
  onClose,
  children,
}: {
  rect: { top: number; left: number; width: number; drop: "down" | "up" } | null;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    // différé pour ne pas capter le clic d'ouverture
    const t = setTimeout(() => document.addEventListener("mousedown", onDown), 0);
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!rect || typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={ref}
      style={{
        top: rect.drop === "down" ? rect.top : undefined,
        bottom: rect.drop === "up" ? window.innerHeight - rect.top : undefined,
        left: rect.left,
        minWidth: Math.max(rect.width, 240),
        maxWidth: Math.max(rect.width, 380),
      }}
      className="animate-rise fixed z-[120] overflow-hidden rounded-2xl border border-border bg-popover/95 shadow-2xl shadow-black/30 backdrop-blur-xl"
    >
      {children}
    </div>,
    document.body,
  );
}

function OptionRow({
  o,
  selected,
  onClick,
  multi,
}: {
  o: TCOption;
  selected: boolean;
  onClick: () => void;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={o.disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors",
        selected ? "bg-brand/15 text-foreground" : "text-foreground/85 hover:bg-secondary/70",
        o.disabled && "pointer-events-none opacity-40",
      )}
    >
      {multi && (
        <span
          className={cn(
            "grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors",
            selected ? "border-brand bg-brand text-brand-foreground" : "border-border",
          )}
        >
          {selected && <Check className="h-3 w-3" />}
        </span>
      )}
      {o.swatch && <span className="h-7 w-7 shrink-0 rounded-lg" style={{ background: o.swatch }} />}
      {o.icon && <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-secondary/70 text-gold">{o.icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-medium">{o.label}</span>
          {o.badge && (
            <span className="shrink-0 rounded-full border border-gold/40 bg-gold/10 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-gold">
              {o.badge}
            </span>
          )}
        </span>
        {o.description && <span className="block truncate text-[11px] text-muted-foreground">{o.description}</span>}
      </span>
      {o.hint && <span className="shrink-0 text-[10px] uppercase tracking-widest text-muted-foreground">{o.hint}</span>}
      {!multi && selected && <Check className="h-4 w-4 shrink-0 text-gold" />}
    </button>
  );
}

function groupOptions(options: TCOption[]) {
  const map = new Map<string, TCOption[]>();
  options.forEach((o) => {
    const k = o.group ?? "";
    map.set(k, [...(map.get(k) ?? []), o]);
  });
  return Array.from(map.entries());
}

const triggerClass =
  "flex h-10 w-full items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 text-left text-sm transition-colors hover:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/30";

export function TCSelect({
  value,
  onChange,
  options,
  placeholder = "Sélectionner…",
  searchable,
  className,
  disabled,
  clearable,
  ariaLabel,
}: {
  value: string | null | undefined;
  onChange: (v: string) => void;
  options: TCOption[];
  placeholder?: string;
  searchable?: boolean;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { anchorRef, rect } = useAnchoredPanel(open);
  const selected = options.find((o) => o.value === value) ?? null;
  const showSearch = searchable ?? options.length > 8;

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return options;
    return options.filter((o) => `${o.label} ${o.description ?? ""} ${o.group ?? ""}`.toLowerCase().includes(t));
  }, [q, options]);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => {
          setQ("");
          setOpen((o) => !o);
        }}
        className={cn(triggerClass, open && "border-gold/60 ring-2 ring-gold/20", disabled && "opacity-50", className)}
      >
        {selected?.swatch && <span className="h-5 w-5 shrink-0 rounded-md" style={{ background: selected.swatch }} />}
        {selected?.icon && <span className="shrink-0 text-gold">{selected.icon}</span>}
        <span className={cn("min-w-0 flex-1 truncate", !selected && "text-muted-foreground")}>
          {selected?.label ?? placeholder}
        </span>
        {clearable && selected && (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="grid h-5 w-5 place-items-center rounded-md text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180 text-gold")} />
      </button>

      {open && (
        <Panel rect={rect} onClose={() => setOpen(false)}>
          {showSearch && (
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher…"
                className="h-6 w-full bg-transparent text-sm outline-none"
              />
            </div>
          )}
          <div className="max-h-72 space-y-0.5 overflow-y-auto p-1.5">
            {groupOptions(filtered).map(([g, list]) => (
              <div key={g}>
                {g && (
                  <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{g}</div>
                )}
                {list.map((o) => (
                  <OptionRow
                    key={o.value}
                    o={o}
                    selected={o.value === value}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                  />
                ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">Aucun résultat</p>
            )}
          </div>
        </Panel>
      )}
    </>
  );
}

export function TCMultiSelect({
  values,
  onChange,
  options,
  placeholder = "Sélectionner…",
  className,
  maxChips = 3,
  ariaLabel,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  options: TCOption[];
  placeholder?: string;
  className?: string;
  maxChips?: number;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { anchorRef, rect } = useAnchoredPanel(open);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return options;
    return options.filter((o) => `${o.label} ${o.description ?? ""} ${o.group ?? ""}`.toLowerCase().includes(t));
  }, [q, options]);

  const selectedOptions = options.filter((o) => values.includes(o.value));
  const toggle = (v: string) =>
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        aria-label={ariaLabel}
        onClick={() => {
          setQ("");
          setOpen((o) => !o);
        }}
        className={cn(
          "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-xl border border-border bg-secondary/40 px-2.5 py-1.5 text-left text-sm transition-colors hover:border-gold/50",
          open && "border-gold/60 ring-2 ring-gold/20",
          className,
        )}
      >
        {selectedOptions.length === 0 && <span className="px-0.5 text-muted-foreground">{placeholder}</span>}
        {selectedOptions.slice(0, maxChips).map((o) => (
          <span
            key={o.value}
            className="flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] text-foreground"
          >
            {o.label}
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                toggle(o.value);
              }}
              className="text-muted-foreground hover:text-brand"
            >
              <X className="h-3 w-3" />
            </span>
          </span>
        ))}
        {selectedOptions.length > maxChips && (
          <span className="rounded-full bg-secondary/70 px-2 py-0.5 text-[11px] text-muted-foreground">
            +{selectedOptions.length - maxChips}
          </span>
        )}
        <ChevronDown className={cn("ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180 text-gold")} />
      </button>

      {open && (
        <Panel rect={rect} onClose={() => setOpen(false)}>
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher…"
              className="h-6 w-full bg-transparent text-sm outline-none"
            />
          </div>
          <div className="flex items-center justify-between border-b border-border px-3 py-1.5 text-[10px] uppercase tracking-widest">
            <span className="text-muted-foreground">{values.length} sélectionné(s)</span>
            <span className="flex gap-3">
              <button type="button" className="text-gold" onClick={() => onChange(filtered.map((o) => o.value))}>
                Tout
              </button>
              <button type="button" className="text-muted-foreground hover:text-brand" onClick={() => onChange([])}>
                Effacer
              </button>
            </span>
          </div>
          <div className="max-h-72 space-y-0.5 overflow-y-auto p-1.5">
            {groupOptions(filtered).map(([g, list]) => (
              <div key={g}>
                {g && (
                  <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{g}</div>
                )}
                {list.map((o) => (
                  <OptionRow key={o.value} o={o} multi selected={values.includes(o.value)} onClick={() => toggle(o.value)} />
                ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">Aucun résultat</p>
            )}
          </div>
        </Panel>
      )}
    </>
  );
}

/** Helper : construit rapidement des options à partir de chaînes. */
export const toOptions = (list: readonly string[]): TCOption[] => list.map((v) => ({ value: v, label: v }));
