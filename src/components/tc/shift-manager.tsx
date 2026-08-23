import { useMemo, useState } from "react";
import { Check, Clock3, Moon, Pencil, Plus, Power, Search, Trash2, UserPlus, Users, X } from "lucide-react";
import { TCModal } from "./modal";
import { ShiftPhasePill } from "./shift-bits";
import { UserAvatar } from "./avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  addShift,
  assignEmployee,
  assignmentsFor,
  dayReport,
  effectiveUserId,
  removeAssignment,
  removeShift,
  restaurantShifts,
  shiftDayReports,
  shiftPhase,
  shiftRange,
  shiftTeam,
  toggleShift,
  updateShift,
  useActiveDate,
  useStore,
} from "@/lib/tc/store";
import { SHIFT_NOW, TODAY } from "@/lib/tc/data";
import type { User } from "@/lib/tc/types";

interface Draft {
  id?: string;
  name: string;
  start: string;
  end: string;
  description: string;
  active: boolean;
  members: string[];
}

const EMPTY: Draft = { name: "", start: "08:00", end: "16:00", description: "", active: true, members: [] };

/**
 * Gestion complète des shifts d'un restaurant : création, modification,
 * activation, suppression et composition de l'équipe (membres affectés),
 * avec contrôle des chevauchements et passage à minuit.
 */
