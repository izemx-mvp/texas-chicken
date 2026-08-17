import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, Camera, ChevronRight, Clock, ListOrdered, Search, Workflow } from "lucide-react";
import { TaskBoard } from "@/components/tc/task-board";
import { Input } from "@/components/ui/input";
import { EmptyState, SectionTitle, StatusPill } from "@/components/tc/bits";
import { cn } from "@/lib/utils";
import { orderedShiftTasks, nextShiftTask, useStore } from "@/lib/tc/store";
import { ZONE_GROUP } from "@/lib/tc/types";

export const Route = createFileRoute("/app/tasks")({
  head: () => ({
    meta: [
      { title: "Tâches du shift — Texas Chicken Operations" },
      {
        name: "description",
        content:
          "Toutes les tâches du shift dans l'ordre chronologique, tous processus confondus, filtrables par zone et statut.",
      },
      { property: "og:title", content: "Tâches du shift — Texas Chicken Operations" },
      {
        property: "og:description",
        content: "Timeline chronologique des étapes terrain avec preuve photo et priorité.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManagerTasks,
});

const FILTERS = ["Toutes", "À faire", "En cours", "En retard", "Terminé"];
const GROUPS = ["Toutes zones", "BOH", "FOH"];

function ManagerTasks() {
  const tasks = useStore((s) => orderedShiftTasks(s));
  const next = useStore((s) => nextShiftTask(s));
  const processes = useStore((s) => s.processes);
  const [status, setStatus] = useState("Toutes");
  const [group, setGroup] = useState("Toutes zones");
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<"list" | "calendar">("list");

  const list = tasks.filter(
    (t) =>
      (status === "Toutes" || t.status === status) &&
      (group === "Toutes zones" || ZONE_GROUP[t.zone] === group) &&
      `${t.name} ${t.zone} ${t.role}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Tâches du shift"
        subtitle="Ordre chronologique global — toutes les étapes de tous les processus"
      />

      <div className="flex rounded-xl border border-border p-0.5">
        {(["list", "calendar"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
              mode === m ? "bg-brand/20 text-foreground" : "text-muted-foreground",
            )}
          >
            {m === "list" ? <ListOrdered className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
            {m === "list" ? "Liste" : "Calendrier"}
          </button>
        ))}
      </div>

      {mode === "calendar" && <TaskBoard title="Journée opérationnelle" />}

      {next && (
        <Link
          to="/app/task/$id"
          params={{ id: next.id }}
          className="glass panel-glow block rounded-2xl border border-gold/40 p-4"
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">
            Prochaine étape à effectuer
          </div>
          <div className="mt-1 flex items-center gap-3">
            <span className="tabular font-display text-2xl font-bold">{next.time}</span>
            <span className="min-w-0 flex-1 truncate font-semibold">{next.name}</span>
            <StatusPill status={next.status} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {next.zone} · {next.role} · priorité {next.priority} ·{" "}
            {processes.find((p) => p.id === next.processId)?.name}
          </p>
        </Link>
      )}

      <div className="glass space-y-3 rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une tâche, une zone, un rôle..."
            className="h-11 bg-secondary/40 pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatus(f)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                status === f ? "border-gold/60 bg-gold/15 text-gold" : "border-border text-muted-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                group === g ? "border-brand/60 bg-brand/15 text-brand" : "border-border text-muted-foreground",
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState title="Aucune tâche" description="Aucune tâche ne correspond à ces filtres." />
      ) : (
        <div className="relative space-y-2 pl-6">
          <span className="absolute bottom-2 left-2 top-2 w-px bg-border" />
          {list.map((t, i) => {
            const isNext = next?.id === t.id;
            const process = processes.find((p) => p.id === t.processId);
            return (
              <Link
                key={t.id}
                to="/app/task/$id"
                params={{ id: t.id }}
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                className={cn(
                  "glass hover-lift animate-rise relative flex items-center gap-3 rounded-2xl p-3",
                  isNext && "border border-gold/50",
                )}
              >
                <span
                  className={cn(
                    "absolute -left-[18px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-background",
                    t.status === "Terminé"
                      ? "bg-success"
                      : t.status === "En retard"
                        ? "bg-warning"
                        : t.status === "En cours"
                          ? "bg-info"
                          : "bg-muted-foreground/50",
                  )}
                />
                <span className="tabular grid h-11 w-14 shrink-0 place-items-center rounded-xl border border-border bg-secondary/50 font-display text-sm font-bold text-gold">
                  {t.time}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {/* une "tâche" appartient toujours à un processus : on l'affiche pour lever l'ambiguïté */}
                    <Workflow className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                      {process?.name}
                    </span>
                  </div>
                  <div className="truncate text-sm font-semibold">{t.name}</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {t.duration} min · {t.zone} · {t.role}
                    {t.evidenceRequired && <Camera className="h-3 w-3 text-gold" />}
                  </div>
                </div>
                <StatusPill status={t.status} />
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
