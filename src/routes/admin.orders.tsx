import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Minus, Package, Plus, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionTitle, StatusPill } from "@/components/tc/bits";
import { DataTable, type Column } from "@/components/tc/data-table";
import { cn } from "@/lib/utils";
import { createOrder, currentUser, deliveryStats, orderTotal, setOrderStatus, useStore } from "@/lib/tc/store";
import { ORDER_FLOW, type OrderLine, type PurchaseOrder } from "@/lib/tc/ops";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [
      { title: "Commandes fournisseurs — Texas Chicken Administration" },
      {
        name: "description",
        content:
          "Émettez et pilotez les bons de commande du réseau Texas Chicken : fournisseurs, produits, quantités, dates de livraison et suivi des statuts.",
      },
      { property: "og:title", content: "Commandes fournisseurs — Texas Chicken Administration" },
      { property: "og:description", content: "Création de bons de commande, suivi d'expédition et réceptions restaurant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const state = useStore((s) => s);
  const me = currentUser();
  const [wizard, setWizard] = useState(false);
  const [detail, setDetail] = useState<PurchaseOrder | null>(null);
  const stats = deliveryStats(state.purchaseOrders);

  const supplierName = (id: string) => state.suppliers.find((s) => s.id === id)?.name ?? "—";
  const restaurantName = (id: string) => state.restaurants.find((r) => r.id === id)?.name ?? "—";

  const columns: Column<PurchaseOrder>[] = [
    { key: "ref", header: "Référence", sortable: true, value: (o) => o.ref },
    { key: "supplier", header: "Fournisseur", sortable: true, value: (o) => supplierName(o.supplierId) },
    { key: "restaurant", header: "Restaurant", sortable: true, value: (o) => restaurantName(o.restaurantId) },
    { key: "lines", header: "Réf.", value: (o) => o.lines.length },
    {
      key: "total",
      header: "Montant",
      sortable: true,
      value: (o) => orderTotal(o),
      render: (o) => `${orderTotal(o).toLocaleString("fr-MA")} MAD`,
    },
    { key: "expected", header: "Livraison", sortable: true, value: (o) => o.expectedAt },
    { key: "status", header: "Statut", sortable: true, value: (o) => o.status, render: (o) => <StatusPill status={o.status} /> },
    {
      key: "actions",
      header: "",
      render: (o) => (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={() => setDetail(o)}>
            Détails
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Commandes & approvisionnement"
        subtitle={`${state.purchaseOrders.length} bons de commande · ${state.suppliers.length} fournisseurs`}
        action={
          <Button onClick={() => setWizard(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Émettre une commande
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["En cours", stats.attendues],
          ["En livraison", stats.enLivraison],
          ["En retard", stats.enRetard],
          ["Reçues", stats.recues],
        ].map(([l, n]) => (
          <div key={l as string} className="glass rounded-2xl p-4 text-center">
            <div className="font-display text-2xl font-bold text-gold">{n as number}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l as string}</div>
          </div>
        ))}
      </div>

      <DataTable
        rows={state.purchaseOrders}
        columns={columns}
        searchFields={(o) => `${o.ref} ${supplierName(o.supplierId)} ${restaurantName(o.restaurantId)} ${o.status}`}
      />

      {wizard && <OrderWizard onClose={() => setWizard(false)} createdBy={me?.id ?? ""} />}
      {detail && (
        <OrderDetail
          order={state.purchaseOrders.find((o) => o.id === detail.id) ?? detail}
          onClose={() => setDetail(null)}
          supplierName={supplierName}
          restaurantName={restaurantName}
        />
      )}
    </div>
  );
}

function OrderDetail({
  order,
  onClose,
  supplierName,
  restaurantName,
}: {
  order: PurchaseOrder;
  onClose: () => void;
  supplierName: (id: string) => string;
  restaurantName: (id: string) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="glass animate-rise max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-bold uppercase">{order.ref}</h2>
            <div className="text-xs text-muted-foreground">
              {supplierName(order.supplierId)} → {restaurantName(order.restaurantId)} · prévu le {order.expectedAt}
            </div>
          </div>
          <button onClick={onClose} aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-1">
          {ORDER_FLOW.map((s) => (
            <button
              key={s}
              onClick={() => {
                setOrderStatus(order.id, s);
                toast.success(`Statut mis à jour : ${s}`);
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] uppercase tracking-widest transition-colors",
                order.status === s ? "border-gold bg-gold/20 text-gold" : "border-border text-muted-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-xs">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="py-2">Produit</th>
                <th className="py-2 text-center">Qté</th>
                <th className="py-2 text-center">Reçu</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((l) => (
                <tr key={l.productId} className="border-t border-border/60">
                  <td className="py-2">
                    {l.name}
                    {l.priority === "Urgente" && <span className="ml-1 text-[10px] uppercase text-brand">urgent</span>}
                  </td>
                  <td className="py-2 text-center">
                    {l.quantity} {l.unit}
                  </td>
                  <td className="py-2 text-center">{l.receivedQuantity ?? "—"}</td>
                  <td className="py-2 text-right">{(l.quantity * l.price).toLocaleString("fr-MA")} MAD</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-right font-display text-lg font-bold text-gold">
          {orderTotal(order).toLocaleString("fr-MA")} MAD
        </div>

        <div className="mt-4 space-y-1 rounded-2xl border border-border p-3 text-[11px] text-muted-foreground">
          {order.history.map((h, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-gold">{h.at}</span>
              <span>{h.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OrderWizard({ onClose, createdBy }: { onClose: () => void; createdBy: string }) {
  const state = useStore((s) => s);
  const [step, setStep] = useState(0);
  const [supplierId, setSupplierId] = useState(state.suppliers[0]?.id ?? "");
  const [restaurantId, setRestaurantId] = useState(state.restaurants[0]?.id ?? "");
  const [expectedAt, setExpectedAt] = useState(state.activeDate);
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<Record<string, number>>({});
  const [urgent, setUrgent] = useState<Record<string, boolean>>({});

  const supplier = state.suppliers.find((s) => s.id === supplierId);
  const selected: OrderLine[] = useMemo(
    () =>
      (supplier?.products ?? [])
        .filter((p) => (lines[p.id] ?? 0) > 0)
        .map((p) => ({
          productId: p.id,
          name: p.name,
          unit: p.unit,
          quantity: lines[p.id]!,
          price: p.price,
          priority: urgent[p.id] ? "Urgente" : "Normale",
        })),
    [supplier, lines, urgent],
  );
  const total = selected.reduce((a, l) => a + l.quantity * l.price, 0);
  const STEPS = ["Fournisseur", "Produits", "Livraison", "Récapitulatif"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="glass animate-rise max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-6">
        <div className="flex items-start justify-between">
          <h2 className="font-display text-xl font-bold uppercase">Nouveau bon de commande</h2>
          <button onClick={onClose} aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={cn(
                "flex-1 rounded-lg px-2 py-1.5 text-center text-[10px] uppercase tracking-widest",
                i === step ? "bg-brand/20 text-foreground" : "text-muted-foreground",
              )}
            >
              {s}
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {step === 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {state.suppliers.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSupplierId(s.id);
                    setLines({});
                  }}
                  className={cn(
                    "rounded-2xl border p-3 text-left text-xs transition-colors",
                    supplierId === s.id ? "border-gold bg-gold/10" : "border-border hover:bg-secondary/50",
                  )}
                >
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {s.category} · {s.products.length} produits · délai {s.leadTimeDays}j
                  </div>
                  <div className="text-[10px] text-muted-foreground">{s.contact} — {s.email}</div>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-2">
              {supplier?.products.map((p) => {
                const q = lines[p.id] ?? 0;
                return (
                  <div key={p.id} className="flex items-center gap-2 rounded-xl border border-border p-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {p.price} MAD / {p.unit}
                      </div>
                    </div>
                    <button
                      onClick={() => setUrgent((u) => ({ ...u, [p.id]: !u[p.id] }))}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] uppercase",
                        urgent[p.id] ? "border-brand bg-brand/15 text-brand" : "border-border text-muted-foreground",
                      )}
                    >
                      Urgent
                    </button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Retirer"
                      onClick={() => setLines((l) => ({ ...l, [p.id]: Math.max(0, q - 1) }))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-6 text-center font-semibold">{q}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Ajouter"
                      onClick={() => setLines((l) => ({ ...l, [p.id]: q + 1 }))}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                  Restaurant destinataire
                </span>
                <select
                  className="h-10 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm"
                  value={restaurantId}
                  onChange={(e) => setRestaurantId(e.target.value)}
                >
                  {state.restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                  Date de livraison souhaitée
                </span>
                <Input type="date" value={expectedAt} onChange={(e) => setExpectedAt(e.target.value)} />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                  Instructions fournisseur
                </span>
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Livraison avant 10h…" />
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2 text-xs">
              <div className="rounded-2xl border border-border p-3">
                <div className="font-semibold">{supplier?.name}</div>
                <div className="text-muted-foreground">
                  {state.restaurants.find((r) => r.id === restaurantId)?.name} · livraison {expectedAt}
                </div>
              </div>
              {selected.map((l) => (
                <div key={l.productId} className="flex items-center justify-between rounded-xl border border-border p-2">
                  <span>
                    {l.name} × {l.quantity} {l.unit}
                  </span>
                  <span className="text-gold">{(l.quantity * l.price).toLocaleString("fr-MA")} MAD</span>
                </div>
              ))}
              <div className="text-right font-display text-lg font-bold text-gold">
                Total {total.toLocaleString("fr-MA")} MAD
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between gap-2">
          <Button variant="ghost" onClick={() => (step === 0 ? onClose() : setStep(step - 1))}>
            {step === 0 ? "Annuler" : "Retour"}
          </Button>
          {step < 3 ? (
            <Button
              onClick={() => {
                if (step === 1 && selected.length === 0) {
                  toast.error("Sélectionnez au moins un produit");
                  return;
                }
                setStep(step + 1);
              }}
            >
              Continuer
            </Button>
          ) : (
            <Button
              onClick={() => {
                createOrder({ supplierId, restaurantId, lines: selected, note, createdBy, expectedAt });
                toast.success("Bon de commande envoyé au fournisseur");
                onClose();
              }}
            >
              <Send className="mr-1.5 h-4 w-4" /> Envoyer la commande
            </Button>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          <Package className="h-4 w-4 text-gold" /> {selected.length} références · {total.toLocaleString("fr-MA")} MAD
        </div>
      </div>
    </div>
  );
}
