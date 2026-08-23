/**
 * Planification opérationnelle des shifts :
 * timeline 24 h, équipes affectées par date, rôles, remplacements,
 * détection des conflits d'horaire et indicateurs de progression.
 *
 * Logique : Restaurant → Date → Shift → Équipe → Rôles → Tâches → Progression.
 */
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Clock3,
  History,
  Moon,
  Repeat2,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { TCModal } from "./modal";
import { TCSelect } from "./select";
import { UserAvatar } from "./avatar";
import { ShiftPhasePill } from "./shift-bits";
import { ProgressBar } from "./bits";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  assignEmployee,
  assignEmployeeRange,
  assignmentConflicts,
  cancelReplacement,
  conflictMessage,
  removeAssignment,
  replaceAssignment,
  setAssignmentStatus,
  shiftAnalytics,
  shiftPhase,
  shiftRange,
  shiftTeam,
  toMinutes,
  useStore,
  userAssignments,
  type DayTaskReport,
  type ShiftTeamMember,
} from "@/lib/tc/store";
import { SHIFT_NOW } from "@/lib/tc/data";
import type { AssignmentStatus, Shift, User } from "@/lib/tc/types";

export const ASSIGNMENT_STATUSES: AssignmentStatus[] = [
  "Prévu",
  "Présent",
  "En retard",
  "Absent",
  "Remplacé",
  "Annulé",
];

const STATUS_TONE: Record<AssignmentStatus, string> = {
  Prévu: "border-border bg-secondary/50 text-muted-foreground",
  Présent: "border-success/40 bg-success/10 text-success",
  "En retard": "border-gold/50 bg-gold/15 text-gold",
  Absent: "border-destructive/40 bg-destructive/10 text-destructive",
  Remplacé: "border-brand/50 bg-brand/10 text-foreground",
  Annulé: "border-border bg-secondary/40 text-muted-foreground",
};

export function AssignmentStatusPill({ status }: { status: AssignmentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        STATUS_TONE[status],
      )}
    >
      {status}
    </span>
  );
}

/* ---------------- timeline 24 h ---------------- */

