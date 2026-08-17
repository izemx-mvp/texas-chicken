import { useSyncExternalStore } from "react";
import {
  alerts as seedAlerts,
  controls as seedControls,
  evidence as seedEvidence,
  processes as seedProcesses,
  restaurants as seedRestaurants,
  roles as seedRoles,
  shiftTasks as seedShiftTasks,
  standards as seedStandards,
  users as seedUsers,
} from "./data";
import type {
  Alert,
  Control,
  Evidence,
  PermissionName,
  Process,
  Restaurant,
  Role,
  ShiftTask,
  Standard,
  User,
} from "./types";

export interface Session {
  userId: string;
  space: "manager" | "admin";
  at: string;
}

export interface State {
  session: Session | null;
  restaurants: Restaurant[];
  users: User[];
  processes: Process[];
  standards: Standard[];
  controls: Control[];
  evidence: Evidence[];
  alerts: Alert[];
  roles: Role[];
  shiftTasks: ShiftTask[];
  usedPhotoHashes: string[];
}

let state: State = {
  session: null,
  restaurants: seedRestaurants,
  users: seedUsers,
  processes: seedProcesses,
  standards: seedStandards,
  controls: seedControls,
  evidence: seedEvidence,
  alerts: seedAlerts,
  roles: seedRoles,
  shiftTasks: seedShiftTasks,
  usedPhotoHashes: [],
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
export const getState = () => state;
export function setState(patch: Partial<State> | ((s: State) => Partial<State>)) {
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p };
  persist();
  emit();
}

const KEY = "tc-oep-session";
function persist() {
  if (typeof window === "undefined") return;
  try {
    if (state.session) localStorage.setItem(KEY, JSON.stringify(state.session));
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
export function hydrateSession() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw && !state.session) {
      state = { ...state, session: JSON.parse(raw) as Session };
      emit();
    }
  } catch {
    /* ignore */
  }
}

export function useStore<T>(selector: (s: State) => T): T {
  // Subscribe to the whole (immutable) state object so the snapshot identity is
  // stable; derive the selected value during render to avoid infinite loops.
  const snapshot = useSyncExternalStore(subscribe, getState, getState);
  return selector(snapshot);
}

/* -------------------- auth -------------------- */
export function login(email: string, password: string, space: "manager" | "admin") {
  const user = state.users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
  );
  if (!user) return { ok: false as const, error: "Email ou mot de passe incorrect." };
  if (user.status !== "Actif") return { ok: false as const, error: "Ce compte est désactivé." };
  const isManagerRole = user.role === "Manager" || user.role === "Responsable restaurant";
  if (space === "manager" && !isManagerRole)
    return { ok: false as const, error: "Ce compte n'est pas un compte Restaurant Operations." };
  if (space === "admin" && isManagerRole)
    return { ok: false as const, error: "Ce compte n'a pas accès à l'Administration." };
  setState({ session: { userId: user.id, space, at: new Date().toISOString() } });
  return { ok: true as const, user };
}
export function logout() {
  setState({ session: null });
}
export function currentUser(): User | null {
  const s = state.session;
  return s ? (state.users.find((u) => u.id === s.userId) ?? null) : null;
}
export function can(user: User | null, module: string, perm: PermissionName) {
  if (!user) return false;
  const role = state.roles.find((r) => r.id === user.roleId);
  return !!role?.permissions[module]?.includes(perm);
}

/* -------------------- generic CRUD -------------------- */
type Collections = "restaurants" | "users" | "processes" | "standards" | "roles" | "controls" | "evidence" | "alerts";
export function upsert<T extends { id: string }>(coll: Collections, item: T) {
  const list = state[coll] as unknown as T[];
  const exists = list.some((x) => x.id === item.id);
  setState({
    [coll]: exists ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list],
  } as unknown as Partial<State>);
}
export function remove(coll: Collections, id: string) {
  const list = state[coll] as unknown as { id: string }[];
  setState({ [coll]: list.filter((x) => x.id !== id) } as unknown as Partial<State>);
}
export const uid = (p: string) => `${p}${Math.random().toString(36).slice(2, 9)}`;

