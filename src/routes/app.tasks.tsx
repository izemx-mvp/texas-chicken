import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState, SectionTitle, StatusPill } from "@/components/tc/bits";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/tc/store";
import { ZONE_GROUP } from "@/lib/tc/types";

export const Route = createFileRoute("/app/tasks")({
  head: () => ({
    meta: [
      { title: "Tâches du shift — Texas Chicken Operations" },
      { name: "description", content: "Checklists par zone (Back of the House / Front of the House) et par rôle pour votre shift." },
      { property: "og:title", content: "Tâches du shift — Texas Chicken Operations" },
      { property: "og:description", content: "Toutes vos tâches terrain, filtrables par zone, statut et rôle." },
    ],
  }),
  component: ManagerTasks,
});

const FILTERS = ["Toutes", "À faire", "En cours", "En retard", "Terminé"];
const GROUPS = ["Toutes zones", "BOH", "FOH"];

function ManagerTasks() {
  const tasks = useStore((s) => s.shiftTasks);
  const [status, setStatus] = useState("Toutes");
  const [group, setGroup] = useState("Toutes zones");
  const [q, setQ] = useState("");

  const list = tasks.filter(
    (t) =>
      (status === "Toutes" || t.status === status) &&
      (group === "Toutes zones" || ZONE_GROUP[t.zone] === group) &&
      `${t.name} ${t.zone} ${t.role}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <SectionTitle title="Tâches" subtitle="Checklists par zone et par rôle" />

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une tâche..." className="h-11 bg-secondary/40 pl-9" />
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
              group === g ? "border-gold/50 bg-gold/15 text-gold" : "border-border text-muted-foreground",
            )}
          >
            {g}
          </button>
        ))}
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setStatus(f)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
              status === f ? "border-brand/60 bg-brand/15 text-foreground" : "border-border text-muted-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title="Aucun résultat" description="Aucune tâche ne correspond à ces filtres." />
      ) : (
        <div className="space-y-2">
          {list.map((t, i) => (
            <Link
              key={t.id}
              to="/app/task/$id"
              params={{ id: t.id }}
              className="glass hover-lift animate-rise flex items-center gap-3 rounded-2xl p-3"
              style={{ animationDelay: `${i * 18}ms` }}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{t.name}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded-full border border-border px-2">{t.zone}</span>
                  <span>{ZONE_GROUP[t.zone]}</span>
                  <span>{t.time}</span>
                  {t.evidenceRequired && <Camera className="h-3 w-3 text-gold" />}
                </div>
              </div>
              <StatusPill status={t.status} />
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
