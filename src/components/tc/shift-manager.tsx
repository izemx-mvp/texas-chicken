import { useMemo, useState } from "react";
import { Clock3, Moon, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { TCModal } from "./modal";
import { ShiftPhasePill } from "./shift-bits";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  addShift,
  dayReport,
  removeShift,
  restaurantShifts,
  shiftDayReports,
  shiftPhase,
  shiftRange,
  toggleShift,
  updateShift,
  useActiveDate,
  useStore,
} from "@/lib/tc/store";
import { SHIFT_NOW, TODAY } from "@/lib/tc/data";
import type { Shift } from "@/lib/tc/types";

interface Draft {
  id?: string;
  name: string;
  start: string;
  end: string;
  description: string;
  active: boolean;
}

const EMPTY: Draft = { name: "", start: "08:00", end: "16:00", description: "", active: true };

/**
 * Gestion complète des shifts d'un restaurant (Administration) :
 * création, modification, activation/désactivation, suppression,
 * avec contrôle des chevauchements et prise en charge du passage à minuit.
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
    const err = draft.id ? updateShift(draft.id, payload) : addShift(payload);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setDraft(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wider">Shifts du restaurant</h3>
          <p className="text-xs text-muted-foreground">
            Les tâches, contrôles et calendriers de ce restaurant sont organisés par shift.
          </p>
        </div>
        <button
          onClick={() => {
            setError(null);
            setDraft({ ...EMPTY });
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gold/50 bg-gold/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gold"
        >
          <Plus className="h-4 w-4" /> Nouveau shift
        </button>
      </div>

      {shifts.length === 0 && (
        <p className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
          Aucun shift configuré. Les tâches restent affichées normalement, sans regroupement par shift.
        </p>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {shifts.map((sh) => {
          const g = groups.find((x) => x.shift?.id === sh.id);
          const range = shiftRange(sh);
          return (
            <article key={sh.id} className="glass rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Clock3 className="h-4 w-4 text-gold" />
                <span className="font-display text-sm font-bold uppercase">{sh.name}</span>
                <span className="tabular text-xs font-semibold text-gold">
                  {sh.start} → {sh.end}
                </span>
                {range.overnight && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-brand/40 bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-foreground">
                    <Moon className="h-3 w-3" /> Traverse minuit
                  </span>
                )}
                <ShiftPhasePill className="ml-auto" phase={shiftPhase(sh, SHIFT_NOW)} />
              </div>
              {sh.description && <p className="mt-2 text-xs text-muted-foreground">{sh.description}</p>}
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <Stat label="Durée" value={`${Math.round(range.duration / 60)} h`} />
                <Stat label="Tâches" value={`${g?.stats.total ?? 0}`} />
                <Stat label="Progression" value={`${g?.stats.progress ?? 0} %`} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Action
                  icon={<Pencil className="h-3.5 w-3.5" />}
                  label="Modifier"
                  onClick={() => {
                    setError(null);
                    setDraft({
                      id: sh.id,
                      name: sh.name,
                      start: sh.start,
                      end: sh.end,
                      description: sh.description ?? "",
                      active: sh.active,
                    });
                  }}
                />
                <Action
                  icon={<Power className="h-3.5 w-3.5" />}
                  label={sh.active ? "Désactiver" : "Activer"}
                  onClick={() => setError(toggleShift(sh.id))}
                />
                <Action
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  label="Supprimer"
                  tone="danger"
                  onClick={() => setConfirmId(sh.id)}
                />
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
          subtitle="Un shift peut traverser minuit (ex. 22:00 → 06:00). Les chevauchements sont interdits."
          size="md"
          onClose={() => setDraft(null)}
          footer={
            <div className="flex justify-end gap-2">
              <button onClick={() => setDraft(null)} className="rounded-xl border border-border px-4 py-2 text-xs font-semibold">
                Annuler
              </button>
              <button
                onClick={save}
                className="rounded-xl border border-gold/50 bg-gold/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gold"
              >
                Enregistrer
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            <Field label="Nom du shift">
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Matin, Soir, Nuit…"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Heure de début">
                <Input type="time" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} />
              </Field>
              <Field label="Heure de fin">
                <Input type="time" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} />
              </Field>
            </div>
            <Field label="Description">
              <Input
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Objectif du shift, périmètre, particularités…"
              />
            </Field>
            <label className="flex items-center gap-2 text-xs font-semibold">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              />
              Shift actif
            </label>
            {error && (
              <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                {error}
              </p>
            )}
          </div>
        </TCModal>
      )}

      {confirmId && (
        <TCModal
          title="Supprimer le shift"
          size="sm"
          onClose={() => setConfirmId(null)}
          footer={
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmId(null)} className="rounded-xl border border-border px-4 py-2 text-xs font-semibold">
                Annuler
              </button>
              <button
                onClick={() => {
                  removeShift(confirmId);
                  setConfirmId(null);
                }}
                className="rounded-xl border border-destructive/50 bg-destructive/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-destructive"
              >
                Supprimer
              </button>
            </div>
          }
        >
          <p className="text-sm text-muted-foreground">
            Les tâches rattachées à ce shift ne sont pas supprimées : elles redeviennent simplement indépendantes du
            shift.
          </p>
        </TCModal>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function Action({
  icon,
  label,
  onClick,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tone?: "danger";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-[11px] font-semibold transition-colors hover:border-gold/50",
        tone === "danger" && "border-destructive/40 text-destructive hover:border-destructive",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