/* -------------------- shift / tasks -------------------- */
export function updateTask(id: string, patch: Partial<ShiftTask>) {
  setState((s) => ({
    shiftTasks: s.shiftTasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  }));
}

export function pushAlert(a: Omit<Alert, "id" | "createdAt" | "read" | "resolved">) {
  const alert: Alert = {
    ...a,
    id: uid("a"),
    createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    read: false,
    resolved: false,
  };
  setState((s) => ({ alerts: [alert, ...s.alerts] }));
  return alert;
}

export function addEvidence(e: Evidence) {
  setState((s) => ({ evidence: [e, ...s.evidence], usedPhotoHashes: [...s.usedPhotoHashes, e.hash] }));
}

/* -------------------- shift ordering / next step -------------------- */
const PRIORITY_WEIGHT: Record<string, number> = { Critique: 0, Haute: 1, Normale: 2, Basse: 3 };
const OPEN_STATUS: ShiftTask["status"][] = ["À faire", "En cours", "En retard", "Bloqué"];

/** Ordre chronologique global du shift : heure planifiée puis priorité. */
export function orderedShiftTasks(s: State = state) {
  return [...s.shiftTasks].sort((a, b) => {
    if (a.time !== b.time) return a.time.localeCompare(b.time);
    return (PRIORITY_WEIGHT[a.priority] ?? 9) - (PRIORITY_WEIGHT[b.priority] ?? 9);
  });
}

/**
 * Prochaine étape à effectuer sur l'ensemble du shift : on privilégie les retards,
 * puis les tâches critiques, puis l'ordre chronologique — tous processus confondus.
 */
export function nextShiftTask(s: State = state): ShiftTask | null {
  const open = orderedShiftTasks(s).filter((t) => OPEN_STATUS.includes(t.status));
  if (!open.length) return null;
  const inProgress = open.find((t) => t.status === "En cours");
  if (inProgress) return inProgress;
  const late = open.filter((t) => t.status === "En retard");
  const pool = late.length ? late : open;
  return (
    [...pool].sort(
      (a, b) =>
        (PRIORITY_WEIGHT[a.priority] ?? 9) - (PRIORITY_WEIGHT[b.priority] ?? 9) ||
        a.time.localeCompare(b.time),
    )[0] ?? null
  );
}

export function isProcessAvailableOn(p: Process, date: string) {
  const a = p.availability ?? { type: "Permanent" as const };
  if (a.type === "Permanent") return true;
  if (a.type === "Période") return (!a.startDate || date >= a.startDate) && (!a.endDate || date <= a.endDate);
  return !!a.dates?.includes(date);
}

/** Tâches planifiées pour une date donnée (dépend de la disponibilité du processus). */
export function tasksForDate(date: string, s: State = state) {
  return orderedShiftTasks(s).filter((t) => {
    const p = s.processes.find((x) => x.id === t.processId);
    return p ? isProcessAvailableOn(p, date) : true;
  });
}

/** Clôture robuste d'une tâche : statut, résultat, horodatage. */
export function finishTask(id: string, patch: Partial<ShiftTask> = {}) {
  const at = new Date().toISOString().slice(0, 16).replace("T", " ");
  updateTask(id, { status: "Terminé", completedAt: at, ...patch });
}

/* -------------------- KPIs -------------------- */
export function kpis(s: State = state) {
  const activeRest = s.restaurants.filter((r) => r.status === "Actif");
  const compliance = Math.round(
    activeRest.reduce((a, r) => a + r.compliance, 0) / Math.max(1, activeRest.length),
  );
  return {
    compliance,
    restaurants: activeRest.length,
    processes: s.processes.filter((p) => p.status === "Actif").length,
    controls: s.controls.length,
    tasks: s.shiftTasks.length,
    alerts: s.alerts.filter((a) => !a.resolved).length,
    criticalAlerts: s.alerts.filter((a) => !a.resolved && a.level === "Critique").length,
    evidenceAnalyzed: s.evidence.length,
    evidenceRejected: s.evidence.filter((e) => e.status === "Rejetée" || e.status === "Dupliquée").length,
    nonCompliance: s.controls.filter((c) => c.status === "Non conforme").length,
  };
}
