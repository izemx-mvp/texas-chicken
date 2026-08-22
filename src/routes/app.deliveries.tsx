import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, PackageCheck, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionTitle, StatusPill } from "@/components/tc/bits";
import { cn } from "@/lib/utils";
import { currentUser, deliveryStats, orderTotal, ordersFor, receiveOrder, useStore } from "@/lib/tc/store";
import type { PurchaseOrder } from "@/lib/tc/ops";
import { ChatContextButton } from "@/components/tc/chat-dock";

export const Route = createFileRoute("/app/deliveries")({
  head: () => ({
    meta: [
      { title: "Livraisons & réceptions — Texas Chicken Operations" },
      {
        name: "description",
        content:
          "Suivez les commandes fournisseurs attendues au restaurant : statut d'expédition, retards, contrôle des quantités et confirmation de réception.",
      },
      { property: "og:title", content: "Livraisons & réceptions — Texas Chicken Operations" },
      { property: "og:description", content: "Commandes attendues, en livraison, en retard et réceptions confirmées." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DeliveriesPage,
});

const TABS = ["Attendues", "En livraison", "En retard", "Reçues"] as const;

function DeliveriesPage() {
  const state = useStore((s) => s);
  const me = currentUser();
  const orders = useMemo(() => ordersFor(me?.restaurantId, state), [state, me?.restaurantId]);
  const stats = deliveryStats(orders);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Attendues");
  const [open, setOpen] = useState<PurchaseOrder | null>(null);

  const list = orders.filter((o) => {
    if (tab === "Attendues") return ["Envoyée", "En préparation", "En livraison", "En retard"].includes(o.status);
    if (tab === "En livraison") return o.status === "En livraison";
    if (tab === "En retard") return o.status === "En retard";
    return o.status === "Reçue" || o.status === "Clôturée";
  });

  const supplierName = (id: string) => state.suppliers.find((s) => s.id === id)?.name ?? "Fournisseur";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle title="Livraisons" subtitle="Commandes fournisseurs de votre restaurant" />
        <ChatContextButton label="Discuter livraisons" target={{ match: "logistique" }} />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          ["Attendues", stats.attendues],
          ["En route", stats.enLivraison],
          ["Retard", stats.enRetard],
          ["Reçues", stats.recues],
        ].map(([l, n]) => (
          <div key={l as string} className="glass rounded-2xl p-3 text-center">
            <div className="font-display text-xl font-bold text-gold">{n as number}</div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{l as string}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-widest transition-colors",
              tab === t ? "bg-brand/20 text-foreground" : "text-muted-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {list.map((o) => (
          <button
            key={o.id}
            onClick={() => setOpen(o)}
            className="glass block w-full rounded-2xl p-4 text-left transition-colors hover:border-gold/40"
          >
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-gold" />
              <span className="font-semibold">{o.ref}</span>
              <StatusPill status={o.status} className="ml-auto" />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{supplierName(o.supplierId)}</div>
            <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
              <span>Prévu le {o.expectedAt}</span>
              <span>{o.lines.length} références</span>
              <span className="text-gold">{orderTotal(o).toLocaleString("fr-MA")} MAD</span>
            </div>
          </button>
        ))}
        {list.length === 0 && (
          <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">Aucune livraison ici.</div>
        )}
      </div>

      {open && <ReceptionModal order={open} onClose={() => setOpen(null)} userId={me?.id ?? ""} />}
    </div>
  );
}

function ReceptionModal({ order, onClose, userId }: { order: PurchaseOrder; onClose: () => void; userId: string }) {
  const [qty, setQty] = useState<Record<string, number>>(
    Object.fromEntries(order.lines.map((l) => [l.productId, l.receivedQuantity ?? l.quantity])),
  );
  const [comment, setComment] = useState("");
  const received = order.status === "Reçue" || order.status === "Clôturée";
  const conform = order.lines.every((l) => (qty[l.productId] ?? l.quantity) === l.quantity);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6">
      <div className="glass animate-rise max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-bold uppercase">{order.ref}</h2>
            <div className="text-xs text-muted-foreground">Livraison prévue le {order.expectedAt}</div>
          </div>
          <button onClick={onClose} aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {order.lines.map((l) => (
            <div key={l.productId} className="flex items-center gap-2 rounded-xl border border-border p-2 text-xs">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{l.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  Commandé : {l.quantity} {l.unit} · {l.price} MAD
                </div>
              </div>
              {received ? (
                <span className="text-[11px] text-gold">{l.receivedQuantity ?? l.quantity} reçu</span>
              ) : (
                <Input
                  type="number"
                  className="h-8 w-20"
                  value={qty[l.productId] ?? l.quantity}
                  onChange={(e) => setQty((q) => ({ ...q, [l.productId]: Number(e.target.value) }))}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-1 rounded-2xl border border-border p-3 text-[11px] text-muted-foreground">
          {order.history.map((h, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-gold">{h.at}</span>
              <span>{h.label}</span>
            </div>
          ))}
        </div>

        {!received && (
          <>
            <Input
              className="mt-3"
              placeholder="Commentaire (écart, produit abîmé, température…)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  receiveOrder(order.id, userId, { conform, comment, receivedQuantities: qty });
                  toast.success(conform ? "Livraison confirmée conforme" : "Réception enregistrée avec écart");
                  onClose();
                }}
              >
                <PackageCheck className="mr-1.5 h-4 w-4" /> Confirmer la réception
              </Button>
            </div>
          </>
        )}
        {received && order.reception && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-success/40 bg-success/10 p-3 text-xs text-success">
            <Check className="h-4 w-4" /> Réceptionnée le {order.reception.at}
            {order.reception.conform ? " — conforme" : " — écart signalé"}
          </div>
        )}
      </div>
    </div>
  );
}
