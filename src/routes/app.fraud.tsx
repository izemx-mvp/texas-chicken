import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, MessageSquare, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, KpiCard, SectionTitle } from "@/components/tc/bits";
import { EvidenceGallery } from "@/components/tc/evidence-gallery";
import { cn } from "@/lib/utils";
import {
  addFraudComment,
  currentUser,
  fraudAlertsFor,
  fraudStats,
  setFraudStatus,
  useStore,
} from "@/lib/tc/store";
import { TODAY } from "@/lib/tc/data";
import type { Evidence, FraudAlert, FraudSeverity, FraudStatus } from "@/lib/tc/types";

export const Route = createFileRoute("/app/fraud")({
  head: () => ({
    meta: [
      { title: "Alertes fraude — Texas Chicken Operations" },
      {
        name: "description",
        content:
          "Centre anti-fraude du restaurant : preuves suspectes détectées par l'IA, gravité, comparaison et traitement.",
      },
      { property: "og:title", content: "Alertes fraude — Texas Chicken Operations" },
      { property: "og:description", content: "Détection IA des preuves dupliquées ou suspectes de votre restaurant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManagerFraud,
});

const SEVERITY_STYLE: Record<FraudSeverity, string> = {
  LOW: "border-border bg-secondary/40 text-muted-foreground",
  MEDIUM: "border-warning/50 bg-warning/15 text-warning",
  HIGH: "border-brand/50 bg-brand/15 text-brand",
  CRITICAL: "border-destructive/60 bg-destructive/15 text-destructive",
};

const FILTERS: ("Toutes" | FraudStatus)[] = [
  "Toutes",
  "À vérifier",
  "Nouvelle preuve demandée",
  "Fraude confirmée",
  "Rejetée",
];

function ManagerFraud() {
  const user = useStore(() => currentUser());
  const rid = user?.restaurantId ?? "r1";
  const list = useStore((s) => fraudAlertsFor(s, { restaurantId: rid }));
  const evidences = useStore((s) => s.evidence);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Toutes");
  const [openId, setOpenId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [gallery, setGallery] = useState<Evidence[] | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);

  const stats = useMemo(() => fraudStats(list, TODAY), [list]);
  const filtered = filter === "Toutes" ? list : list.filter((f) => f.status === filter);

  const openCompare = (f: FraudAlert) => {
    const items = [f.evidenceId, f.previousEvidenceId]
      .map((id) => evidences.find((e) => e.id === id))
      .filter(Boolean) as Evidence[];
    if (items.length) {
      setGalleryIdx(0);
      setGallery(items);
    }
  };

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Alertes fraude"
        subtitle="Preuves suspectes détectées par l'IA anti-fraude sur votre restaurant"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Aujourd'hui" value={stats.today} tone="brand" icon={<ShieldAlert className="h-4 w-4" />} />
        <KpiCard label="7 derniers jours" value={stats.week} />
        <KpiCard label="À traiter" value={stats.open} tone="warning" icon={<AlertTriangle className="h-4 w-4" />} />
        <KpiCard label="Traitées" value={stats.resolved} tone="success" icon={<ShieldCheck className="h-4 w-4" />} />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
              filter === f ? "border-gold/50 bg-gold/15 text-gold" : "border-border text-muted-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucune alerte" description="Aucune fraude détectée avec ce filtre." />
      ) : (
        <div className="space-y-2">
          {filtered.map((f) => {
            const open = openId === f.id;
            const pending = f.status === "À vérifier" || f.status === "Nouvelle preuve demandée";
            return (
              <div key={f.id} className="glass rounded-2xl">
                <button
                  className="flex w-full items-center gap-3 p-4 text-left"
                  onClick={() => setOpenId(open ? null : f.id)}
                >
                  <span
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-xl border",
                      SEVERITY_STYLE[f.severity],
                    )}
                  >
                    <ShieldAlert className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{f.stepName}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {f.date} {f.time} · {f.taskName} · similarité {f.similarity}%
                    </span>
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                      SEVERITY_STYLE[f.severity],
                    )}
                  >
                    {f.severity}
                  </span>
                </button>

                {open && (
                  <div className="space-y-3 border-t border-border p-4">
                    <p className="text-sm">{f.reason}</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {[
                        ["Référence", f.ref],
                        ["Statut", f.status],
                        ["Similarité IA", `${f.similarity}%`],
                      ].map(([l, v]) => (
                        <div key={l} className="rounded-xl border border-border bg-secondary/30 px-3 py-2 text-xs">
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
                          <div className="font-semibold">{v}</div>
                        </div>
                      ))}
                    </div>

                    <Button variant="outline" size="sm" onClick={() => openCompare(f)}>
                      Comparer les preuves
                    </Button>

                    <div className="space-y-1.5">
                      {f.comments.map((c, i) => (
                        <div key={i} className="rounded-xl border border-border bg-secondary/25 px-3 py-2 text-xs">
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            {c.author} · {c.at}
                          </div>
                          {c.text}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Input
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Ajouter un commentaire..."
                        className="h-9 bg-secondary/40"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (!comment.trim()) return;
                          addFraudComment(f.id, comment.trim());
                          setComment("");
                          toast.success("Commentaire ajouté");
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>

                    {pending && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setFraudStatus(f.id, "Fraude confirmée");
                            toast.error("Fraude confirmée — le siège est notifié");
                          }}
                        >
                          <ShieldX className="mr-1 h-4 w-4" /> Confirmer la fraude
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setFraudStatus(f.id, "Nouvelle preuve demandée");
                            toast("Nouvelle preuve demandée à l'équipe");
                          }}
                        >
                          Demander une nouvelle preuve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setFraudStatus(f.id, "Rejetée");
                            toast.success("Alerte rejetée");
                          }}
                        >
                          <ShieldCheck className="mr-1 h-4 w-4" /> Rejeter l'alerte
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {gallery && (
        <EvidenceGallery
          items={gallery}
          index={galleryIdx}
          onIndexChange={setGalleryIdx}
          onClose={() => setGallery(null)}
          title="Comparaison anti-fraude"
        />
      )}
    </div>
  );
}
