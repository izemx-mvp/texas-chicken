import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, ClipboardList, FileText, PackageCheck, Plus, Search, Trash2, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionTitle, StatusPill } from "@/components/tc/bits";
import { TCModal } from "@/components/tc/modal";
import { TCSelect } from "@/components/tc/select";
import { DeliveryNoteDocument } from "@/components/tc/delivery-note";
import { SingleFileUpload, type UploadedDoc } from "@/components/tc/upload";

import { money } from "@/components/tc/order-document";
import { cn } from "@/lib/utils";
import {
  createDeliveryNote,
  currentUser,
  deliveryNoteOf,
  deliveryStats,
  orderTotal,
  ordersFor,
  requestTotal,
  requestsFor,
  submitRequest,
  useStore,
} from "@/lib/tc/store";
import type { DeliveryNote, ProductRequest, PurchaseOrder, RequestLine } from "@/lib/tc/ops";
import { ChatContextButton } from "@/components/tc/chat-dock";

export const Route = createFileRoute("/app/deliveries")({
  head: () => ({
    meta: [
      { title: "Commande & réceptions — Texas Chicken Operations" },
      {
        name: "description",
        content:
          "Demandez la marchandise dont votre restaurant a besoin, suivez les commandes fournisseurs et confirmez la réception avec un bon de livraison.",
      },
      { property: "og:title", content: "Commande & réceptions — Texas Chicken Operations" },
      {
        property: "og:description",
        content: "Demandes de marchandise, commandes attendues, retards et bons de livraison signés.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommandePage,
});

const TABS = ["Mes demandes", "Attendues", "En livraison", "En retard", "Reçues"] as const;

function CommandePage() {
  const state = useStore((s) => s);
  const me = currentUser();
  const orders = useMemo(() => ordersFor(me?.restaurantId, state), [state, me?.restaurantId]);
  const requests = useMemo(() => requestsFor(me?.restaurantId, state), [state, me?.restaurantId]);
  const stats = deliveryStats(orders);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Mes demandes");
  const [open, setOpen] = useState<PurchaseOrder | null>(null);
  const [newRequest, setNewRequest] = useState(false);
  const [noteView, setNoteView] = useState<DeliveryNote | null>(null);

  const list = orders.filter((o) => {
    if (tab === "Attendues")
      return ["Envoyée", "Confirmée", "En préparation", "Expédiée", "En livraison", "En retard"].includes(o.status);
    if (tab === "En livraison") return o.status === "En livraison" || o.status === "Expédiée";
    if (tab === "En retard") return o.status === "En retard";
    return ["Reçue", "Livrée", "Clôturée"].includes(o.status);
  });

  const supplierName = (id: string) => state.suppliers.find((s) => s.id === id)?.name ?? "Fournisseur";
  const pending = requests.filter((r) => r.status === "En attente").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle title="Commande" subtitle="Demandes de marchandise et réceptions de votre restaurant" />
        <div className="flex flex-wrap gap-2">
          <ChatContextButton label="Discuter livraisons" target={{ match: "logistique" }} />
          <Button size="sm" onClick={() => setNewRequest(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Nouvelle demande
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[
          ["Demandes", pending],
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

      {tab === "Mes demandes" ? (
        <div className="space-y-2">
          {requests.map((r) => (
            <RequestCard key={r.id} request={r} supplierName={supplierName(r.supplierId)} />
          ))}
          {requests.length === 0 && (
            <div className="glass grid place-items-center gap-2 rounded-2xl p-10 text-center text-sm text-muted-foreground">
              <ClipboardList className="h-8 w-8 text-gold" />
              Aucune demande pour le moment — créez votre première demande de marchandise.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((o) => {
            const bl = deliveryNoteOf(o.id, state);
            return (
              <div key={o.id} className="glass rounded-2xl p-4">
                <button onClick={() => setOpen(o)} className="block w-full text-left">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-gold" />
                    <span className="font-semibold">{o.ref}</span>
                    <StatusPill status={o.status} className="ml-auto" />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{supplierName(o.supplierId)}</div>
                  <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                    <span>Prévu le {o.expectedAt}</span>
                    <span>{o.lines.length} références</span>
                    <span className="text-gold">{money(orderTotal(o))}</span>
                  </div>
                </button>
                {bl && (
                  <button
                    onClick={() => setNoteView(bl)}
                    className="mt-2 flex items-center gap-1.5 rounded-xl border border-success/40 bg-success/10 px-2.5 py-1.5 text-[11px] font-semibold text-success"
                  >
                    <FileText className="h-3.5 w-3.5" /> Bon de livraison {bl.ref}
                  </button>
                )}
              </div>
            );
          })}
          {list.length === 0 && (
            <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">Aucune livraison ici.</div>
          )}
        </div>
      )}

      {open && (
        <ReceptionModal
          order={open}
          onClose={() => setOpen(null)}
          userId={me?.id ?? ""}
          onGenerated={(bl) => {
            setOpen(null);
            setNoteView(bl);
          }}
        />
      )}

      {newRequest && (
        <RequestModal
          onClose={() => setNewRequest(false)}
          restaurantId={me?.restaurantId ?? ""}
          userId={me?.id ?? ""}
        />
      )}

      {noteView && (
        <TCModal
          title={`Bon de livraison ${noteView.ref}`}
          subtitle="Document de réception rattaché à la commande fournisseur"
          size="xl"
          onClose={() => setNoteView(null)}
        >
          <DeliveryNoteDocument note={noteView} />
        </TCModal>
      )}
    </div>
  );
}

/* ------------------------- demandes de marchandise ------------------------- */

function RequestCard({ request, supplierName }: { request: ProductRequest; supplierName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass rounded-2xl p-4">
      <button onClick={() => setOpen((o) => !o)} className="block w-full text-left">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-gold" />
          <span className="font-semibold">{request.ref}</span>
          <StatusPill status={request.status} className="ml-auto" />
        </div>
        <div className="mt-1 text-xs text-muted-foreground">{supplierName}</div>
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          <span>Créée le {request.createdAt.slice(0, 10)}</span>
          <span>{request.lines.length} produits</span>
          <span className="text-gold">{money(requestTotal(request))}</span>
        </div>
      </button>
      {request.status === "Rejetée" && request.decision?.reason && (
        <p className="mt-2 rounded-xl border border-destructive/40 bg-destructive/10 p-2 text-[11px] text-destructive">
          Rejetée : {request.decision.reason}
        </p>
      )}
      {open && (
        <div className="mt-3 space-y-1 rounded-xl border border-border bg-secondary/25 p-3 text-xs">
          {request.lines.map((l) => (
            <div key={l.productId} className="flex justify-between border-b border-border/40 py-1 last:border-0">
              <span>{l.name}</span>
              <span className="tabular">
                {l.quantity} {l.unit}
              </span>
            </div>
          ))}
          {request.note && <p className="pt-1 text-muted-foreground">Note : {request.note}</p>}
        </div>
      )}
    </div>
  );
}

function RequestModal({
  onClose,
  restaurantId,
  userId,
}: {
  onClose: () => void;
  restaurantId: string;
  userId: string;
}) {
  const state = useStore((s) => s);
  const suppliers = state.suppliers.filter((s) => s.status === "Actif");
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [q, setQ] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");

  const supplier = state.suppliers.find((s) => s.id === supplierId);
  const products = (supplier?.products ?? []).filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  const lines: RequestLine[] = Object.entries(qty)
    .filter(([, v]) => v > 0)
    .map(([pid, v]) => {
      const p = supplier?.products.find((x) => x.id === pid);
      return {
        productId: pid,
        name: p?.name ?? pid,
        unit: p?.unit ?? "unité",
        quantity: v,
        price: p?.price ?? 0,
      };
    });
  const total = lines.reduce((a, l) => a + l.quantity * l.price, 0);

  const submit = () => {
    const { error, request } = submitRequest({ restaurantId, requesterId: userId, supplierId, lines, note });
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(`Demande ${request?.ref} envoyée à l'Administration`);
    onClose();
  };

  return (
    <TCModal
      title="Nouvelle demande de marchandise"
      subtitle="Indiquez les produits et quantités dont votre restaurant a besoin"
      size="lg"
      onClose={onClose}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="tabular text-xs text-muted-foreground">
            {lines.length} produit(s) · {money(total)}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={submit} disabled={lines.length === 0}>
              <Check className="mr-1.5 h-4 w-4" /> Envoyer la demande
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Fournisseur</span>
          <TCSelect
            value={supplierId}
            onChange={(v) => {
              setSupplierId(v);
              setQty({});
            }}
            searchable
            options={suppliers.map((s) => ({
              value: s.id,
              label: s.name,
              description: `${s.category} · ${s.city}`,
              group: s.category,
            }))}
          />
        </label>

        <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un produit…"
            className="h-10 w-full bg-transparent text-sm outline-none"
          />
        </div>

        <div className="space-y-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-secondary/25 p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{p.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {money(p.price)} / {p.unit}
                </div>
              </div>
              <Input
                type="number"
                min={0}
                className="w-24"
                value={qty[p.id] ?? 0}
                onChange={(e) => setQty((s) => ({ ...s, [p.id]: Math.max(0, Number(e.target.value) || 0) }))}
              />
              {(qty[p.id] ?? 0) > 0 && (
                <button
                  onClick={() => setQty((s) => ({ ...s, [p.id]: 0 }))}
                  aria-label="Retirer le produit"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {products.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun produit ne correspond à cette recherche.</p>
          )}
        </div>

        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
            Commentaire (optionnel)
          </span>
          <Textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Urgence, contrainte de livraison, précision produit…"
          />
        </label>
      </div>
    </TCModal>
  );
}

/* --------------------------- réception / bon de livraison --------------------------- */

function ReceptionModal({
  order,
  onClose,
  userId,
  onGenerated,
}: {
  order: PurchaseOrder;
  onClose: () => void;
  userId: string;
  onGenerated: (note: DeliveryNote) => void;
}) {
  const state = useStore((s) => s);
  const supplier = state.suppliers.find((s) => s.id === order.supplierId);
  const restaurant = state.restaurants.find((r) => r.id === order.restaurantId);
  const request = state.productRequests.find((r) => r.orderId === order.id);
  const existing = deliveryNoteOf(order.id, state);
  const [qty, setQty] = useState<Record<string, number>>(
    Object.fromEntries(order.lines.map((l) => [l.productId, l.receivedQuantity ?? l.quantity])),
  );
  const [comment, setComment] = useState("");
  const [noteRef, setNoteRef] = useState("");
  const [carrier, setCarrier] = useState("");
  const [temperature, setTemperature] = useState("");
  const [doc, setDoc] = useState<UploadedDoc | null>(null);
  const received = ["Reçue", "Livrée", "Clôturée"].includes(order.status);
  const conform = order.lines.every((l) => (qty[l.productId] ?? l.quantity) === l.quantity);
  const receivedValue = order.lines.reduce((a, l) => a + (qty[l.productId] ?? l.quantity) * l.price, 0);

  const confirm = () => {
    if (!doc) {
      toast.error("Importez le bon de livraison remis par le livreur pour confirmer la réception.");
      return;
    }
    const note = createDeliveryNote(order.id, userId, {
      comment,
      receivedQuantities: qty,
      supplierNoteRef: noteRef,
      carrier,
      temperature,
      document: { ...doc, uploadedAt: new Date().toISOString().slice(0, 16).replace("T", " ") },
    });
    if (!note) {
      toast.error("Impossible de générer le bon de livraison.");
      return;
    }
    toast.success(`Réception confirmée — commande ${order.ref} marquée « Livrée »`);
    onGenerated(note);
  };

  return (
    <TCModal
      title={order.ref}
      subtitle={`${supplier?.name ?? "Fournisseur"} · livraison prévue le ${order.expectedAt}`}
      size="xl"
      onClose={onClose}
      footer={
        received ? (
          <div className="flex justify-end">
            <Button variant="ghost" onClick={onClose}>
              Fermer
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {conform ? "Quantités conformes à la commande" : "Écart détecté sur les quantités"} ·{" "}
              {doc ? "bon de livraison importé" : "bon de livraison requis"}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                Annuler
              </Button>
              <Button onClick={confirm} disabled={!doc}>
                <PackageCheck className="mr-1.5 h-4 w-4" /> Confirmer la réception (Livrée)
              </Button>
            </div>
          </div>
        )
      }
    >
      <div className="space-y-4">
        {/* ---- récapitulatif complet de la commande ---- */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Fournisseur", supplier?.name ?? "—"],
            ["Contact", supplier ? `${supplier.contact} · ${supplier.phone}` : "—"],
            ["Restaurant", restaurant?.name ?? "—"],
            ["Demande d'origine", request?.ref ?? "—"],
            ["Émise le", order.createdAt],
            ["Envoyée le", order.sentAt ?? "—"],
            ["Prévue le", order.expectedAt],
            ["Statut", order.status],
          ].map(([l, v]) => (
            <div key={l} className="rounded-xl border border-border bg-secondary/30 px-3 py-2">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{l}</div>
              <div className="truncate text-xs font-semibold">{v}</div>
            </div>
          ))}
        </div>

        {order.note && (
          <p className="rounded-xl border border-border bg-secondary/25 p-3 text-xs text-muted-foreground">
            Note de commande : {order.note}
          </p>
        )}

        {/* ---- lignes détaillées ---- */}
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead className="bg-secondary/50 text-[9px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Produit</th>
                <th className="px-3 py-2">Unité</th>
                <th className="px-3 py-2 text-right">Commandé</th>
                <th className="px-3 py-2 text-right">PU</th>
                <th className="px-3 py-2 text-right">Reçu</th>
                <th className="px-3 py-2 text-right">Écart</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((l) => {
                const got = qty[l.productId] ?? l.quantity;
                const gap = got - l.quantity;
                return (
                  <tr key={l.productId} className="border-t border-border/50">
                    <td className="px-3 py-2 font-medium">{l.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{l.unit}</td>
                    <td className="tabular px-3 py-2 text-right">{l.quantity}</td>
                    <td className="tabular px-3 py-2 text-right">{money(l.price)}</td>
                    <td className="px-3 py-2 text-right">
                      {received ? (
                        <span className="tabular text-gold">{l.receivedQuantity ?? l.quantity}</span>
                      ) : (
                        <Input
                          type="number"
                          min={0}
                          className="ml-auto h-8 w-20"
                          value={got}
                          onChange={(e) => setQty((q) => ({ ...q, [l.productId]: Number(e.target.value) }))}
                        />
                      )}
                    </td>
                    <td
                      className={cn(
                        "tabular px-3 py-2 text-right font-semibold",
                        gap === 0 ? "text-success" : "text-destructive",
                      )}
                    >
                      {gap === 0 ? "—" : gap > 0 ? `+${gap}` : gap}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-secondary/30">
                <td className="px-3 py-2 font-semibold" colSpan={4}>
                  Valeur reçue
                </td>
                <td className="tabular px-3 py-2 text-right font-bold text-gold" colSpan={2}>
                  {money(receivedValue)} / {money(orderTotal(order))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ---- saisie de réception ---- */}
        {!received ? (
          <div className="space-y-3 rounded-2xl border border-gold/40 bg-gold/5 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-gold">
              Confirmation de réception
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                  N° du bon fournisseur
                </span>
                <Input value={noteRef} onChange={(e) => setNoteRef(e.target.value)} placeholder="BLF-2418" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                  Livreur / véhicule
                </span>
                <Input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="Nom — plaque" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                  Température relevée
                </span>
                <Input value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="2 °C" />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                Bon de livraison (obligatoire)
              </span>
              <SingleFileUpload value={doc} onChange={setDoc} />
            </label>
            <Textarea
              rows={2}
              placeholder="Commentaire (écart, produit abîmé, retard, température…)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        ) : (
          <div className="space-y-2">
            {order.reception && (
              <div className="flex items-center gap-2 rounded-xl border border-success/40 bg-success/10 p-3 text-xs text-success">
                <Check className="h-4 w-4" /> Réceptionnée le {order.reception.at}
                {order.reception.conform ? " — conforme" : " — écart signalé"}
              </div>
            )}
            {existing && (
              <button
                onClick={() => onGenerated(existing)}
                className="flex w-full items-center gap-2 rounded-xl border border-border bg-secondary/30 p-3 text-left text-xs font-semibold"
              >
                <FileText className="h-4 w-4 text-gold" /> Voir le bon de livraison {existing.ref}
                {existing.document ? ` · ${existing.document.name}` : ""}
              </button>
            )}
          </div>
        )}

        {/* ---- historique ---- */}
        <div className="space-y-1 rounded-2xl border border-border p-3 text-[11px] text-muted-foreground">
          <div className="mb-1 text-[9px] font-semibold uppercase tracking-widest">Historique de la commande</div>
          {order.history.map((h, i) => (
            <div key={i} className="flex gap-2">
              <span className="tabular shrink-0 text-gold">{h.at}</span>
              <span>{h.label}</span>
            </div>
          ))}
        </div>
      </div>
    </TCModal>
  );
}


/** Icône réutilisée pour fermer les popups internes (compat historique). */
export const CloseIcon = X;