export function ShiftManager({ restaurantId }: { restaurantId: string }) {
  const state = useStore((s) => s);
  const [date] = useActiveDate();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const shifts = useMemo(() => restaurantShifts(restaurantId, state), [restaurantId, state]);
  const reports = useMemo(() => dayReport(date, TODAY, state, restaurantId), [date, state, restaurantId]);
  const groups = useMemo(
    () => shiftDayReports(reports, restaurantId, SHIFT_NOW, state),
    [reports, restaurantId, state],
  );

  /** Employés rattachés au restaurant (managers inclus, aucun système séparé). */
  const staff = useMemo(() => {
    const seen = new Set<string>();
    return state.users.filter((u) => {
      if (u.restaurantId !== restaurantId && !(u.restaurantIds ?? []).includes(restaurantId)) return false;
      if (seen.has(u.id)) return false;
      seen.add(u.id);
      return true;
    });
  }, [state.users, restaurantId]);

  const openEdit = (shiftId?: string) => {
    setError(null);
    if (!shiftId) return setDraft({ ...EMPTY });
    const sh = shifts.find((x) => x.id === shiftId);
    if (!sh) return;
    setDraft({
      id: sh.id,
      name: sh.name,
      start: sh.start,
      end: sh.end,
      description: sh.description ?? "",
      active: sh.active,
      members: Array.from(new Set(assignmentsFor(restaurantId, date, sh.id, state).map(effectiveUserId))),
    });
  };

  /** Synchronise l'équipe du shift sur la date active (ajouts + retraits). */
  const syncMembers = (shiftId: string, members: string[]) => {
    const current = assignmentsFor(restaurantId, date, shiftId);
    current.filter((a) => !members.includes(effectiveUserId(a))).forEach((a) => removeAssignment(a.id));
    const existing = current.map(effectiveUserId);
    members
      .filter((id) => !existing.includes(id))
      .forEach((userId) => {
        const u = state.users.find((x) => x.id === userId);
        assignEmployee({ restaurantId, shiftId, userId, date, role: u?.role });
      });
  };

  const save = () => {
    if (!draft) return;
    const payload = {
      restaurantId,
      name: draft.name.trim(),
      start: draft.start,
      end: draft.end,
      description: draft.description.trim(),
      active: draft.active,
    };
    if (draft.id) {
      const err = updateShift(draft.id, payload);
      if (err) return setError(err);
      syncMembers(draft.id, draft.members);
    } else {
      const before = new Set(restaurantShifts(restaurantId).map((x) => x.id));
      const err = addShift(payload);
      if (err) return setError(err);
      const created = restaurantShifts(restaurantId).find((x) => !before.has(x.id));
      if (created) syncMembers(created.id, draft.members);
    }
    setError(null);
    setDraft(null);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-display text-base font-bold uppercase tracking-wider">Shifts du restaurant</h3>
          <p className="text-xs text-muted-foreground">
            Un shift appartient à ce restaurant : horaires, statut et équipe affectée ({date}).
          </p>
        </div>
        <Button size="sm" className="shrink-0" onClick={() => openEdit()}>
          <Plus className="mr-1.5 h-4 w-4" /> Nouveau shift
        </Button>
      </div>

      {shifts.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Aucun shift configuré pour ce restaurant. Créez le premier shift pour organiser les équipes et les tâches.
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {shifts.map((sh) => {
          const g = groups.find((x) => x.shift?.id === sh.id);
          const range = shiftRange(sh);
          const team = shiftTeam(sh.id, date, state);
          return (
            <article key={sh.id} className="glass flex flex-col gap-4 rounded-2xl p-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <Clock3 className="h-4 w-4 shrink-0 text-gold" />
                    <span className="truncate font-display text-base font-bold uppercase">{sh.name}</span>
                    {!sh.active && (
                      <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                        Inactif
                      </span>
                    )}
                  </div>
                  <div className="tabular mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-gold">
                    {sh.start} → {sh.end}
                    {range.overnight && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-brand/40 bg-brand/10 px-2 py-0.5 text-[10px] uppercase text-foreground">
                        <Moon className="h-3 w-3" /> Minuit
                      </span>
                    )}
                  </div>
                </div>
                <ShiftPhasePill phase={shiftPhase(sh, SHIFT_NOW)} />
              </div>

              {sh.description && <p className="text-xs leading-relaxed text-muted-foreground">{sh.description}</p>}

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Durée" value={`${Math.round(range.duration / 60)} h`} />
                <Stat label="Membres" value={`${team.length}`} />
                <Stat label="Tâches" value={`${g?.stats.total ?? 0}`} />
                <Stat label="Progression" value={`${g?.stats.progress ?? 0} %`} />
              </div>

              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> Membres du shift
                </div>
                {team.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucun membre affecté sur cette date.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {team.map((m) => (
                      <span
                        key={m.assignment.id}
                        className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 py-1 pl-1 pr-2.5"
                      >
                        {m.user && <UserAvatar user={m.user} size={22} rounded="rounded-full" />}
                        <span className="text-[11px] font-semibold">
                          {m.user?.firstName} {m.user?.lastName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">· {m.role}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-3">
                <Button size="sm" variant="ghost" onClick={() => openEdit(sh.id)}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Modifier
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setError(toggleShift(sh.id))}>
                  <Power className="mr-1.5 h-3.5 w-3.5" /> {sh.active ? "Désactiver" : "Activer"}
                </Button>
                <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setConfirmId(sh.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {error && !draft && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
          {error}
        </p>
      )}

      {draft && (
        <TCModal
          title={draft.id ? "Modifier le shift" : "Nouveau shift"}
          subtitle={`Horaires, statut et équipe affectée — ${date}`}
          size="xl"
          onClose={() => setDraft(null)}
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-muted-foreground">
                {draft.members.length} membre{draft.members.length > 1 ? "s" : ""} sélectionné
                {draft.members.length > 1 ? "s" : ""}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setDraft(null)}>
                  Annuler
                </Button>
                <Button onClick={save}>Enregistrer</Button>
              </div>
            </div>
          }
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
            <section className="space-y-4">
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Informations du shift
              </h4>
              <Field label="Nom du shift">
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Matin, Soir, Nuit…"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Début">
                  <Input type="time" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} />
                </Field>
                <Field label="Fin">
                  <Input type="time" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} />
                </Field>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Un shift peut traverser minuit (ex. 22:00 → 06:00). Les chevauchements sont interdits.
              </p>
              <Field label="Description">
                <Textarea
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Objectif du shift, périmètre, particularités…"
                />
              </Field>
              <Field label="Statut">
                <div className="flex gap-2">
                  {[true, false].map((v) => (
                    <button
                      key={String(v)}
                      type="button"
                      onClick={() => setDraft({ ...draft, active: v })}
                      className={cn(
                        "flex-1 rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                        draft.active === v
                          ? "border-gold/50 bg-gold/15 text-gold"
                          : "border-border text-muted-foreground hover:border-gold/30",
                      )}
                    >
                      {v ? "Actif" : "Inactif"}
                    </button>
                  ))}
                </div>
              </Field>
            </section>

            <section className="space-y-3">
              <MemberSelector
                staff={staff}
                value={draft.members}
                onChange={(members) => setDraft({ ...draft, members })}
              />
            </section>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
              {error}
            </p>
          )}
        </TCModal>
      )}

      {confirmId && (
        <TCModal
          title="Supprimer le shift"
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
                  removeShift(confirmId);
                  setConfirmId(null);
                }}
              >
                Supprimer
              </Button>
            </div>
          }
        >
          <p className="text-sm leading-relaxed text-muted-foreground">
            Les tâches rattachées à ce shift ne sont pas supprimées : elles redeviennent simplement indépendantes du
            shift.
          </p>
        </TCModal>
      )}
    </div>
  );
}

/** Sélection des membres du shift : recherche, ajout, retrait, rôle visible. */
function MemberSelector({
  staff,
  value,
  onChange,
}: {
  staff: User[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return staff.filter((u) => !t || `${u.firstName} ${u.lastName} ${u.role} ${u.email}`.toLowerCase().includes(t));
  }, [staff, q]);
  const selected = value.map((id) => staff.find((u) => u.id === id)).filter((u): u is User => !!u);
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Membres du shift ({value.length})
        </h4>
        <button
          type="button"
          onClick={() => onChange([])}
          className="shrink-0 rounded-lg border border-border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hover:border-brand/50 hover:text-brand"
        >
          Tout retirer
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un employé, un manager, un rôle…"
          className="h-10 w-full bg-transparent text-sm outline-none"
        />
      </div>

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

      <div className="grid max-h-80 gap-1.5 overflow-y-auto rounded-2xl border border-border p-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {list.map((u) => {
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
                <span className="block truncate text-[10px] text-muted-foreground">{u.role}</span>
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
        {list.length === 0 && (
          <p className="col-span-full p-6 text-center text-xs text-muted-foreground">
            Aucun collaborateur rattaché à ce restaurant ne correspond.
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
