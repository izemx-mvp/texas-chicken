/**
 * Sélecteur de langue du header (français, anglais, arabe).
 * Le choix est mémorisé sur l'appareil et appliqué immédiatement.
 */
import { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { LANGUAGES, useLang } from "@/lib/tc/i18n";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.value === lang) ?? LANGUAGES[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("common.language")}
        className="flex h-10 items-center gap-1.5 rounded-xl border border-border bg-secondary/40 px-2.5 text-xs font-semibold transition-colors hover:border-gold/40"
      >
        <Globe className="h-4 w-4 text-gold" />
        {current.short}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-[130] w-40 overflow-hidden rounded-2xl border border-border bg-background/95 p-1 shadow-xl backdrop-blur-xl">
          {LANGUAGES.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => {
                setLang(l.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-secondary/60",
                l.value === lang && "bg-brand/15 text-foreground",
              )}
            >
              {l.label}
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{l.short}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