export function ShiftTimeline({
  shifts,
  activeId,
  onSelect,
  nowTime = SHIFT_NOW,
}: {
  shifts: Shift[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  nowTime?: string;
}) {
  const nowPct = (toMinutes(nowTime) / 1440) * 100;
  return (
    <div className="space-y-2">
      <div className="relative h-3">
        {Array.from({ length: 9 }, (_, i) => i * 3).map((h) => (
          <span
            key={h}
            className="tabular absolute -translate-x-1/2 text-[9px] text-muted-foreground"
            style={{ left: `${(h / 24) * 100}%` }}
          >
            {String(h).padStart(2, "0")}h
          </span>
        ))}
      </div>
      <div className="relative space-y-1.5">
        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-px bg-brand"
          style={{ left: `${nowPct}%` }}
          aria-hidden
        />
        {shifts.map((sh) => {
          const r = shiftRange(sh);
          const startPct = (r.start / 1440) * 100;
          const widthPct = (Math.min(r.duration, 1440 - r.start) / 1440) * 100;
          const overflowPct = r.overnight ? ((r.end - 1440) / 1440) * 100 : 0;
          const phase = shiftPhase(sh, nowTime);
          const tone =
            phase === "En cours"
              ? "bg-gold/70 text-background"
              : phase === "Terminé"
                ? "bg-secondary/80 text-muted-foreground"
                : phase === "Désactivé"
                  ? "bg-destructive/25 text-destructive"
                  : "bg-brand/45 text-foreground";
          return (
            <button
              key={sh.id}
              type="button"
              onClick={() => onSelect?.(sh.id)}
              className={cn(
                "relative block h-8 w-full rounded-lg border border-border/70 bg-secondary/20 text-left transition-colors",
                activeId === sh.id && "ring-2 ring-gold/60",
              )}
              title={`${sh.name} ${sh.start} → ${sh.end}`}
            >
              <span
                className={cn("absolute inset-y-0 truncate rounded-md px-2 text-[10px] font-semibold uppercase leading-8", tone)}
                style={{ left: `${startPct}%`, width: `${Math.max(widthPct, 4)}%` }}
              >
                {sh.name}
              </span>
              {r.overnight && (
                <span
                  className={cn("absolute inset-y-0 rounded-md px-2 text-[10px] font-semibold uppercase leading-8", tone)}
                  style={{ left: 0, width: `${Math.max(overflowPct, 2)}%` }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- carte shift + équipe ---------------- */

export function ShiftTeamCard({
  shift,
  date,
  restaurantId,
  reports,
  editable = false,
  defaultOpen = true,
}: {
  shift: Shift;
  date: string;
  restaurantId: string;
  reports: DayTaskReport[];
  editable?: boolean;
  defaultOpen?: boolean;
}) {
  const state = useStore((s) => s);
  const [open, setOpen] = useState(defaultOpen);
  const [assignOpen, setAssignOpen] = useState(false);
  const [replaceFor, setReplaceFor] = useState<ShiftTeamMember | null>(null);
  const [historyFor, setHistoryFor] = useState<ShiftTeamMember | null>(null);

  const team = useMemo(() => shiftTeam(shift.id, date, state), [shift.id, date, state]);
  const stats = useMemo(() => shiftAnalytics(shift.id, date, reports, state), [shift.id, date, reports, state]);
  const tasks = reports.filter((r) => r.shiftId === shift.id || r.task.shiftId === "all");
  const range = shiftRange(shift);

  return (
    <article className="glass rounded-3xl p-4">
      <header className="flex flex-wrap items-center gap-2">
        <Clock3 className="h-4 w-4 text-gold" />
        <span className="font-display text-sm font-bold uppercase">{shift.name}</span>
        <span className="tabular text-xs font-semibold text-gold">
          {shift.start} → {shift.end}
        </span>
        {range.overnight && (
          <span className="inline-flex items-center gap-1 rounded-full border border-brand/40 bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase">
            <Moon className="h-3 w-3" /> J+1
          </span>
        )}
        <ShiftPhasePill className="ml-auto" phase={shiftPhase(shift, SHIFT_NOW)} />
      </header>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Équipe" value={`${stats.present}/${stats.planned}`} hint="présents" />
        <Metric label="Tâches" value={`${stats.done}/${stats.total}`} hint="terminées" />
        <Metric label="En retard" value={String(stats.late)} hint="tâches" />
        <Metric label="Conformité" value={`${stats.compliance} %`} hint="shift" />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <ProgressBar value={stats.progress} className="flex-1" />
        <span className="font-display text-sm font-bold text-gold">{stats.progress}%</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          <Users className="h-3.5 w-3.5" /> Équipe & tâches ({team.length})
        </button>
        {editable && (
          <Button size="sm" variant="ghost" onClick={() => setAssignOpen(true)}>
            <UserPlus className="mr-1.5 h-4 w-4" /> Affecter
          </Button>
        )}
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {team.map((m) => (
              <TeamRow
                key={m.assignment.id}
                member={m}
                editable={editable}
                onReplace={() => setReplaceFor(m)}
                onHistory={() => setHistoryFor(m)}
              />
            ))}
            {team.length === 0 && (
              <p className="text-xs text-muted-foreground">Aucun employé affecté à ce shift pour cette date.</p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-secondary/20 p-3">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Tâches du shift ({tasks.length})
            </div>
            <div className="space-y-1">
              {tasks.slice(0, 12).map((r) => {
                const assignee = r.task.assigneeId ? state.users.find((u) => u.id === r.task.assigneeId) : undefined;
                const done = r.status === "Terminé";
                return (
                  <div key={r.task.id} className="flex items-center gap-2 text-xs">
                    <span className={cn("w-4 shrink-0 text-center", done ? "text-success" : "text-muted-foreground")}>
                      {done ? "✓" : "○"}
                    </span>
                    <span className="tabular w-10 shrink-0 text-[10px] text-muted-foreground">{r.task.time}</span>
                    <span className={cn("min-w-0 flex-1 truncate", done && "text-muted-foreground line-through")}>
                      {r.task.name}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {assignee ? `${assignee.firstName} ${assignee.lastName[0]}.` : "Collectif"}
                    </span>
                  </div>
                );
              })}
              {tasks.length === 0 && <p className="text-xs text-muted-foreground">Aucune tâche planifiée.</p>}
            </div>
          </div>
        </div>
      )}

      {assignOpen && (
        <AssignmentModal
          shift={shift}
          date={date}
          restaurantId={restaurantId}
          onClose={() => setAssignOpen(false)}
        />
      )}
      {replaceFor && <ReplacementModal member={replaceFor} onClose={() => setReplaceFor(null)} />}
      {historyFor && (
        <TCModal
          title={`Historique — ${historyFor.planned?.firstName} ${historyFor.planned?.lastName}`}
          subtitle="Affectations, remplacements et présences"
          size="md"
          onClose={() => setHistoryFor(null)}
        >
          <AssignmentHistory userId={historyFor.assignment.userId} />
        </TCModal>
      )}
    </article>
  );
}

function TeamRow({
  member,
  editable,
  onReplace,
  onHistory,
}: {
  member: ShiftTeamMember;
  editable: boolean;
  onReplace: () => void;
  onHistory: () => void;
}) {
  const a = member.assignment;
  return (
    <div className="rounded-2xl border border-border bg-secondary/25 p-3">
      <div className="flex items-center gap-2">
        <UserAvatar user={member.user} size={34} presence />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">
            {member.user ? `${member.user.firstName} ${member.user.lastName}` : "—"}
          </div>
          <div className="truncate text-[11px] text-muted-foreground">{member.role}</div>
        </div>
        <AssignmentStatusPill status={member.status} />
      </div>

      {member.replacement && member.planned && (
        <p className="mt-2 rounded-lg border border-brand/30 bg-brand/10 px-2 py-1 text-[11px]">
          Remplace <strong>{member.planned.firstName} {member.planned.lastName}</strong>
          {a.reason ? ` — ${a.reason}` : ""}
        </p>
      )}
      {member.conflict && (
        <p className="mt-2 flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-2 py-1 text-[11px] font-semibold text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" /> Conflit d'horaire sur cette journée
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {editable && (
          <>
            <select
              value={member.status}
              onChange={(e) => setAssignmentStatus(a.id, e.target.value as AssignmentStatus)}
              className="rounded-lg border border-border bg-background/60 px-2 py-1 text-[11px]"
              aria-label="Statut de présence"
            >
              {ASSIGNMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {member.replacement ? (
              <MiniBtn icon={<Repeat2 className="h-3.5 w-3.5" />} label="Annuler rempl." onClick={() => cancelReplacement(a.id)} />
            ) : (
              <MiniBtn icon={<Repeat2 className="h-3.5 w-3.5" />} label="Remplacer" onClick={onReplace} />
            )}
            <MiniBtn
              icon={<Trash2 className="h-3.5 w-3.5" />}
              label="Retirer"
              tone="danger"
              onClick={() => {
                removeAssignment(a.id);
                toast.success("Affectation retirée");
              }}
            />
          </>
        )}
        <MiniBtn icon={<History className="h-3.5 w-3.5" />} label="Historique" onClick={onHistory} />
      </div>
    </div>
  );
}

function MiniBtn({
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
        "inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors hover:border-gold/60",
        tone === "danger" && "border-destructive/40 text-destructive hover:border-destructive",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 px-2 py-1.5 text-center">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-base font-bold">{value}</div>
      {hint && <div className="text-[9px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

/* ---------------- affectation ---------------- */

export function AssignmentModal({
  shift,
  date,
  restaurantId,
  onClose,
}: {
  shift: Shift;
  date: string;
  restaurantId: string;
  onClose: () => void;
}) {
  const state = useStore((s) => s);
  const staff = state.users.filter((u) => u.restaurantId === restaurantId && u.status === "Actif");
  const [userId, setUserId] = useState(staff[0]?.id ?? "");
  const [role, setRole] = useState<string>(staff[0]?.role ?? "Crew Member");
  const [mode, setMode] = useState<"jour" | "periode">("jour");
  const [to, setTo] = useState(date);
  const [status, setStatus] = useState<AssignmentStatus>("Prévu");

  const conflict = userId ? conflictMessage(userId, date, shift.id) : null;

  const submit = () => {
    if (!userId) return;
    if (mode === "jour") {
      const res = assignEmployee({ restaurantId, shiftId: shift.id, userId, date, role, status });
      toast.success(res.conflict ? "Affectation créée malgré un conflit signalé" : "Employé affecté au shift");
    } else {
      const res = assignEmployeeRange({ restaurantId, shiftId: shift.id, userId, role, status }, date, to);
      toast.success(`${res.created} journées planifiées${res.conflicts.length ? ` · ${res.conflicts.length} conflit(s)` : ""}`);
    }
    onClose();
  };

  return (
    <TCModal
      title={`Affecter au shift ${shift.name}`}
      subtitle={`${shift.start} → ${shift.end} · ${date}`}
      size="md"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={submit}>Affecter</Button>
        </div>
      }
    >
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Employé</span>
          <TCSelect
            value={userId}
            onChange={(v) => {
              setUserId(v);
              const u = staff.find((x) => x.id === v);
              if (u) setRole(u.role);
            }}
            searchable
            options={staff.map((u) => ({
              value: u.id,
              label: `${u.firstName} ${u.lastName}`,
              description: u.role,
              group: u.role,
            }))}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Rôle sur le shift</span>
            <Input value={role} onChange={(e) => setRole(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Statut</span>
            <TCSelect
              value={status}
              onChange={(v) => setStatus(v as AssignmentStatus)}
              options={ASSIGNMENT_STATUSES.filter((s) => s !== "Remplacé").map((s) => ({ value: s, label: s }))}
            />
          </label>
        </div>

        <div className="flex gap-1 rounded-xl border border-border p-1">
          {(["jour", "periode"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-widest",
                mode === m ? "bg-brand/20 text-foreground" : "text-muted-foreground",
              )}
            >
              {m === "jour" ? "Une journée" : "Période"}
            </button>
          ))}
        </div>

        {mode === "periode" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Du</span>
              <Input value={date} readOnly />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Au</span>
              <Input type="date" value={to} min={date} onChange={(e) => setTo(e.target.value)} />
            </label>
          </div>
        )}

        {conflict && (
          <p className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {conflict} L'affectation reste possible : le conflit sera conservé dans l'historique.
          </p>
        )}
      </div>
    </TCModal>
  );
}

function ReplacementModal({ member, onClose }: { member: ShiftTeamMember; onClose: () => void }) {
  const state = useStore((s) => s);
  const pool = state.users.filter(
    (u) => u.restaurantId === member.assignment.restaurantId && u.status === "Actif" && u.id !== member.assignment.userId,
  );
  const [userId, setUserId] = useState(pool[0]?.id ?? "");
  const [reason, setReason] = useState("Absence");
  const conflicts = userId
    ? assignmentConflicts(userId, member.assignment.date, member.assignment.shiftId, state)
    : [];

  return (
    <TCModal
      title="Remplacer un employé"
      subtitle={`${member.planned?.firstName} ${member.planned?.lastName} · ${member.assignment.date}`}
      size="sm"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              if (!userId) return;
              replaceAssignment(member.assignment.id, userId, reason);
              toast.success("Remplacement enregistré");
              onClose();
            }}
          >
            Valider le remplacement
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Remplaçant</span>
          <TCSelect
            value={userId}
            onChange={setUserId}
            searchable
            options={pool.map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName}`, description: u.role }))}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Raison</span>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Maladie, congé, urgence…" />
        </label>
        {conflicts.length > 0 && (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
            Conflit d'horaire : ce remplaçant est déjà affecté au shift « {conflicts[0]!.shift.name} » ce jour-là.
          </p>
        )}
      </div>
    </TCModal>
  );
}

export function AssignmentHistory({ userId }: { userId: string }) {
  const state = useStore((s) => s);
  const list = userAssignments(userId, state).slice(0, 30);
  return (
    <div className="space-y-2">
      {list.map((a) => {
        const sh = state.shifts.find((x) => x.id === a.shiftId);
        const rest = state.restaurants.find((r) => r.id === a.restaurantId);
        return (
          <div key={a.id} className="rounded-xl border border-border bg-secondary/25 p-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <CalendarClock className="h-3.5 w-3.5 text-gold" />
              <span className="tabular font-semibold">{a.date}</span>
              <span>{sh?.name}</span>
              <span className="text-muted-foreground">
                {sh?.start} → {sh?.end}
              </span>
              <AssignmentStatusPill status={a.status} />
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {rest?.name} · rôle {a.role}
              {a.reason ? ` · ${a.reason}` : ""}
            </div>
          </div>
        );
      })}
      {list.length === 0 && <p className="text-sm text-muted-foreground">Aucune affectation enregistrée.</p>}
    </div>
  );
}

export type { User };
