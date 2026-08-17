import { createFileRoute, Link } from "@tanstack/react-router";
import { TaskBoard } from "@/components/tc/task-board";
import { SectionTitle, StatusPill } from "@/components/tc/bits";
import { nextShiftTask, useActiveDate, useStore } from "@/lib/tc/store";
import { TODAY } from "@/lib/tc/data";

export const Route = createFileRoute("/app/tasks")({
  head: () => ({
    meta: [
      { title: "Tâches du shift — Texas Chicken Operations" },
      {
        name: "description",
        content:
          "Liste, calendrier et progression des processus : toutes les tâches du restaurant pour la date sélectionnée.",
      },
      { property: "og:title", content: "Tâches du shift — Texas Chicken Operations" },
      {
        property: "og:description",
        content: "Vues Liste, Calendrier et Processus synchronisées sur une même date active.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManagerTasks,
});

function ManagerTasks() {
  const next = useStore((s) => nextShiftTask(s));
  const processes = useStore((s) => s.processes);
  const [date] = useActiveDate();

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Tâches"
        subtitle="Liste, calendrier et progression des processus — même date active partout"
      />

      {date === TODAY && next && (
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

      <TaskBoard title="Journée opérationnelle" />
    </div>
  );
}
