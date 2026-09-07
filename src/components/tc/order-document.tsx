/**
 * Prévisualisation professionnelle d'un bon de commande :
 * document officiel Texas Chicken (en-tête, parties, lignes, totaux, mentions)
 * et aperçu de l'email envoyé au fournisseur avec pièce jointe simulée.
 */
import { Mail, Paperclip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import texasLogo from "@/assets/texas-chicken-logo.svg";
import { orderTotal, useStore } from "@/lib/tc/store";
import type { OrderLine, PurchaseOrder, Supplier } from "@/lib/tc/ops";
import type { Restaurant } from "@/lib/tc/types";

export function money(v: number) {
  return `${v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
}

export function OrderDocument({
  ref_,
  supplier,
  restaurant,
  lines,
  createdAt,
  expectedAt,
  note,
  author,
}: {
  ref_: string;
  supplier?: Supplier;
  restaurant?: Restaurant;
  lines: OrderLine[];
  createdAt: string;
  expectedAt: string;
  note?: string;
  author?: string;
}) {
  const ht = lines.reduce((a, l) => a + l.quantity * l.price, 0);
  const tva = ht * 0.2;

  return (
    <div className="rounded-2xl border border-border bg-background/85 p-5 text-[12px] leading-relaxed">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <img src={texasLogo} alt="Texas Chicken" className="h-12 w-12 object-contain" />
          <div>
            <div className="font-display text-base font-bold uppercase">Texas Chicken Maroc</div>
            <div className="text-[11px] text-muted-foreground">
              Service Approvisionnement · approvisionnement@texaschicken-demo.com
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-lg font-bold uppercase text-gold">Bon de commande</div>
          <div className="tabular text-[11px] text-muted-foreground">
            Réf. {ref_} · Émis le {createdAt.slice(0, 10)}
          </div>
          <div className="tabular text-[11px] text-muted-foreground">Livraison souhaitée : {expectedAt}</div>
        </div>
      </header>

      <div className="grid gap-3 py-4 sm:grid-cols-2">
        <Party
          title="Fournisseur"
          lines={[
            supplier?.name ?? "—",
            supplier?.contact ?? "",
            supplier?.email ?? "",
            supplier?.phone ?? "",
            [supplier?.address, supplier?.city].filter(Boolean).join(", "),
          ]}
        />
        <Party
          title="Livrer à"
          lines={[
            restaurant?.name ?? "—",
            restaurant?.address ?? "",
            restaurant?.city ?? "",
            author ? `Demandeur : ${author}` : "",
          ]}
        />
      </div>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-y border-border text-[10px] uppercase tracking-widest text-muted-foreground">
            <th className="py-2">Produit</th>
            <th className="py-2">Unité</th>
            <th className="py-2 text-right">Qté</th>
            <th className="py-2 text-right">P.U.</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.productId} className="border-b border-border/60">
              <td className="py-1.5">
                {l.name}
                {l.priority === "Urgente" && (
                  <span className="ml-2 rounded-full border border-destructive/40 bg-destructive/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-destructive">
                    Urgent
                  </span>
                )}
              </td>
              <td className="py-1.5 text-muted-foreground">{l.unit}</td>
              <td className="tabular py-1.5 text-right">{l.quantity}</td>
              <td className="tabular py-1.5 text-right">{money(l.price)}</td>
              <td className="tabular py-1.5 text-right font-semibold">{money(l.quantity * l.price)}</td>
            </tr>
          ))}
          {lines.length === 0 && (
            <tr>
              <td colSpan={5} className="py-3 text-center text-muted-foreground">
                Aucun produit sélectionné.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-3 ml-auto w-full max-w-xs space-y-1">
        <Total label="Total HT" value={money(ht)} />
        <Total label="TVA 20 %" value={money(tva)} />
        <Total label="Total TTC" value={money(ht + tva)} strong />
      </div>

      {note && (
        <p className="mt-4 rounded-xl border border-border bg-secondary/25 p-3 text-[11px]">
          <strong>Note :</strong> {note}
        </p>
      )}

      <p className="mt-4 border-t border-border pt-3 text-[10px] text-muted-foreground">
        Document généré automatiquement par la plateforme Texas Chicken Operational Excellence. Toute livraison doit être
        accompagnée du présent bon de commande et d'un bon de livraison signé.
      </p>
    </div>
  );
}

function Party({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/25 p-3">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gold">{title}</div>
      {lines.filter(Boolean).map((l, i) => (
        <div key={i} className={i === 0 ? "font-semibold" : "text-muted-foreground"}>
          {l}
        </div>
      ))}
    </div>
  );
}

function Total({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "border-t border-border pt-1 font-display text-sm font-bold" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular">{value}</span>
    </div>
  );
}

export function EmailPreview({
  to,
  subject,
  body,
  attachment,
  editable = false,
  onChange,
}: {
  to: string;
  subject: string;
  body: string;
  attachment: string;
  /** Rend le destinataire, l'objet et le message modifiables avant l'envoi. */
  editable?: boolean;
  onChange?: (next: { to: string; subject: string; body: string }) => void;
}) {
  const patch = (p: Partial<{ to: string; subject: string; body: string }>) =>
    onChange?.({ to, subject, body, ...p });
  return (
    <div className="rounded-2xl border border-border bg-background/85 p-4 text-[12px]">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <Mail className="h-4 w-4 text-gold" />
        <span className="font-display text-sm font-bold uppercase">
          {editable ? "Email au fournisseur — modifiable" : "Aperçu de l'email"}
        </span>
      </div>
      {editable ? (
        <div className="mt-3 space-y-2">
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
              Destinataire
            </span>
            <Input value={to} onChange={(e) => patch({ to: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Objet</span>
            <Input value={subject} onChange={(e) => patch({ subject: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Message</span>
            <Textarea rows={12} value={body} onChange={(e) => patch({ body: e.target.value })} />
          </label>
        </div>
      ) : (
        <>
          <dl className="mt-3 space-y-1">
            <Row label="À" value={to} />
            <Row label="De" value="approvisionnement@texaschicken-demo.com" />
            <Row label="Objet" value={subject} />
          </dl>
          <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-border bg-secondary/25 p-3 font-sans text-[12px]">
            {body}
          </pre>
        </>
      )}
      <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-[11px] font-semibold text-gold">
        <Paperclip className="h-3.5 w-3.5" /> {attachment}
      </div>
    </div>
  );
}


function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-14 shrink-0 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 break-words font-semibold">{value}</dd>
    </div>
  );
}

/** Document + email d'une commande existante (fiche fournisseur, suivi). */
export function OrderPreview({ order }: { order: PurchaseOrder }) {
  const state = useStore((s) => s);
  const supplier = state.suppliers.find((x) => x.id === order.supplierId);
  const restaurant = state.restaurants.find((r) => r.id === order.restaurantId);
  const author = state.users.find((u) => u.id === order.createdBy);
  return (
    <div className="space-y-4">
      <OrderDocument
        ref_={order.ref}
        supplier={supplier}
        restaurant={restaurant}
        lines={order.lines}
        createdAt={order.createdAt}
        expectedAt={order.expectedAt}
        note={order.note}
        author={author ? `${author.firstName} ${author.lastName}` : undefined}
      />
      {order.sentAt && order.emailSubject && (
        <EmailPreview
          to={order.emailTo ?? supplier?.email ?? ""}
          subject={order.emailSubject}
          body={order.emailBody ?? ""}
          attachment={`Commande_${order.ref}.pdf`}
        />
      )}
      <div className="rounded-2xl border border-border bg-secondary/25 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Historique · total {money(orderTotal(order))}
        </div>
        <div className="space-y-1">
          {order.history.map((h, i) => (
            <div key={i} className="flex gap-2 text-[11px]">
              <span className="tabular shrink-0 text-muted-foreground">{h.at}</span>
              <span>{h.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
