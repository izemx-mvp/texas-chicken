import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { ProgressBar, SectionTitle, StatusPill } from "@/components/tc/bits";
import { useStore } from "@/lib/tc/store";

export const Route = createFileRoute("/app/processes")({
  head: () => ({
    meta: [
      { title: "Processus du shift — Texas Chicken Operations" },
      { name: "description", content: "Tous les processus opérationnels affectés à votre restaurant pour le shift en cours." },
      { property: "og:title", content: "Processus du shift — Texas Chicken Operations" },
      { property: "og:description", content: "Suivi des processus, étapes et progression du restaurant." },
    ],
  }),
  component: ManagerProcesses,
});

function ManagerProcesses() {
  const tasks = useStore((s) => s.shiftTasks);
  const processes = useStore((s) => s.processes);
  const ids = [...new Set(tasks.map((t) => t.processId))];

  return (
    <div>
      <SectionTitle title="Processus" subtitle="Workflows affectés à votre restaurant" />
      <div className="space-y-3">
        {ids.map((pid) => {
          const p = processes.find((x) => x.id === pid)!;
          const list = tasks.filter((t) => t.processId === pid);
          const done = list.filter((t) => t.status === "Terminé").length;
          const progress = Math.round((done / Math.max(1, list.length)) * 100);
          return (
            <Link
              key={pid}
              to="/app/process/$id"
              params={{ id: pid }}
              className="glass hover-lift flex items-center gap-3 rounded-2xl p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-bold uppercase">{p.name}</h3>
                  <StatusPill status={progress === 100 ? "Terminé" : progress > 0 ? "En cours" : "À faire"} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {list.length} étapes · v{p.version} · {p.priority}
                </p>
                <ProgressBar value={progress} className="mt-2" />
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
