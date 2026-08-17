import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  Timer,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import { EmptyState, KpiCard, SectionTitle } from "@/components/tc/bits";
import { EvidenceGallery, EvidenceThumb } from "@/components/tc/evidence-gallery";
import { TaskDetailFilled } from "@/components/tc/task-detail-filled";
import { cn } from "@/lib/utils";
import { executionDetail, useStore } from "@/lib/tc/store";
import type { Evidence } from "@/lib/tc/types";

export const Route = createFileRoute("/admin/execution/$id")({
  head: () => ({
    meta: [
      { title: "Détail de l'exécution — Texas Chicken Operations" },
      {
        name: "description",
        content:
          "Audit complet d'une tâche exécutée en restaurant : étapes, réponses du manager, preuves photo et vidéo, horodatages et analyse IA anti-fraude.",
      },
      { property: "og:title", content: "Détail de l'exécution — Texas Chicken Operations" },
      {
        property: "og:description",
        content: "Traçabilité complète de ce que le restaurant a réellement soumis sur le terrain.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExecutionPage,
});

const STEP_STYLE = {
  Validée: "border-success/50 bg-success/10 text-success",
  "Non conforme": "border-danger/50 bg-danger/10 text-danger",
  "Non réalisée": "border-border bg-secondary/40 text-muted-foreground",
} as const;

function ExecutionPage() {
  const { id } = Route.useParams();
  const [date = "", taskId = "", restaurantId = ""] = id.split("__");
  const exec = useStore((s) => executionDetail(date, taskId, restaurantId, s));
  const [gallery, setGallery] = useState<Evidence[] | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);

  const openGallery = (items: Evidence[], i = 0) => {
    setGalleryIdx(i);
    setGallery(items);
  };

  if (!exec)
    return (
      <div className="space-y-4">
        <BackLink restaurantId={restaurantId} />
        <EmptyState title="Exécution introuvable" description="Cette tâche n'existe pas pour la date demandée." />
      </div>
    );

  return (
    <div className="space-y-4">
      <BackLink restaurantId={restaurantId} />

      <div className="glass animate-rise rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-gold">Détail de l'exécution</p>
            <h1 className="font-display text-xl font-bold sm:text-2xl">{exec.task.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {exec.restaurant?.name ?? "Restaurant"} · {exec.task.zone}
              </span>
              <span className="inline-flex items-center gap-1">
                <UserIcon className="h-3.5 w-3.5" /> {exec.manager?.firstName} {exec.manager?.lastName}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {exec.date} · {exec.startedAt}
                {exec.completedAt ? ` → ${exec.completedAt}` : ""}
              </span>
              <span className="inline-flex items-center gap-1">
                <Timer className="h-3.5 w-3.5" /> {exec.duration} min
              </span>
            </p>
          </div>
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
              exec.status === "Terminé"
                ? "border-success/50 bg-success/15 text-success"
                : exec.status === "En retard"
                  ? "border-danger/50 bg-danger/15 text-danger"
                  : "border-gold/50 bg-gold/15 text-gold",
            )}
          >
            {exec.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard
          label="Étapes validées"
          value={exec.kpi.done}
          suffix={`/${exec.kpi.steps}`}
          tone="success"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <KpiCard label="Preuves soumises" value={exec.kpi.proofs} icon={<Camera className="h-4 w-4" />} />
        <KpiCard
          label="Preuves rejetées"
          value={exec.kpi.rejected}
          tone="warning"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <KpiCard
          label="Suspicions fraude"
          value={exec.kpi.fraud}
          tone="brand"
          icon={<ShieldAlert className="h-4 w-4" />}
        />
        <KpiCard
          label="Conformité"
          value={exec.compliance}
          suffix="%"
          tone={exec.compliance >= 90 ? "success" : exec.compliance >= 70 ? "warning" : "brand"}
          icon={<ShieldCheck className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-3">
          <SectionTitle title="Détail de la tâche" subtitle="Fiche d'exécution complète, champs renseignés sur le terrain" />
          <TaskDetailFilled exec={exec} />
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider">Chronologie</h2>
            {exec.timeline.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">Tâche non encore exécutée.</p>
            ) : (
              <ol className="mt-3 space-y-2 border-l border-border pl-4">
                {exec.timeline.map((t, i) => (
                  <li key={i} className="relative text-xs">
                    <span
                      className={cn(
                        "absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border",
                        t.kind === "issue"
                          ? "border-danger bg-danger"
                          : t.kind === "end"
                            ? "border-success bg-success"
                            : "border-gold bg-gold",
                      )}
                    />
                    <span className="tabular text-muted-foreground">{t.at}</span>
                    <span className="ml-2">{t.label}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="glass rounded-2xl p-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider">Toutes les preuves</h2>
            {exec.evidences.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">Aucune preuve soumise.</p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {exec.evidences.map((ev, i) => (
                  <EvidenceThumb key={ev.id} evidence={ev} onClick={() => openGallery(exec.evidences, i)} />
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-4">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider">
              <MessageSquare className="h-4 w-4 text-gold" /> Commentaires terrain
            </h2>
            {exec.comments.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">Aucun commentaire.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {exec.comments.map((c, i) => (
                  <div key={i} className="rounded-xl border border-border bg-secondary/25 px-3 py-2 text-xs">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {c.author} · {c.at}
                    </div>
                    {c.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {gallery && (
        <EvidenceGallery
          items={gallery}
          index={galleryIdx}
          onIndexChange={setGalleryIdx}
          onClose={() => setGallery(null)}
        />
      )}
    </div>
  );
}

function BackLink({ restaurantId }: { restaurantId: string }) {
  return restaurantId ? (
    <Link
      to="/admin/restaurants/$id"
      params={{ id: restaurantId }}
      className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold"
    >
      <ArrowLeft className="h-4 w-4" /> Retour au restaurant
    </Link>
  ) : (
    <Link to="/admin" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold">
      <ArrowLeft className="h-4 w-4" /> Retour au Command Center
    </Link>
  );
}
