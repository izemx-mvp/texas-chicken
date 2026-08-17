import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Camera, ChevronRight, Clock } from "lucide-react";
import { ProgressBar, StatusPill } from "@/components/tc/bits";
import { EmptyState } from "@/components/tc/bits";
import { useStore } from "@/lib/tc/store";

export const Route = createFileRoute("/app/process/$id")({
  head: () => ({
    meta: [
      { title: "Timeline du processus — Texas Chicken Operations" },
      { name: "description", content: "Timeline interactive des étapes du processus opérationnel en cours d'exécution." },
      { property: "og:title", content: "Timeline du processus — Texas Chicken Operations" },
      { property: "og:description", content: "Suivez chaque étape, son statut et ses preuves obligatoires." },
    ],
  }),
  component: ProcessTimeline,
});

function ProcessTimeline() {
  const { id } = useParams({ from: "/app/process/$id" });
  const process = useStore((s) => s.processes.find((p) => p.id === id));
  const tasks = useStore((s) => s.shiftTasks.filter((t) => t.processId === id));

  if (!process) return <EmptyState title="Processus introuvable" />;

  const done = tasks.filter((t) => t.status === "Terminé").length;
  const progress = Math.round((done / Math.max(1, tasks.length)) * 100);

  return (
    <div className="space-y-4">
      <Link to="/app/processes" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-gold">
        <ArrowLeft className="h-4 w-4" /> Processus
      </Link>

      <div className="glass rounded-2xl p-5">
        <h1 className="font-display text-2xl font-bold uppercase">{process.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{process.description}</p>
        <div className="mt-4 flex items-center gap-3">
          <ProgressBar value={progress} className="flex-1" />
          <span className="font-display text-lg font-bold text-gold">{progress}%</span>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          {done}/{tasks.length} étapes terminées · Version {process.version}
        </div>
      </div>

      <ol className="relative space-y-3 pl-6">
        <span className="absolute bottom-4 left-2 top-4 w-px bg-border" />
        {tasks.map((t, i) => (
          <li key={t.id} className="animate-rise relative" style={{ animationDelay: `${i * 45}ms` }}>
            <span
              className={
                "absolute -left-[18px] top-5 grid h-4 w-4 place-items-center rounded-full border-2 " +
                (t.status === "Terminé"
                  ? "border-success bg-success"
                  : t.status === "En retard"
                    ? "border-warning bg-warning/40"
                    : t.status === "En cours"
                      ? "border-info bg-info/40 animate-pulse-ring"
                      : "border-border bg-background")
              }
            />
            <Link
              to="/app/task/$id"
              params={{ id: t.id }}
              className="glass hover-lift flex items-center gap-3 rounded-2xl p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">
                    {i + 1}. {t.name}
                  </span>
                  <StatusPill status={t.status} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded-full border border-border px-2 py-0.5">{t.zone}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {t.time} · {t.duration} min
                  </span>
                  <span>{t.type}</span>
                  {t.evidenceRequired && (
                    <span className="inline-flex items-center gap-1 text-gold">
                      <Camera className="h-3 w-3" /> preuve obligatoire
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
