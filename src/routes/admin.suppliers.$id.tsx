import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Eye, Mail, Package, Pencil, Plus, ShoppingCart, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { KpiCard, StatusPill } from "@/components/tc/bits";
import { TCModal } from "@/components/tc/modal";
import { OrderPreview, money } from "@/components/tc/order-document";
import { OrderWizard } from "@/components/tc/order-wizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TCSelect } from "@/components/tc/select";
import {
  addSupplierProduct,
  orderTotal,
  removeSupplierProduct,
  sendOrder,
  setOrderStatus,
  supplierOrders,
  supplierStats,
  updateSupplierProduct,
  useStore,
} from "@/lib/tc/store";
import { SUPPLIER_CATEGORIES, type PurchaseOrder, type Supplier } from "@/lib/tc/ops";

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

      <SupplierProducts supplier={supplier} />

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

interface ProductDraft {
  id?: string;
  name: string;
  reference: string;
  category: string;
  unit: string;
  price: number;
}

const EMPTY_PRODUCT: ProductDraft = { name: "", reference: "", category: "Alimentaire", unit: "carton", price: 0 };

/** Fournisseur → Produits : consultation, recherche, ajout, modification, suppression. */
function SupplierProducts({ supplier }: { supplier: Supplier }) {
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const products = supplier.products.filter((p) =>
    `${p.name} ${p.category} ${p.unit}`.toLowerCase().includes(q.trim().toLowerCase()),
  );

  const save = () => {
    if (!draft) return;
    const payload = {
      name: draft.name.trim(),
      unit: draft.unit.trim(),
      category: draft.category.trim(),
      price: Number(draft.price) || 0,
      ...(draft.reference.trim() ? { reference: draft.reference.trim() } : {}),
    };
    const err = draft.id
      ? updateSupplierProduct(supplier.id, draft.id, payload)
      : addSupplierProduct(supplier.id, payload);
    if (err) {
      setError(err);
      return;
    }
    toast.success(draft.id ? "Produit mis à jour" : "Produit ajouté");
    setError(null);
    setDraft(null);
  };

  return (
    <section className="glass rounded-3xl p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider">
            <Package className="h-4 w-4 shrink-0 text-gold" /> Produits ({supplier.products.length})
          </h3>
          <p className="text-xs text-muted-foreground">Catalogue rattaché à {supplier.name}.</p>
        </div>
        <Button
          size="sm"
          className="shrink-0"
          onClick={() => {
            setError(null);
            setDraft({ ...EMPTY_PRODUCT, category: supplier.category });
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Ajouter un produit
        </Button>
      </div>

      <div className="mt-4 max-w-sm">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un produit…" />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="py-2.5 pr-3">Produit</th>
              <th className="py-2.5 pr-3">Catégorie</th>
              <th className="py-2.5 pr-3">Unité</th>
              <th className="py-2.5 pr-3 text-right">Prix</th>
              <th className="py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border/50">
                <td className="py-3 pr-3 font-semibold">{p.name}</td>
                <td className="py-3 pr-3 text-muted-foreground">{p.category}</td>
                <td className="py-3 pr-3 text-muted-foreground">{p.unit}</td>
                <td className="tabular py-3 pr-3 text-right font-semibold text-gold">{money(p.price)}</td>
                <td className="py-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Modifier"
                      onClick={() => {
                        setError(null);
                        setDraft({
                          id: p.id,
                          name: p.name,
                          reference: p.reference ?? "",
                          category: p.category,
                          unit: p.unit,
                          price: p.price,
                        });
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" aria-label="Supprimer" onClick={() => setConfirmId(p.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  {supplier.products.length === 0 ? "Catalogue vide." : "Aucun produit ne correspond à cette recherche."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {draft && (
        <TCModal
          title={draft.id ? "Modifier le produit" : "Ajouter un produit"}
          subtitle={`Fournisseur : ${supplier.name}`}
          size="md"
          onClose={() => setDraft(null)}
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">
              {draft.id ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    removeSupplierProduct(supplier.id, draft.id!);
                    toast.success("Produit supprimé");
                    setDraft(null);
                  }}
                >
                  <Trash2 className="mr-1.5 h-4 w-4 text-destructive" /> Supprimer
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setDraft(null)}>
                  Annuler
                </Button>
                <Button onClick={save}>Enregistrer</Button>
              </div>
            </div>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Nom du produit</span>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Coca-Cola 33cl"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Référence</span>
              <Input
                value={draft.reference}
                onChange={(e) => setDraft({ ...draft, reference: e.target.value })}
                placeholder="REF-0001"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Catégorie</span>
              <TCSelect
                value={draft.category}
                onChange={(v) => setDraft({ ...draft, category: v })}
                options={SUPPLIER_CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Unité</span>
              <Input
                value={draft.unit}
                onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                placeholder="carton, kg, L…"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Prix unitaire (MAD)</span>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
              />
            </label>
            {error && (
              <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive sm:col-span-2">
                {error}
              </p>
            )}
          </div>
        </TCModal>
      )}

      {confirmId && (
        <TCModal
          title="Supprimer le produit"
          size="sm"
          onClose={() => setConfirmId(null)}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmId(null)}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  removeSupplierProduct(supplier.id, confirmId);
                  toast.success("Produit supprimé");
                  setConfirmId(null);
                }}
              >
                Supprimer
              </Button>
            </div>
          }
        >
          <p className="text-sm text-muted-foreground">
            Ce produit sera retiré du catalogue du fournisseur. Les commandes déjà émises ne sont pas modifiées.
          </p>
        </TCModal>
      )}
    </section>
  );
}
