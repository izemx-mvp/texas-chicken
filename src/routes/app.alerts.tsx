import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BellOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EmptyState, SectionTitle, StatusPill } from "@/components/tc/bits";
import { cn } from "@/lib/utils";
import { currentUser, setState, useStore } from "@/lib/tc/store";

export const Route = createFileRoute("/app/alerts")({
  head: () => ({
    meta: [
      { title: "Alertes du restaurant — Texas Chicken Operations" },
      { name: "description", content: "Alertes de non-conformité, retards et preuves suspectes pour votre restaurant." },
      { property: "og:title", content: "Alertes du restaurant — Texas Chicken Operations" },
      { property: "og:description", content: "Traitez et résolvez les alertes de votre shift en temps réel." },
    ],
  }),
  component: ManagerAlerts,
});

const LEVELS = ["Toutes", "Critique", "Important", "Attention", "Information"];

function ManagerAlerts() {
  const user = useStore(() => currentUser());
  const alerts = useStore((s) => s.alerts.filter((a) => a.restaurantId === user?.restaurantId));
  const [level, setLevel] = useState("Toutes");

  const list = alerts.filter((a) => level === "Toutes" || a.level === level);

  const resolve = (id: string) => {
    setState((s) => ({ alerts: s.alerts.map((a) => (a.id === id ? { ...a, resolved: true, read: true } : a)) }));
    toast.success("Alerte résolue");
  };

  return (
    <div>
      <SectionTitle
        title="Alertes"
        subtitle={`${alerts.filter((a) => !a.resolved).length} alertes ouvertes`}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setState((s) => ({ alerts: s.alerts.map((a) => (a.restaurantId === user?.restaurantId ? { ...a, read: true } : a)) }));
              toast.success("Toutes les alertes marquées comme lues");
            }}
          >
            Tout marquer lu
          </Button>
        }
      />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
              level === l ? "border-gold/50 bg-gold/15 text-gold" : "border-border text-muted-foreground",
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title="Aucune alerte" description="Tout est sous contrôle sur ce restaurant." />
      ) : (
        <div className="space-y-2">
          {list.map((a, i) => (
            <div
              key={a.id}
              className={cn("glass animate-rise rounded-2xl p-4", a.resolved && "opacity-55")}
              style={{ animationDelay: `${i * 20}ms` }}
            >
              <div className="flex items-center justify-between gap-2">
                <StatusPill status={a.level} />
                <span className="text-[10px] text-muted-foreground">{a.createdAt}</span>
              </div>
              <div className="mt-2 text-sm font-semibold">{a.type}</div>
              <p className="text-xs text-muted-foreground">{a.message}</p>
              <div className="mt-3 flex gap-2">
                {a.resolved ? (
                  <span className="inline-flex items-center gap-1 text-xs text-success">
                    <Check className="h-3.5 w-3.5" /> Résolue
                  </span>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => resolve(a.id)}>
                    <BellOff className="mr-1.5 h-3.5 w-3.5" /> Résoudre
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
