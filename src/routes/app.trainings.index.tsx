import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Clock, GraduationCap, PlayCircle, Search, ShieldAlert, Star, TrendingUp } from "lucide-react";
import { SectionTitle, ProgressBar } from "@/components/tc/bits";
import { cn } from "@/lib/utils";
import { currentUser, trainingsForUser, useStore, type TrainingView } from "@/lib/tc/store";

export const Route = createFileRoute("/app/trainings/")({
  head: () => ({
    meta: [
      { title: "Formations métier — Texas Chicken Operations" },
      {
        name: "description",
        content:
          "Plateforme de formation Texas Chicken : parcours métier par rôle, vidéos, modules, progression et validation des acquis.",
      },
      { property: "og:title", content: "Formations métier — Texas Chicken Operations" },
      { property: "og:description", content: "Apprenez le métier : Food Safety, cuisine, caisse, drive, hygiène et management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrainingsPage,
});

const FILTERS = ["Toutes", "Recommandées", "Commencées", "Terminées", "Obligatoires"] as const;

function Cover({ v, className }: { v: TrainingView; className?: string }) {
  const t = v.training;
  return (
    <div className={cn("relative h-32 w-full overflow-hidden", className)} style={{ background: t.cover }}>
      {t.coverPhoto && (
        <img
          src={t.coverPhoto}
          alt={t.title}
          loading="lazy"
          width={1024}
          height={576}
          className="h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/25 to-transparent" />
      <div className="absolute inset-x-3 bottom-2 flex items-end justify-between gap-2">
        <span className="rounded-full bg-background/70 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold backdrop-blur">
          {t.category}
        </span>
        {t.mandatory && (
          <span className="rounded-full border border-brand/50 bg-brand/25 px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand-foreground backdrop-blur">
            Obligatoire
          </span>
        )}
      </div>
    </div>
  );
}

function TrainingCard({ v }: { v: TrainingView }) {
  const t = v.training;
  return (
    <Link
      to="/app/training/$id"
      params={{ id: t.id }}
      className="glass block overflow-hidden rounded-3xl transition-colors hover:border-gold/40"
    >
      <Cover v={v} />
      <div className="p-4">
        <div className="font-display text-base font-bold uppercase">{t.title}</div>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="rounded-full bg-secondary/60 px-2 py-0.5">{t.level}</span>
          <span className="rounded-full bg-secondary/60 px-2 py-0.5">{t.duration} min</span>
          <span className="rounded-full bg-secondary/60 px-2 py-0.5">
            {t.modules.length} modules · {v.totalSteps} étapes
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={v.percent} className="flex-1" />
          <span className="text-xs font-semibold text-gold">{v.percent}%</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
          {v.completed ? (
            <>
              <Star className="h-3.5 w-3.5 text-success" /> Formation terminée
            </>
          ) : v.started ? (
            <>
              <PlayCircle className="h-3.5 w-3.5 text-gold" /> Reprendre à l'étape {v.doneSteps + 1}/{v.totalSteps}
            </>
          ) : (
            <>
              <GraduationCap className="h-3.5 w-3.5 text-gold" /> Commencer la formation
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

function TrainingsPage() {
  const state = useStore((s) => s);
  const me = currentUser();
  const views = useMemo(() => trainingsForUser(me?.id, state), [state, me?.id]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Toutes");
  const [category, setCategory] = useState("Toutes");
  const [q, setQ] = useState("");

  const categories = useMemo(
    () => ["Toutes", ...Array.from(new Set(views.map((v) => v.training.category)))],
    [views],
  );

  const list = views.filter((v) => {
    const t = v.training;
    if (q && !`${t.title} ${t.category} ${t.roles.join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (category !== "Toutes" && t.category !== category) return false;
    if (filter === "Recommandées") return t.roles.some((r) => r === me?.role) || t.mandatory;
    if (filter === "Commencées") return v.started && !v.completed;
    if (filter === "Terminées") return v.completed;
    if (filter === "Obligatoires") return t.mandatory;
    return true;
  });

  const avg = views.length ? Math.round(views.reduce((a, v) => a + v.percent, 0) / views.length) : 0;
  const inProgress = views.filter((v) => v.started && !v.completed);
  const mandatoryTodo = views.filter((v) => v.training.mandatory && !v.completed);
  const minutesLeft = views
    .filter((v) => !v.completed)
    .reduce((a, v) => a + Math.round((v.training.duration * (100 - v.percent)) / 100), 0);

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Formations"
        subtitle={`Comment réaliser votre métier selon les standards Texas Chicken — progression globale ${avg}%`}
      />

      <div className="glass grid grid-cols-2 gap-2 rounded-2xl p-3 text-center sm:grid-cols-4">
        {[
          ["Disponibles", views.length, GraduationCap],
          ["En cours", inProgress.length, PlayCircle],
          ["Terminées", views.filter((v) => v.completed).length, Star],
          ["Min. restantes", minutesLeft, Clock],
        ].map(([l, n, Icon]) => {
          const I = Icon as typeof GraduationCap;
          return (
            <div key={l as string}>
              <I className="mx-auto mb-1 h-4 w-4 text-gold" />
              <div className="font-display text-2xl font-bold text-gold">{n as number}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l as string}</div>
            </div>
          );
        })}
      </div>

      {mandatoryTodo.length > 0 && (
        <div className="glass flex items-start gap-3 rounded-2xl border-brand/40 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
          <div className="min-w-0 text-xs">
            <div className="font-display text-sm font-bold uppercase">
              {mandatoryTodo.length} formation{mandatoryTodo.length > 1 ? "s" : ""} obligatoire
              {mandatoryTodo.length > 1 ? "s" : ""} à finaliser
            </div>
            <div className="mt-1 text-muted-foreground">
              {mandatoryTodo.map((v) => v.training.title).join(" · ")}
            </div>
          </div>
        </div>
      )}

      {inProgress.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2 px-1 text-[11px] uppercase tracking-widest text-gold">
            <TrendingUp className="h-4 w-4" /> Continuer l'apprentissage
          </div>
          <div className="flex snap-x gap-3 overflow-x-auto pb-1">
            {inProgress.map((v) => (
              <Link
                key={v.training.id}
                to="/app/training/$id"
                params={{ id: v.training.id }}
                className="glass w-64 shrink-0 snap-start overflow-hidden rounded-3xl transition-colors hover:border-gold/40"
              >
                <Cover v={v} className="h-24" />
                <div className="p-3">
                  <div className="truncate font-display text-sm font-bold uppercase">{v.training.title}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <ProgressBar value={v.percent} className="flex-1" />
                    <span className="text-[11px] font-bold text-gold">{v.percent}%</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une formation, un métier…"
          className="h-10 w-full bg-transparent text-sm outline-none"
        />
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border p-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-widest transition-colors",
              filter === f ? "bg-brand/20 text-foreground" : "text-muted-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] transition-colors",
              category === c ? "border-gold/60 bg-gold/15 text-gold" : "border-border text-muted-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((v) => (
          <TrainingCard key={v.training.id} v={v} />
        ))}
        {list.length === 0 && (
          <div className="glass rounded-3xl p-8 text-center text-sm text-muted-foreground sm:col-span-2">
            Aucune formation ne correspond à ces critères.
          </div>
        )}
      </div>
    </div>
  );
}
