import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Building2,
  Check,
  ClipboardList,
  Eye,
  FileText,
  Mail,
  Pencil,
  Plus,
  Power,
  ShoppingCart,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { KpiCard, SectionTitle, StatusPill } from "@/components/tc/bits";
import { TCModal } from "@/components/tc/modal";
import { TCSelect } from "@/components/tc/select";
import { OrderWizard } from "@/components/tc/order-wizard";
import { OrderPreview, money } from "@/components/tc/order-document";
import { DeliveryNoteDocument } from "@/components/tc/delivery-note";
import { DateRangeFilter } from "@/components/tc/date-range-filter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/tc/i18n";
import {
  addSupplier,
  approveRequest,
  cancelOrder,
  deliveryNoteOf,
  orderTotal,
  rejectRequest,
  removeSupplier,
  requestTotal,
  requestsFor,
  sendOrder,
  setOrderStatus,
  supplierStats,
  toggleSupplier,
  updateSupplier,
  useStore,
} from "@/lib/tc/store";
import {
  SUPPLIER_CATEGORIES,
  type DeliveryNote,
  type ProductRequest,
  type PurchaseOrder,
  type Supplier,
} from "@/lib/tc/ops";

export const Route = createFileRoute("/admin/suppliers/")({
  head: () => ({
    meta: [
      { title: "Gestion des fournisseurs — Texas Chicken Administration" },
      {
        name: "description",
        content:
          "Annuaire fournisseurs, catalogues produits, émission des bons de commande et suivi des envois pour le réseau Texas Chicken.",
      },
      { property: "og:title", content: "Gestion des fournisseurs — Texas Chicken Administration" },
      { property: "og:description", content: "CRUD fournisseurs, commandes, documents officiels et envoi email simulé." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SuppliersPage,
});

const EMPTY: Omit<Supplier, "id" | "products"> = {
  name: "",
  category: "Alimentaire",
  contact: "",
  email: "",
  phone: "",
  address: "",
  city: "Casablanca",
  status: "Actif",
  notes: "",
  leadTimeDays: 2,
};

function SuppliersPage() {
  const state = useStore((s) => s);
  const { tr: L } = useLang();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"fournisseurs" | "demandes" | "commandes">("fournisseurs");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [form, setForm] = useState<(Omit<Supplier, "id" | "products"> & { id?: string }) | null>(null);
  const [wizard, setWizard] = useState<{ supplierId?: string; requestId?: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<PurchaseOrder | null>(null);
  const [noteView, setNoteView] = useState<DeliveryNote | null>(null);
  const [reject, setReject] = useState<ProductRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const suppliers = useMemo(
    () =>
      state.suppliers.filter(
        (s) =>
          (cat === "all" || s.category === cat) &&
          `${s.name} ${s.contact} ${s.email} ${s.city}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [state.suppliers, cat, q],
  );

  const allOrders = [...state.purchaseOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const orders = allOrders.filter((o) => {
    const d = o.createdAt.slice(0, 10);
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });
  const toSend = allOrders.filter((o) => o.status === "À envoyer" || o.status === "Brouillon");
  /** Une fois commandée (ou livrée), la demande quitte la file et vit dans l'onglet Commandes. */
  /** Onglet Demandes : uniquement les demandes encore à traiter (en attente ou approuvées non commandées). */
  const requests = requestsFor(null, state).filter(
    (r) => r.status === "En attente" || r.status === "Approuvée",
  );
  const pendingCount = requests.filter((r) => r.status === "En attente").length;

  const save = () => {
    if (!form) return;
    const { id, ...data } = form;
    const err = id ? updateSupplier(id, data) : addSupplier(data);
    if (err) {
      toast.error(err);
      return;
    }
    toast.success(id ? "Fournisseur mis à jour" : "Fournisseur créé");
    setForm(null);
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Gestion des fournisseurs"
        subtitle="Annuaire, catalogues, bons de commande et envois — cycle complet d'approvisionnement"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Fournisseurs" value={state.suppliers.length} icon={<Building2 className="h-4 w-4" />} />
        <KpiCard
          label="Demandes en attente"
          value={pendingCount}
          tone={pendingCount ? "warning" : "success"}
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <KpiCard label={L("Commandes")} value={allOrders.length} icon={<ShoppingCart className="h-4 w-4" />} />
        <KpiCard label="À envoyer" value={toSend.length} tone="warning" icon={<Mail className="h-4 w-4" />} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-[16rem] flex-1 gap-1 rounded-xl border border-border p-1">
          {(["fournisseurs", "demandes", "commandes"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-widest transition-colors",
                tab === t ? "bg-brand/20 text-foreground" : "text-muted-foreground",
              )}
            >
              {t === "fournisseurs"
                ? L("Fournisseurs")
                : t === "demandes"
                  ? `${L("Demandes")}${pendingCount ? ` (${pendingCount})` : ""}`
                  : L("Commandes")}
            </button>
          ))}
        </div>
        <Button onClick={() => setWizard({})}>
          <ShoppingCart className="mr-1.5 h-4 w-4" /> Nouvelle commande
        </Button>
        <Button variant="ghost" onClick={() => setForm({ ...EMPTY })}>
          <Plus className="mr-1.5 h-4 w-4" /> {L("Fournisseur")}
        </Button>
      </div>

      {tab === "fournisseurs" ? (
        <>
          <div className="flex flex-wrap gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un fournisseur…" className="max-w-xs" />
            <div className="w-52">
              <TCSelect
                value={cat}
                onChange={setCat}
                options={[
                  { value: "all", label: "Toutes catégories" },
                  ...SUPPLIER_CATEGORIES.map((c) => ({ value: c, label: c })),
                ]}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {suppliers.map((s) => {
              const st = supplierStats(s.id, state);
              return (
                <article key={s.id} className="glass hover-lift rounded-3xl p-4">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-display text-base font-bold uppercase">{s.name}</h3>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {s.category} · {s.city} · délai {s.leadTimeDays} j
                      </p>
                    </div>
                    <StatusPill status={s.status} />
                  </div>
                  <p className="mt-2 truncate text-xs text-muted-foreground">
                    {s.contact} · {s.email}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <Mini label="Commandes" value={String(st.orders)} />
                    <Mini label="En cours" value={String(st.pending)} />
                    <Mini label="Volume" value={money(st.volume)} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => navigate({ to: "/admin/suppliers/$id", params: { id: s.id } })}>
                      <Eye className="mr-1 h-3.5 w-3.5" /> Fiche
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setWizard({ supplierId: s.id })}>
                      <ShoppingCart className="mr-1 h-3.5 w-3.5" /> Commander
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setForm({ ...s })}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleSupplier(s.id)}>
                      <Power className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        removeSupplier(s.id);
                        toast.success("Fournisseur supprimé");
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </article>
              );
            })}
            {suppliers.length === 0 && (
              <p className="glass rounded-3xl p-6 text-center text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
                Aucun fournisseur ne correspond à cette recherche.
              </p>
            )}
          </div>
        </>
      ) : tab === "demandes" ? (
        <div className="space-y-3">
          {requests.map((r) => {
            const sup = state.suppliers.find((x) => x.id === r.supplierId);
            const rest = state.restaurants.find((x) => x.id === r.restaurantId);
            const requester = state.users.find((u) => u.id === r.requesterId);
            return (
              <article key={r.id} className="glass rounded-3xl p-4">
                <div className="flex flex-wrap items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-sm font-bold uppercase">
                      {r.ref} · {rest?.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {sup?.name} · demandé par {requester ? `${requester.firstName} ${requester.lastName}` : "—"} le{" "}
                      {r.createdAt.slice(0, 10)}
                    </p>
                  </div>
                  <StatusPill status={r.status} />
                </div>

                <div className="mt-3 space-y-1 rounded-2xl border border-border bg-secondary/25 p-3 text-xs">
                  {r.lines.map((l) => (
                    <div key={l.productId} className="flex justify-between border-b border-border/40 py-1 last:border-0">
                      <span className="truncate">{l.name}</span>
                      <span className="tabular shrink-0 pl-3">
                        {l.quantity} {l.unit} · {money(l.quantity * l.price)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-1 font-semibold">
                    <span>Total estimé</span>
                    <span className="tabular">{money(requestTotal(r))}</span>
                  </div>
                </div>

                {r.note && <p className="mt-2 text-[11px] text-muted-foreground">Note : {r.note}</p>}
                {r.status === "Rejetée" && r.decision?.reason && (
                  <p className="mt-2 rounded-xl border border-destructive/40 bg-destructive/10 p-2 text-[11px] text-destructive">
                    Rejetée le {r.decision.at} : {r.decision.reason}
                  </p>
                )}

                {r.status === "En attente" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={busy === r.id}
                      onClick={() => {
                        if (busy === r.id) return;
                        setBusy(r.id);
                        approveRequest(r.id, "u0");
                        toast.success(`Demande ${r.ref} approuvée`);
                      }}
                    >
                      <Check className="mr-1.5 h-3.5 w-3.5" /> Approuver
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy === r.id}
                      onClick={() => {
                        setReject(r);
                        setRejectReason("");
                      }}
                    >
                      <X className="mr-1.5 h-3.5 w-3.5 text-destructive" /> Rejeter
                    </Button>
                  </div>
                )}
                {r.status === "Approuvée" && (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={!!wizard}
                      onClick={() => setWizard({ supplierId: r.supplierId, requestId: r.id })}
                    >
                      <ShoppingCart className="mr-1.5 h-3.5 w-3.5" /> Créer le bon de commande
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
          {requests.length === 0 && (
            <p className="glass rounded-3xl p-6 text-center text-sm text-muted-foreground">
              Aucune demande de marchandise pour le moment.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <DateRangeFilter
            className="glass rounded-3xl p-3"
            from={from}
            to={to}
            onFrom={setFrom}
            onTo={setTo}
            onReset={() => {
              setFrom("");
              setTo("");
            }}
            info={`${orders.length} / ${allOrders.length}`}
          />

          <div className="glass overflow-x-auto rounded-3xl p-4">
            <table className="w-full min-w-[900px] table-auto text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="py-2">Référence</th>
                  <th className="py-2">Fournisseur</th>
                  <th className="py-2">Restaurant</th>
                  <th className="py-2">Livraison</th>
                  <th className="w-32 py-2 text-right">Total</th>
                  <th className="w-36 py-2 pl-4">Statut</th>
                  <th className="w-40 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const sup = state.suppliers.find((x) => x.id === o.supplierId);
                  const rest = state.restaurants.find((r) => r.id === o.restaurantId);
                  const bl = deliveryNoteOf(o.id, state);
                  return (
                    <tr key={o.id} className="border-b border-border/50 align-middle">
                      <td className="py-2 font-semibold">{o.ref}</td>
                      <td className="py-2">{sup?.name}</td>
                      <td className="py-2 text-muted-foreground">{rest?.name}</td>
                      <td className="tabular py-2 text-muted-foreground">{o.expectedAt}</td>
                      <td className="tabular w-32 whitespace-nowrap py-2 text-right">{money(orderTotal(o))}</td>
                      <td className="w-36 py-2 pl-4">
                        <StatusPill status={o.status} />
                      </td>
                      <td className="w-40 py-2">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setPreview(o)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {bl && (
                            <Button size="sm" variant="ghost" onClick={() => setNoteView(bl)} title={`Bon de livraison ${bl.ref}`}>
                              <FileText className="h-3.5 w-3.5 text-success" />
                            </Button>
                          )}
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
                          {!["Annulée", "Livrée", "Reçue", "Clôturée"].includes(o.status) && (
                            <Button size="sm" variant="ghost" onClick={() => cancelOrder(o.id, "Décision Administration")}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-muted-foreground">
                      Aucune commande sur cette période.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reject && (
        <TCModal
          title={`Rejeter la demande ${reject.ref}`}
          subtitle="Le motif est transmis au manager du restaurant"
          size="sm"
          onClose={() => setReject(null)}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setReject(null)}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  const err = rejectRequest(reject.id, "u0", rejectReason);
                  if (err) {
                    toast.error(err);
                    return;
                  }
                  toast.success("Demande rejetée");
                  setReject(null);
                }}
              >
                Confirmer le rejet
              </Button>
            </div>
          }
        >
          <Textarea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Motif du rejet (budget, produit indisponible, quantité excessive…)"
          />
        </TCModal>
      )}

      {noteView && (
        <TCModal
          title={`Bon de livraison ${noteView.ref}`}
          subtitle="Réception confirmée par le restaurant"
          size="xl"
          onClose={() => setNoteView(null)}
        >
          <DeliveryNoteDocument note={noteView} />
        </TCModal>
      )}

      {form && (
        <TCModal
          title={form.id ? "Modifier le fournisseur" : "Nouveau fournisseur"}
          subtitle="Coordonnées complètes — l'email est utilisé pour l'envoi des bons de commande"
          size="md"
          onClose={() => setForm(null)}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setForm(null)}>
                Annuler
              </Button>
              <Button onClick={save}>Enregistrer</Button>
            </div>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Entreprise" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Catégorie</span>
              <TCSelect
                value={form.category}
                onChange={(v) => setForm({ ...form, category: v })}
                options={SUPPLIER_CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
            </label>
            <Field label="Contact" value={form.contact} onChange={(v) => setForm({ ...form, contact: v })} />
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Field label="Ville" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
            <Field label="Adresse" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Délai (jours)</span>
              <Input
                type="number"
                min={0}
                value={form.leadTimeDays}
                onChange={(e) => setForm({ ...form, leadTimeDays: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Notes</span>
              <Textarea rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </label>
          </div>
        </TCModal>
      )}

      {wizard && <OrderWizard supplierId={wizard.supplierId} onClose={() => setWizard(null)} />}

      {preview && (
        <TCModal
          title={`Commande ${preview.ref}`}
          subtitle="Document officiel, email et historique"
          size="xl"
          onClose={() => setPreview(null)}
        >
          <OrderPreview order={preview} />
        </TCModal>
      )}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="truncate text-xs font-semibold">{value}</div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
