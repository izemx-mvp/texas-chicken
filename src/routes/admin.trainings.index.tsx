import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Check, Copy, Eye, GraduationCap, Pencil, Plus, Power, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { KpiCard, SectionTitle, StatusPill } from "@/components/tc/bits";
import { DataTable, type Column } from "@/components/tc/data-table";
import { UserAvatar } from "@/components/tc/avatar";
import { TCModal } from "@/components/tc/modal";
import { cn } from "@/lib/utils";
import {
  allTrainingStats,
  duplicateTraining,
  removeTraining,
  toggleTrainingStatus,
  trainingAdminStats,
  useStore,
  type TrainingAdminStats,
} from "@/lib/tc/store";

export const Route = createFileRoute("/admin/trainings/")({
  head: () => ({
    meta: [
      { title: "Gestion des formations — Texas Chicken Administration" },
      {
        name: "description",
        content:
          "Créez, assignez et supervisez les formations Texas Chicken : modules, quiz QCM, affectation par rôle et restaurant, scores et progression des équipes.",
      },
      { property: "og:title", content: "Gestion des formations — Texas Chicken Administration" },
      {
        property: "og:description",
        content: "Dashboard formations, taux de complétion, quiz notés et suivi individuel des collaborateurs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrainingsAdminPage,
});

function TrainingsAdminPage() {
  const state = useStore((s) => s);
  const navigate = useNavigate();
  const stats = useMemo(() => allTrainingStats(state), [state]);
  const [viewId, setViewId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"progression" | "resultats">("progression");

  const totals = useMemo(() => {
    const assigned = stats.reduce((a, s) => a + s.assigned, 0);
    const completed = stats.reduce((a, s) => a + s.completed, 0);
    return {
      total: stats.length,
      active: stats.filter((s) => s.training.status === "Publiée").length,
      mandatory: stats.filter((s) => s.training.mandatory).length,
      late: stats.reduce((a, s) => a + s.late, 0),
      rate: assigned ? Math.round((completed / assigned) * 100) : 0,
    };
  }, [stats]);

  const openBuilder = (id: string) => navigate({ to: "/admin/trainings/builder/$id", params: { id } });

  type Row = TrainingAdminStats & { id: string };
  const rows: Row[] = useMemo(() => stats.map((s) => ({ ...s, id: s.training.id })), [stats]);

  const columns: Column<Row>[] = [
    {
      key: "title",
      header: "Formation",
      sortable: true,
      value: (s) => s.training.title,
      render: (s) => (
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
            style={{ background: s.training.cover }}
          >
            <BookOpen className="h-4 w-4 text-white" />
          </span>
          <div className="min-w-0">
            <div className="truncate font-semibold">{s.training.title}</div>
            <div className="truncate text-[11px] text-muted-foreground">
              {s.training.category} · {s.training.level} · {s.training.duration} min
              {s.training.mandatory && <span className="ml-1 text-gold">· Obligatoire</span>}
            </div>
          </div>
        </div>
      ),
    },
    { key: "roles", header: "Rôles", value: (s) => s.training.roles.join(", ") },
    { key: "assigned", header: "Assignés", sortable: true, value: (s) => s.assigned },
    {
      key: "progress",
      header: "Complétion",
      sortable: true,
      value: (s) => s.avgPercent,
      render: (s) => (
        <div className="w-32">
          <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
            <span>
              {s.completed}/{s.assigned} terminés
            </span>
            <span className="text-gold">{s.avgPercent}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${s.avgPercent}%` }} />
          </div>
        </div>
      ),
    },
    {
      key: "score",
      header: "Score moyen",
      sortable: true,
      value: (s) => s.avgScorePercent,
      render: (s) => (
        <span className={s.avgScorePercent >= 80 ? "font-semibold text-success" : "text-muted-foreground"}>
          {s.avgScorePercent}% <span className="text-[10px]">/ {s.maxScore} pts</span>
        </span>
      ),
    },
    {
      key: "late",
      header: "En retard",
      sortable: true,
      value: (s) => s.late,
      render: (s) => (
        <span className={s.late ? "font-semibold text-destructive" : "text-muted-foreground"}>{s.late}</span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      value: (s) => s.training.status,
      render: (s) => <StatusPill status={s.training.status === "Publiée" ? "Actif" : "Brouillon"} />,
    },
    {
      key: "actions",
      header: "",
      render: (s) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" aria-label="Voir" onClick={() => setViewId(s.training.id)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" aria-label="Publier" onClick={() => toggleTrainingStatus(s.training.id)}>
            <Power className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" aria-label="Modifier" onClick={() => openBuilder(s.training.id)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Dupliquer"
            onClick={() => {
              duplicateTraining(s.training.id);
              toast.success("Formation dupliquée");
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Supprimer"
            onClick={() => {
              removeTraining(s.training.id);
              toast.success("Formation supprimée");
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const detail = viewId ? trainingAdminStats(viewId, state) : null;

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Gestion des formations"
        subtitle="Créer, assigner et superviser la montée en compétence du réseau"
        action={
          <Button onClick={() => openBuilder("new")}>
            <Plus className="mr-1.5 h-4 w-4" /> Nouvelle formation
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Formations" value={totals.total} icon={<GraduationCap className="h-4 w-4" />} />
        <KpiCard label="Actives" value={totals.active} icon={<BookOpen className="h-4 w-4" />} tone="brand" />
        <KpiCard label="Obligatoires" value={totals.mandatory} icon={<Check className="h-4 w-4" />} tone="warning" />
        <KpiCard label="En retard" value={totals.late} icon={<X className="h-4 w-4" />} tone="danger" />
        <KpiCard
          label="Taux de complétion"
          value={totals.rate}
          suffix="%"
          icon={<ArrowRight className="h-4 w-4" />}
          tone="success"
        />
      </div>

      <div className="glass rounded-3xl p-4">
        <div className="mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">Complétion par formation</div>
        <div className="space-y-2">
          {stats.map((s) => (
            <div key={s.training.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-xs sm:flex">
              <span className="min-w-0 truncate sm:w-52 sm:shrink-0">{s.training.title}</span>
              <div className="order-3 col-span-2 h-2 flex-1 overflow-hidden rounded-full bg-secondary sm:order-none">
                <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${s.avgPercent}%` }} />
              </div>
              <span className="shrink-0 text-right text-gold sm:w-10">{s.avgPercent}%</span>
            </div>
          ))}
        </div>
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        searchFields={(s) => `${s.training.title} ${s.training.category} ${s.training.roles.join(" ")}`}
      />

      {detail && (
        <TCModal
          title={detail.training.title}
          subtitle={`${detail.training.category} · ${detail.totalSteps} étapes · ${detail.assigned} collaborateurs · ${detail.maxScore} points`}
          onClose={() => setViewId(null)}
          size="xl"
          toolbar={
            <div className="flex gap-1">
              {(
                [
                  ["progression", "Progression"],
                  ["resultats", "Résultats & scores"],
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setDetailTab(k)}
                  className={cn(
                    "flex-1 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors",
                    detailTab === k ? "bg-brand/20 text-foreground" : "bg-secondary/50 text-muted-foreground",
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          }
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setViewId(null)}>
                Fermer
              </Button>
              <Button onClick={() => openBuilder(detail.training.id)}>
                <Pencil className="mr-1.5 h-4 w-4" /> Modifier
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-4">
              {[
                ["Terminés", detail.completed, "text-success"],
                ["En cours", detail.started, "text-gold"],
                ["Non démarrés", detail.notStarted, "text-muted-foreground"],
                ["En retard", detail.late, "text-destructive"],
              ].map(([label, val, tone]) => (
                <div key={String(label)} className="rounded-2xl border border-border p-3">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
                  <div className={cn("font-display text-2xl font-bold", tone as string)}>{val}</div>
                </div>
              ))}
            </div>

            {detailTab === "progression" ? (
              <div className="space-y-1.5">
                {detail.assignees.map((a) => (
                  <div
                    key={a.user.id}
                    className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-border p-2.5 sm:flex"
                  >
                    <UserAvatar user={a.user} size={34} presence />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold">
                        {a.user.firstName} {a.user.lastName}
                      </div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {a.user.role} · {a.restaurantName}
                        {a.dueDate && <span> · échéance {a.dueDate}</span>}
                      </div>
                    </div>
                    <div className="col-span-2 w-full sm:w-28">
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${a.percent}%` }} />
                      </div>
                    </div>
                    <span className="text-right text-[11px] text-gold sm:w-9">{a.percent}%</span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-center text-[10px] uppercase tracking-widest sm:w-24",
                        a.status === "Terminé" && "bg-success/15 text-success",
                        a.status === "En cours" && "bg-gold/15 text-gold",
                        a.status === "En retard" && "bg-destructive/15 text-destructive",
                        a.status === "Non démarré" && "bg-secondary text-muted-foreground",
                      )}
                    >
                      {a.status}
                    </span>
                  </div>
                ))}
                {detail.assignees.length === 0 && (
                  <p className="p-6 text-center text-xs text-muted-foreground">Aucun collaborateur assigné.</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead className="bg-secondary/40 text-[10px] uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2">Nom</th>
                      <th className="px-4 py-2">Restaurant</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Score</th>
                      <th className="px-4 py-2">Pourcentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.results.map((r) => (
                      <tr key={r.user.id} className="border-t border-border/60">
                        <td className="px-4 py-2 font-medium">
                          {r.user.firstName} {r.user.lastName}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{r.restaurantName}</td>
                        <td className="px-4 py-2 text-muted-foreground">{r.completedAt ?? r.lastActivity ?? "—"}</td>
                        <td className="px-4 py-2">
                          {r.score}/{r.maxScore}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold",
                              r.scorePercent >= 80
                                ? "bg-success/20 text-success"
                                : "bg-secondary/60 text-muted-foreground",
                            )}
                          >
                            {r.scorePercent}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {detail.results.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          Aucun participant n'a encore terminé cette formation.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TCModal>
      )}
    </div>
  );
}
