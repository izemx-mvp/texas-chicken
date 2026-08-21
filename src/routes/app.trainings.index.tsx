import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { GraduationCap, PlayCircle, Search, Star } from "lucide-react";
import { SectionTitle, ProgressBar } from "@/components/tc/bits";
import { cn } from "@/lib/utils";
import { currentUser, trainingsForUser, useStore } from "@/lib/tc/store";

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

function TrainingsPage() {
  const state = useStore((s) => s);
  const me = currentUser();
  const views = useMemo(() => trainingsForUser(me?.id, state), [state, me?.id]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Toutes");
  const [q, setQ] = useState("");

  const list = views.filter((v) => {
    const t = v.training;
    if (q && !`${t.title} ${t.category} ${t.roles.join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "Recommandées") return t.roles.some((r) => r === me?.role) || t.mandatory;
    if (filter === "Commencées") return v.started && !v.completed;
    if (filter === "Terminées") return v.completed;
    if (filter === "Obligatoires") return t.mandatory;
    return true;
  });

  const avg = views.length ? Math.round(views.reduce((a, v) => a + v.percent, 0) / views.length) : 0;

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Formations"
        subtitle={`Comment réaliser votre métier selon les standards Texas Chicken — progression globale ${avg}%`}
      />

      <div className="glass grid grid-cols-3 gap-2 rounded-2xl p-3 text-center">
        {[
          ["Disponibles", views.length],
          ["En cours", views.filter((v) => v.started && !v.completed).length],
          ["Terminées", views.filter((v) => v.completed).length],
        ].map(([l, n]) => (
          <div key={l as string}>
            <div className="font-display text-2xl font-bold text-gold">{n as number}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l as string}</div>
          </div>
        ))}
      </div>

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

      <div className="space-y-3">
        {list.map((v) => (
          <Link
            key={v.training.id}
            to="/app/training/$id"
            params={{ id: v.training.id }}
            className="glass block overflow-hidden rounded-3xl transition-colors hover:border-gold/40"
          >
            <div className="h-20 w-full" style={{ background: v.training.cover }} />
            <div className="p-4">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-display text-base font-bold uppercase">{v.training.title}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{v.training.description}</p>
                </div>
                {v.training.mandatory && (
                  <span className="shrink-0 rounded-full border border-brand/40 bg-brand/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand">
                    Obligatoire
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                <span className="rounded-full bg-secondary/60 px-2 py-0.5">{v.training.category}</span>
                <span className="rounded-full bg-secondary/60 px-2 py-0.5">{v.training.level}</span>
                <span className="rounded-full bg-secondary/60 px-2 py-0.5">{v.training.duration} min</span>
                <span className="rounded-full bg-secondary/60 px-2 py-0.5">
                  {v.training.modules.length} modules · {v.totalSteps} étapes
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
                    <PlayCircle className="h-3.5 w-3.5 text-gold" /> Reprendre où vous vous êtes arrêté
                  </>
                ) : (
                  <>
                    <GraduationCap className="h-3.5 w-3.5 text-gold" /> Commencer la formation
                  </>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
