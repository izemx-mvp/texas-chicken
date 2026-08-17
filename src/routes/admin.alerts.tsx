import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { KpiCard, SectionTitle, StatusPill } from "@/components/tc/bits";
import { DataTable, type Column } from "@/components/tc/data-table";
import { setState, useStore } from "@/lib/tc/store";
import type { Alert } from "@/lib/tc/types";

export const Route = createFileRoute("/admin/alerts")({
  head: () => ({
    meta: [
      { title: "Alert Center — Texas Chicken Administration" },
      { name: "description", content: "Centre d'alertes réseau : non-conformités, retards et preuves suspectes en temps réel." },
      { property: "og:title", content: "Alert Center — Texas Chicken Administration" },
      { property: "og:description", content: "Traitez les alertes critiques du réseau et suivez leur résolution." },
    ],
  }),
  component: AdminAlerts,
});

function AdminAlerts() {
  const alerts = useStore((s) => s.alerts);
  const restaurants = useStore((s) => s.restaurants);

  const resolve = (id: string) => {
    setState((s) => ({ alerts: s.alerts.map((a) => (a.id === id ? { ...a, resolved: true, read: true } : a)) }));
    toast.success("Alerte résolue");
  };

  const columns: Column<Alert>[] = [
    { key: "level", header: "Niveau", sortable: true, value: (a) => a.level, render: (a) => <StatusPill status={a.level} /> },
    { key: "type", header: "Type", sortable: true, value: (a) => a.type },
    { key: "message", header: "Message", value: (a) => a.message, render: (a) => <span className="text-muted-foreground">{a.message}</span> },
    {
      key: "restaurant",
      header: "Restaurant",
      sortable: true,
      value: (a) => restaurants.find((r) => r.id === a.restaurantId)?.name ?? "—",
    },
    { key: "createdAt", header: "Date", sortable: true, value: (a) => a.createdAt },
    {
      key: "actions",
      header: "",
      render: (a) =>
        a.resolved ? (
          <span className="inline-flex items-center gap-1 text-xs text-success"><Check className="h-3.5 w-3.5" /> Résolue</span>
        ) : (
          <Button size="sm" variant="outline" onClick={() => resolve(a.id)}>Résoudre</Button>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Alert Center"
        subtitle={`${alerts.filter((a) => !a.resolved).length} alertes ouvertes`}
        action={
          <Button
            variant="outline"
            onClick={() => {
              setState((s) => ({ alerts: s.alerts.map((a) => ({ ...a, read: true })) }));
              toast.success("Toutes les alertes marquées comme lues");
            }}
          >
            Tout marquer lu
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Critiques" value={alerts.filter((a) => a.level === "Critique" && !a.resolved).length} tone="danger" icon={<AlertTriangle className="h-4 w-4" />} />
        <KpiCard label="Importantes" value={alerts.filter((a) => a.level === "Important" && !a.resolved).length} tone="warning" />
        <KpiCard label="Attention" value={alerts.filter((a) => a.level === "Attention" && !a.resolved).length} />
        <KpiCard label="Résolues" value={alerts.filter((a) => a.resolved).length} tone="success" />
      </div>

      <DataTable
        rows={alerts}
        columns={columns}
        searchFields={(a) => `${a.type} ${a.message}`}
        filters={[
          { key: "level", label: "Niveau", options: ["Critique", "Important", "Attention", "Information"], match: (a, v) => a.level === v },
          { key: "state", label: "État", options: ["Ouverte", "Résolue"], match: (a, v) => (v === "Résolue" ? a.resolved : !a.resolved) },
        ]}
      />
    </div>
  );
}
