/**
 * TCModal — coquille de popup premium Texas Chicken.
 * Structure imposée : header fixe, body scrollable, footer d'actions fixe.
 * Seul le contenu interne défile : les actions restent toujours accessibles
 * et la page derrière ne scrolle jamais.
 */
import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function TCModal({
  open = true,
  title,
  subtitle,
  onClose,
  children,
  footer,
  toolbar,
  size = "lg",
  className,
}: {
  open?: boolean;
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** Zone fixe sous le header (stepper, onglets…). */
  toolbar?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const width = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  }[size];

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={cn(
          "glass animate-rise flex max-h-[min(92vh,52rem)] w-full flex-col overflow-hidden rounded-3xl",
          width,
          className,
        )}
      >
        {/* Header fixe */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display truncate text-lg font-bold uppercase sm:text-xl">{title}</h2>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Fermer" className="shrink-0 text-muted-foreground hover:text-brand">
            <X className="h-5 w-5" />
          </button>
        </div>

        {toolbar && <div className="shrink-0 border-b border-border px-5 py-3">{toolbar}</div>}

        {/* Body scrollable */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {/* Footer fixe */}
        {footer && (
          <div className="shrink-0 border-t border-border bg-background/40 px-5 py-3">{footer}</div>
        )}
      </div>
    </div>
  );
}
