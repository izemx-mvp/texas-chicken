import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Eye, Mail, Package, ShoppingCart, Truck } from "lucide-react";
import { toast } from "sonner";
import { KpiCard, StatusPill } from "@/components/tc/bits";
import { TCModal } from "@/components/tc/modal";
import { OrderPreview, money } from "@/components/tc/order-document";
import { OrderWizard } from "@/components/tc/order-wizard";
import { Button } from "@/components/ui/button";
import { orderTotal, sendOrder, setOrderStatus, supplierOrders, supplierStats, useStore } from "@/lib/tc/store";
import type { PurchaseOrder } from "@/lib/tc/ops";

export const Route = createFileRoute("/admin/suppliers/$id")({
  head: () => ({
    meta: [
      { title: "Fiche fournisseur — Texas Chicken Administration" },
      {
        name: "description",
        content: "Coordonnées, catalogue produits, historique des commandes et performance d'un fournisseur du réseau.",
      },
      { property: "og:title", content: "Fiche fournisseur — Texas Chicken Administration" },
      { property: "og:description", content: "Historique des commandes et catalogue produits du fournisseur." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SupplierDetail,
});

function SupplierDetail() {
  const { id } = useParams({ from: "/admin/suppliers/$id" });
  const state = useStore((s) => s);
  const supplier = state.suppliers.find((x) => x.id === id);
  const [preview, setPreview] = useState<PurchaseOrder | null>(null);
  const [wizard, setWizard] = useState(false);

  if (!supplier) {
    return (
      <div className="glass rounded-3xl p-10 text-center">
        <p className="text-sm text-muted-foreground">Fournisseur introuvable.</p>
        <Link to="/admin/suppliers" className="mt-3 inline-block text-sm font-semibold text-gold">
          Retour à l'annuaire
        </Link>
      </div>
    );
  }

  const orders = supplierOrders(supplier.id, state);
  const stats = supplierStats(supplier.id, state);

  return (
    <div className="space-y-5">
      <Link to="/admin/suppliers" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Retour aux fournisseurs
      </Link>

      <header className="glass rounded-3xl p-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">Fiche fournisseur</p>
            <h1 className="font-display text-2xl font-bold uppercase">{supplier.name}</h1>
            <p className="text-sm text-muted-foreground">
              {supplier.category} · {supplier.address}, {supplier.city}
            </p>
            <p className="text-sm text-muted-foreground">
              {supplier.contact} · {supplier.email} · {supplier.phone}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusPill status={supplier.status} />
            <Button onClick={() => setWizard(true)}>
              <ShoppingCart className="mr-1.5 h-4 w-4" /> Passer commande
            </Button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Commandes" value={stats.orders} icon={<ShoppingCart className="h-4 w-4" />} />
          <KpiCard label="En cours" value={stats.pending} tone="warning" />
          <KpiCard label="Réceptionnées" value={stats.received} tone="success" />
          <KpiCard label="Volume total" value={Math.round(stats.volume)} suffix=" MAD" />
        </div>
      </header>

      <section className="glass rounded-3xl p-5">
        <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider">
          <Package className="h-4 w-4 text-gold" /> Catalogue produits ({supplier.products.length})
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {supplier.products.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-secondary/25 p-3">
              <div className="truncate text-sm font-semibold">{p.name}</div>
              <div className="text-[11px] text-muted-foreground">
                {p.category} · {p.unit}
              </div>
              <div className="tabular mt-1 text-sm font-semibold text-gold">{money(p.price)}</div>
            </div>
          ))}
          {supplier.products.length === 0 && <p className="text-sm text-muted-foreground">Catalogue vide.</p>}
        </div>
      </section>

      <section className="glass rounded-3xl p-5">
        <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider">Historique des commandes ({orders.length})</h3>
        <div className="space-y-2">
          {orders.map((o) => {
            const rest = state.restaurants.find((r) => r.id === o.restaurantId);
            return (
              <div key={o.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-secondary/25 p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {o.ref} · {rest?.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Créée le {o.createdAt.slice(0, 10)} · livraison {o.expectedAt} · {o.lines.length} lignes ·{" "}
                    {money(orderTotal(o))}
                  </div>
                </div>
                <StatusPill status={o.status} />
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setPreview(o)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  {(o.status === "À envoyer" || o.status === "Brouillon") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const mail = sendOrder(o.id);
                        toast.success(`Commande envoyée à ${mail?.to}`);
                      }}
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {["Envoyée", "Confirmée"].includes(o.status) && (
                    <Button size="sm" variant="ghost" onClick={() => setOrderStatus(o.id, "En livraison")}>
                      <Truck className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {orders.length === 0 && <p className="text-sm text-muted-foreground">Aucune commande pour ce fournisseur.</p>}
        </div>
      </section>

      {wizard && <OrderWizard supplierId={supplier.id} onClose={() => setWizard(false)} />}
      {preview && (
        <TCModal title={`Commande ${preview.ref}`} subtitle="Document, email et historique" size="xl" onClose={() => setPreview(null)}>
          <OrderPreview order={preview} />
        </TCModal>
      )}
    </div>
  );
}
