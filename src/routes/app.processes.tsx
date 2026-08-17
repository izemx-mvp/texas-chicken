import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { ProgressBar, SectionTitle, StatusPill } from "@/components/tc/bits";
import { DateFilter } from "@/components/tc/date-filter";
import { dateLabel, dayKind, processDayReports, useActiveDate, useStore } from "@/lib/tc/store";
import { TODAY } from "@/lib/tc/data";

export const Route = createFileRoute("/app/processes")({
  head: () => ({
    meta: [
      { title: "Processus du shift — Texas Chicken Operations" },
      { name: "description", content: "Tous les processus opérationnels affectés à votre restaurant pour la date sélectionnée." },
      { property: "og:title", content: "Processus du shift — Texas Chicken Operations" },
      { property: "og:description", content: "Suivi des processus, étapes et progression du restaurant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManagerProcesses,
});

function ManagerProcesses() {
  const state = useStore((s) => s);
  const [date] = useActiveDate();
  const reports = processDayReports(date, TODAY, state);
  const future = dayKind(date, TODAY) === "future";

  return (
    <div>
      <SectionTitle title="Processus" subtitle={`Workflows disponibles · ${dateLabel(date, TODAY)}`} />
      <DateFilter className="mb-4" />
      <div className="space-y-3">
        {reports.length === 0 && (
          <p className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
            Aucun processus disponible à cette date.
          </p>
        )}
        {reports.map((r) => {
          const progress = future ? 0 : r.progress;
          return (
            <Link
              key={r.process.id}
              to="/app/process/$id"
              params={{ id: r.process.id }}
              className="glass hover-lift flex items-center gap-3 rounded-2xl p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-bold uppercase">{r.process.name}</h3>
                  <StatusPill status={progress === 100 ? "Terminé" : progress > 0 ? "En cours" : "À faire"} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {r.tasks} tâches · {r.steps} étapes · v{r.process.version} · {r.process.priority}
                </p>
                <ProgressBar value={progress} className="mt-2" />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {future ? `${r.tasks} tâches planifiées` : `${r.done}/${r.tasks} tâches · conformité ${r.compliance}%`}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
