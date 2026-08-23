/**
 * Workflow complet d'émission d'une commande fournisseur (7 étapes) :
 * fournisseur → restaurant & date → produits → quantités → récapitulatif →
 * document officiel → email et envoi simulé.
 */
import { useMemo, useState } from "react";
import { Check, Send, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { TCModal } from "./modal";
import { TCSelect } from "./select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { EmailPreview, OrderDocument, money } from "./order-document";
import { createOrder, currentUser, orderEmail, sendOrder, shiftDate, useStore } from "@/lib/tc/store";
import { TODAY } from "@/lib/tc/data";
import type { OrderLine, PurchaseOrder } from "@/lib/tc/ops";

const STEPS = [
  "Fournisseur",
  "Destination",
  "Produits",
  "Quantités",
  "Récapitulatif",
  "Document",
  "Envoi",
];

export function OrderWizard({
  onClose,
  supplierId: initialSupplier,
  restaurantId: initialRestaurant,
}: {
  onClose: () => void;
  supplierId?: string;
  restaurantId?: string;
}) {
  const state = useStore((s) => s);
  const user = useStore(() => currentUser());
  const suppliers = state.suppliers.filter((x) => x.status === "Actif");

  const [step, setStep] = useState(0);
  const [supplierId, setSupplierId] = useState(initialSupplier ?? suppliers[0]?.id ?? "");
  const [restaurantId, setRestaurantId] = useState(initialRestaurant ?? state.restaurants[0]?.id ?? "r1");
  const [expectedAt, setExpectedAt] = useState(shiftDate(TODAY, 2));
  const [note, setNote] = useState("");
  const [picked, setPicked] = useState<Record<string, { quantity: number; priority: "Normale" | "Urgente" }>>({});
  const [created, setCreated] = useState<PurchaseOrder | null>(null);
  const [sent, setSent] = useState(false);

  const supplier = state.suppliers.find((x) => x.id === supplierId);
  const restaurant = state.restaurants.find((r) => r.id === restaurantId);

  const lines: OrderLine[] = useMemo(
    () =>
      Object.entries(picked)
        .filter(([, v]) => v.quantity > 0)
        .map(([pid, v]) => {
          const p = supplier?.products.find((x) => x.id === pid);
          return {
            productId: pid,
            name: p?.name ?? pid,
            unit: p?.unit ?? "unité",
            price: p?.price ?? 0,
            quantity: v.quantity,
            priority: v.priority,
          };
        }),
    [picked, supplier],
  );

  const total = lines.reduce((a, l) => a + l.quantity * l.price, 0);
  const draftRef = created?.ref ?? "BC-2026-XXX";
  const mail = created ? orderEmail(created, state) : null;

  const canNext =
    step === 0 ? !!supplierId : step === 1 ? !!restaurantId && !!expectedAt : step === 2 || step === 3 ? lines.length > 0 : true;

  const next = () => {
    if (step === 4 && !created) {
      const order = createOrder({
        supplierId,
        restaurantId,
        lines,
        note: note.trim() || undefined,
        createdBy: user?.id ?? "u1",
        expectedAt,
        status: "À envoyer",
      });
      setCreated(order);
      toast.success(`Bon de commande ${order.ref} créé`);
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const send = () => {
    if (!created) return;
    sendOrder(created.id);
    setSent(true);
    toast.success(`Commande ${created.ref} envoyée à ${supplier?.email}`);
  };

  return (
    <TCModal
      title="Nouvelle commande fournisseur"
      subtitle={`Étape ${step + 1}/${STEPS.length} — ${STEPS[step]}`}
      size="xl"
      onClose={onClose}
      toolbar={
        <div className="flex flex-wrap gap-1">
          {STEPS.map((label, i) => (
            <span
              key={label}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                i === step
                  ? "border-gold/60 bg-gold/15 text-gold"
                  : i < step
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-border text-muted-foreground",
              )}
            >
              {i < step ? <Check className="mr-1 inline h-3 w-3" /> : null}
              {label}
            </span>
          ))}
        </div>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="tabular text-xs text-muted-foreground">
            {lines.length} ligne(s) · Total HT {money(total)}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}>
              {step === 0 ? "Annuler" : "Retour"}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next} disabled={!canNext}>
                Continuer
              </Button>
            ) : sent ? (
              <Button onClick={onClose}>Terminer</Button>
            ) : (
              <Button onClick={send}>
                <Send className="mr-1.5 h-4 w-4" /> Envoyer au fournisseur
              </Button>
            )}
          </div>
        </div>
      }
    >
      {step === 0 && (
        <div className="space-y-3">
          <TCSelect
            value={supplierId}
            onChange={(v) => {
              setSupplierId(v);
              setPicked({});
            }}
            searchable
            options={suppliers.map((s) => ({
              value: s.id,
              label: s.name,
              description: `${s.category} · ${s.city} · délai ${s.leadTimeDays} j`,
              group: s.category,
            }))}
          />
          {supplier && (
            <div className="rounded-2xl border border-border bg-secondary/25 p-4 text-sm">
              <div className="font-display text-base font-bold uppercase">{supplier.name}</div>
              <p className="text-xs text-muted-foreground">
                {supplier.contact} · {supplier.email} · {supplier.phone}
              </p>
              <p className="text-xs text-muted-foreground">
                {supplier.address}, {supplier.city} · {supplier.products.length} produits au catalogue
              </p>
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Restaurant</span>
            <TCSelect
              value={restaurantId}
              onChange={setRestaurantId}
              searchable
              options={state.restaurants.map((r) => ({ value: r.id, label: r.name, description: r.city }))}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
              Livraison souhaitée
            </span>
            <Input type="date" value={expectedAt} min={TODAY} onChange={(e) => setExpectedAt(e.target.value)} />
          </label>
          {restaurant && (
            <p className="sm:col-span-2 rounded-xl border border-border bg-secondary/25 p-3 text-xs text-muted-foreground">
              Adresse de livraison : {restaurant.address}, {restaurant.city}
              {supplier ? ` · délai fournisseur indicatif : ${supplier.leadTimeDays} jour(s)` : ""}
            </p>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-2">
          {supplier?.products.map((p) => {
            const on = !!picked[p.id];
            return (
              <button
                key={p.id}
                onClick={() =>
                  setPicked((prev) => {
                    const nextState = { ...prev };
                    if (on) delete nextState[p.id];
                    else nextState[p.id] = { quantity: 1, priority: "Normale" };
                    return nextState;
                  })
                }
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
                  on ? "border-gold/60 bg-gold/10" : "border-border bg-secondary/25",
                )}
              >
                <span
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-md border",
                    on ? "border-gold bg-gold text-background" : "border-border",
                  )}
                >
                  {on && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{p.name}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {p.category} · {p.unit}
                  </span>
                </span>
                <span className="tabular shrink-0 text-sm font-semibold">{money(p.price)}</span>
              </button>
            );
          })}
          {!supplier?.products.length && (
            <p className="text-sm text-muted-foreground">Ce fournisseur n'a pas encore de catalogue produit.</p>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-2">
          {lines.map((l) => (
            <div key={l.productId} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-secondary/25 p-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{l.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {money(l.price)} / {l.unit}
                </div>
              </div>
              <Input
                type="number"
                min={1}
                value={l.quantity}
                onChange={(e) =>
                  setPicked((prev) => ({
                    ...prev,
                    [l.productId]: { ...prev[l.productId]!, quantity: Math.max(1, Number(e.target.value) || 1) },
                  }))
                }
                className="w-24"
              />
              <button
                onClick={() =>
                  setPicked((prev) => ({
                    ...prev,
                    [l.productId]: {
                      ...prev[l.productId]!,
                      priority: prev[l.productId]!.priority === "Urgente" ? "Normale" : "Urgente",
                    },
                  }))
                }
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                  l.priority === "Urgente"
                    ? "border-destructive/50 bg-destructive/10 text-destructive"
                    : "border-border text-muted-foreground",
                )}
              >
                {l.priority}
              </button>
              <span className="tabular w-28 text-right text-sm font-semibold">{money(l.quantity * l.price)}</span>
            </div>
          ))}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <Recap label="Fournisseur" value={supplier?.name ?? "—"} />
            <Recap label="Restaurant" value={restaurant?.name ?? "—"} />
            <Recap label="Livraison" value={expectedAt} />
          </div>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
              Note pour le fournisseur
            </span>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Instructions de livraison, contraintes horaires…" />
          </label>
          <div className="rounded-2xl border border-border bg-secondary/25 p-3 text-sm">
            {lines.map((l) => (
              <div key={l.productId} className="flex justify-between border-b border-border/50 py-1 last:border-0">
                <span>
                  {l.name} × {l.quantity} {l.unit}
                </span>
                <span className="tabular font-semibold">{money(l.quantity * l.price)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between font-display text-base font-bold">
              <span>Total HT</span>
              <span className="tabular">{money(total)}</span>
            </div>
          </div>
        </div>
      )}

      {step === 5 && (
        <OrderDocument
          ref_={draftRef}
          supplier={supplier}
          restaurant={restaurant}
          lines={lines}
          createdAt={created?.createdAt ?? TODAY}
          expectedAt={expectedAt}
          note={note.trim() || undefined}
          author={user ? `${user.firstName} ${user.lastName}` : undefined}
        />
      )}

      {step === 6 && mail && (
        <div className="space-y-3">
          <EmailPreview to={mail.to} subject={mail.subject} body={mail.body} attachment={mail.attachment} />
          {sent ? (
            <p className="flex items-center gap-2 rounded-2xl border border-success/40 bg-success/10 p-3 text-sm font-semibold text-success">
              <Check className="h-4 w-4" /> Commande {created?.ref} envoyée à {mail.to}. Statut : Envoyée.
            </p>
          ) : (
            <p className="flex items-center gap-2 rounded-2xl border border-gold/40 bg-gold/10 p-3 text-xs text-gold">
              <ShoppingCart className="h-4 w-4" /> Le bon de commande {created?.ref} est créé au statut « À envoyer ».
              L'envoi déclenche l'email ci-dessus avec le document en pièce jointe.
            </p>
          )}
        </div>
      )}
    </TCModal>
  );
}

function Recap({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="truncate text-sm font-semibold">{value}</div>
    </div>
  );
}
