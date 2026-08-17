import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AnimatedNumber({
  value,
  suffix = "",
  decimals = 0,
  className,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const initial = from.current;
    const delta = value - initial;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 900);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(initial + delta * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <span className={cn("tabular", className)}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  suffix,
  hint,
  icon,
  tone = "default",
  className,
}: {
  label: string;
  value: number;
  suffix?: string;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "brand" | "success" | "warning" | "danger";
  className?: string;
}) {
  const tones: Record<string, string> = {
    default: "text-foreground",
    brand: "text-brand",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
  };
  return (
    <div
      className={cn(
        "glass hover-lift group relative overflow-hidden rounded-2xl p-5",
        className,
      )}
    >
      <div className="absolute inset-x-0 -top-px h-px bg-brand-gradient opacity-60" />
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
        {icon && (
          <span className="rounded-lg border border-border bg-secondary/40 p-1.5 text-gold transition-transform group-hover:scale-110">
            {icon}
          </span>
        )}
      </div>
      <div className={cn("mt-3 font-display text-4xl font-bold", tones[tone])}>
        <AnimatedNumber value={value} suffix={suffix} />
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      <div className="pointer-events-none absolute -bottom-10 -right-8 h-24 w-24 rounded-full bg-brand-gradient opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-30" />
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  Terminé: "bg-success/15 text-success border-success/30",
  Conforme: "bg-success/15 text-success border-success/30",
  Valide: "bg-success/15 text-success border-success/30",
  Actif: "bg-success/15 text-success border-success/30",
  Publié: "bg-success/15 text-success border-success/30",
  "En cours": "bg-info/15 text-info border-info/30",
  "En analyse": "bg-info/15 text-info border-info/30",
  Information: "bg-info/15 text-info border-info/30",
  "À faire": "bg-muted text-muted-foreground border-border",
  Brouillon: "bg-muted text-muted-foreground border-border",
  Inactif: "bg-muted text-muted-foreground border-border",
  Archivé: "bg-muted text-muted-foreground border-border",
  "En retard": "bg-warning/15 text-warning border-warning/30",
  Attention: "bg-warning/15 text-warning border-warning/30",
  Suspecte: "bg-warning/15 text-warning border-warning/30",
  Incomplet: "bg-warning/15 text-warning border-warning/30",
  "Partiellement conforme": "bg-warning/15 text-warning border-warning/30",
  Important: "bg-accent/20 text-accent border-accent/30",
  "Non conforme": "bg-destructive/15 text-destructive border-destructive/30",
  Rejetée: "bg-destructive/15 text-destructive border-destructive/30",
  Dupliquée: "bg-destructive/15 text-destructive border-destructive/30",
  Bloqué: "bg-destructive/15 text-destructive border-destructive/30",
  Critique: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
        STATUS_TONE[status] ?? "bg-secondary/50 text-secondary-foreground border-border",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function ComplianceRing({
  value,
  size = 132,
  label = "Conformité",
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const [p, setP] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setP(value), 120);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.62 0.23 28)" />
            <stop offset="100%" stopColor="oklch(0.86 0.17 82)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="10" className="stroke-secondary" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth="10"
          stroke="url(#ring-grad)"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * p) / 100}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-3xl font-bold text-foreground">
          <AnimatedNumber value={value} suffix="%" />
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setP(value), 80);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className={cn("relative h-2.5 overflow-hidden rounded-full bg-secondary/70", className)}>
      <div
        className="h-full rounded-full bg-brand-gradient"
        style={{ width: `${p}%`, transition: "width 1s cubic-bezier(.22,1,.36,1)" }}
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-shimmer h-full w-1/3 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="glass flex flex-col items-center justify-center rounded-2xl px-6 py-14 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-border bg-secondary/40 text-gold">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 7h18M3 12h12M3 17h7" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="font-display text-xl font-bold uppercase">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="relative h-12 overflow-hidden rounded-xl bg-secondary/40">
          <div className="animate-shimmer absolute inset-y-0 w-1/3 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      ))}
    </div>
  );
}

export function useFakeLoading(ms = 550) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}
