/**
 * Bon de livraison officiel Texas Chicken : document généré par le manager au
 * moment de la réception physique de la marchandise. Il est rattaché à la
 * commande fournisseur correspondante.
 */
import { AlertTriangle, Check, Printer } from "lucide-react";
import texasLogo from "@/assets/texas-chicken-logo.svg";
import { money } from "./order-document";
import { useStore } from "@/lib/tc/store";
import type { DeliveryNote } from "@/lib/tc/ops";

export function DeliveryNoteDocument({ note }: { note: DeliveryNote }) {
  const state = useStore((s) => s);
  const supplier = state.suppliers.find((x) => x.id === note.supplierId);
  const restaurant = state.restaurants.find((r) => r.id === note.restaurantId);
  const order = state.purchaseOrders.find((o) => o.id === note.orderId);
  const signer = state.users.find((u) => u.id === note.signedBy);
  const total = note.lines.reduce((a, l) => a + l.received * l.price, 0);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border bg-background/85 p-5 text-[12px] leading-relaxed">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <img src={texasLogo} alt="Texas Chicken" className="h-12 w-12 object-contain" />
            <div>
              <div className="font-display text-base font-bold uppercase">Texas Chicken Maroc</div>
              <div className="text-[11px] text-muted-foreground">{restaurant?.name ?? ""}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-lg font-bold uppercase text-gold">Bon de livraison</div>
            <div className="tabular text-[11px] text-muted-foreground">
              Réf. {note.ref} · Réceptionné le {note.at}
            </div>
            {order && (
              <div className="tabular text-[11px] text-muted-foreground">Commande liée : {order.ref}</div>
            )}
          </div>
        </header>

        <div className="grid gap-3 py-4 sm:grid-cols-2">
          <Block
            title="Fournisseur"
            rows={[
              supplier?.name ?? "—",
              supplier?.contact ?? "",
              supplier?.email ?? "",
              note.supplierNoteRef ? `Bon fournisseur n° ${note.supplierNoteRef}` : "",
              note.carrier ? `Livreur : ${note.carrier}` : "",
            ]}
          />
          <Block
            title="Réception au restaurant"
            rows={[
              restaurant?.name ?? "—",
              [restaurant?.address, restaurant?.city].filter(Boolean).join(", "),
              signer ? `Réceptionné par : ${signer.firstName} ${signer.lastName}` : "",
              note.temperature ? `Température relevée : ${note.temperature}` : "",
            ]}
          />
        </div>


        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-y border-border text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="py-2">Produit</th>
              <th className="py-2">Unité</th>
              <th className="py-2 text-right">Commandé</th>
              <th className="py-2 text-right">Reçu</th>
              <th className="py-2 text-right">Écart</th>
            </tr>
          </thead>
          <tbody>
            {note.lines.map((l) => {
              const gap = l.received - l.ordered;
              return (
                <tr key={l.productId} className="border-b border-border/60">
                  <td className="py-1.5">{l.name}</td>
                  <td className="py-1.5 text-muted-foreground">{l.unit}</td>
                  <td className="tabular py-1.5 text-right">{l.ordered}</td>
                  <td className="tabular py-1.5 text-right font-semibold">{l.received}</td>
                  <td
                    className={`tabular py-1.5 text-right ${gap === 0 ? "text-muted-foreground" : "text-destructive"}`}
                  >
                    {gap === 0 ? "—" : gap > 0 ? `+${gap}` : gap}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-3 flex justify-end gap-2 text-sm font-semibold">
          <span className="text-muted-foreground">Valeur reçue</span>
          <span className="tabular">{money(total)}</span>
        </div>

        <div
          className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-[11px] ${
            note.conform ? "border-success/40 bg-success/10 text-success" : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {note.conform ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>
            {note.conform ? "Livraison conforme à la commande." : "Écart constaté entre la commande et la livraison."}
            {note.comment ? ` ${note.comment}` : ""}
          </span>
        </div>

        <p className="mt-4 border-t border-border pt-3 text-[10px] text-muted-foreground">
          Bon de livraison signé électroniquement par le responsable du restaurant. Ce document vaut confirmation de
          réception de la marchandise auprès du fournisseur.
        </p>
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-gold"
      >
        <Printer className="h-3.5 w-3.5" /> Imprimer le bon de livraison
      </button>
    </div>
  );
}

function Block({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/25 p-3">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gold">{title}</div>
      {rows.filter(Boolean).map((r, i) => (
        <div key={i} className={i === 0 ? "font-semibold" : "text-muted-foreground"}>
          {r}
        </div>
      ))}
    </div>
  );
}
