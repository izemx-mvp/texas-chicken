/**
 * Sélecteur de membres avancé : recherche, filtre par rôle et par restaurant,
 * sélection multiple, tout sélectionner / désélectionner, chips des membres choisis.
 */
import { useMemo, useState } from "react";
import { Check, Search, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/tc/store";
import type { User } from "@/lib/tc/types";
import { UserAvatar } from "./avatar";
import { TCSelect } from "./select";

export function MemberPicker({
  value,
  onChange,
  single = false,
  title = "Membres",
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  single?: boolean;
  title?: string;
}) {
  const users = useStore((s) => s.users);
  const restaurants = useStore((s) => s.restaurants);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [rid, setRid] = useState("");

  const roles = useMemo(() => Array.from(new Set(users.map((u) => u.role))).sort(), [users]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return users.filter((u) => {
      if (role && u.role !== role) return false;
      if (rid && u.restaurantId !== rid) return false;
      if (t && !`${u.firstName} ${u.lastName} ${u.email} ${u.role}`.toLowerCase().includes(t)) return false;
      return true;
    });
  }, [users, q, role, rid]);

  const restaurantName = (u: User) => restaurants.find((r) => r.id === u.restaurantId)?.name ?? "Réseau / siège";
  const selected = value.map((id) => users.find((u) => u.id === id)).filter((u): u is User => !!u);

  const toggle = (id: string) => {
    if (single) return onChange(value.includes(id) ? [] : [id]);
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-48 flex-1 items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un collaborateur…"
            className="h-10 w-full bg-transparent text-sm outline-none"
          />
        </div>
        <div className="w-44">
          <TCSelect
            value={role}
            onChange={setRole}
            searchable
            options={[{ value: "", label: "Tous les rôles" }, ...roles.map((r) => ({ value: r, label: r }))]}
          />
        </div>
        <div className="w-52">
          <TCSelect
            value={rid}
            onChange={setRid}
            searchable
            options={[
              { value: "", label: "Tous les restaurants" },
              ...restaurants.map((r) => ({ value: r.id, label: r.name, description: r.city })),
            ]}
          />
        </div>
      </div>

      {!single && (
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest">
          <span className="text-muted-foreground">
            {title} sélectionnés : <span className="text-gold">{value.length}</span> · {filtered.length} résultats
          </span>
          <button
            type="button"
            className="ml-auto rounded-lg border border-border px-2 py-1 hover:border-gold/50 hover:text-gold"
            onClick={() => onChange(Array.from(new Set([...value, ...filtered.map((u) => u.id)])))}
          >
            Tout sélectionner
          </button>
          <button
            type="button"
            className="rounded-lg border border-border px-2 py-1 hover:border-brand/60 hover:text-brand"
            onClick={() => onChange([])}
          >
            Tout désélectionner
          </button>
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-border bg-secondary/30 p-2">
          {selected.map((u) => (
            <span key={u.id} className="flex items-center gap-1.5 rounded-full bg-background/70 py-1 pl-1 pr-2 text-xs">
              <UserAvatar user={u} size={20} rounded="rounded-full" />
              <span className="max-w-40 truncate">
                {u.firstName} {u.lastName}
              </span>
              <button type="button" aria-label="Retirer" onClick={() => toggle(u.id)}>
                <X className="h-3 w-3 text-muted-foreground hover:text-brand" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="grid max-h-72 gap-1 overflow-y-auto rounded-2xl border border-border p-2 sm:grid-cols-2">
        {filtered.map((u) => {
          const on = value.includes(u.id);
          return (
            <button
              type="button"
              key={u.id}
              onClick={() => toggle(u.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors",
                on ? "bg-brand/15" : "hover:bg-secondary/60",
              )}
            >
              <UserAvatar user={u} size={34} presence />
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-xs font-semibold">
                  {u.firstName} {u.lastName}
                </span>
                <span className="block truncate text-[10px] text-muted-foreground">
                  {u.role} · {restaurantName(u)}
                </span>
              </span>
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-md border",
                  on ? "border-success/60 bg-success/25 text-success" : "border-border text-transparent",
                )}
              >
                {on ? <Check className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
              </span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full p-6 text-center text-xs text-muted-foreground">Aucun collaborateur trouvé.</p>
        )}
      </div>
    </div>
  );
}
