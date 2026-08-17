import { useSyncExternalStore } from "react";
import {
  alerts as seedAlerts,
  controls as seedControls,
  evidence as seedEvidence,
  fraudAlerts as seedFraudAlerts,
  ZONE_GRADIENT,
  processes as seedProcesses,
  restaurants as seedRestaurants,
  roles as seedRoles,
  shiftTasks as seedShiftTasks,
  standards as seedStandards,
  users as seedUsers,
  TODAY as SEED_TODAY,
} from "./data";
import type {
  Alert,
  Control,
  Evidence,
  FraudAlert,
  FraudStatus,
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
  /** Date active partagée par toutes les vues (shift, tâches, calendrier, processus). */
  activeDate: string;
  restaurants: Restaurant[];
  users: User[];
  processes: Process[];
  standards: Standard[];
  controls: Control[];
  evidence: Evidence[];
  alerts: Alert[];
  fraudAlerts: FraudAlert[];
  roles: Role[];
  shiftTasks: ShiftTask[];
  usedPhotoHashes: string[];
}

let state: State = {
  session: null,
  activeDate: SEED_TODAY,
  restaurants: seedRestaurants,
  users: seedUsers,
  processes: seedProcesses,
  standards: seedStandards,
  controls: seedControls,
  evidence: seedEvidence,
  alerts: seedAlerts,
  fraudAlerts: seedFraudAlerts,
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
/** Le Super Admin dispose automatiquement d'un CRUD complet sur toutes les interfaces. */
export function isSuperAdmin(user: User | null) {
  if (!user) return false;
  if (user.role === "Super Admin") return true;
  return state.roles.find((r) => r.id === user.roleId)?.name === "Super Admin";
}
export function can(user: User | null, module: string, perm: PermissionName) {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  const role = state.roles.find((r) => r.id === user.roleId);
  return !!role?.permissions[module]?.includes(perm);
}

/* -------------------- date active globale -------------------- */
export const TODAY_DATE = SEED_TODAY;
export function setActiveDate(date: string) {
  setState({ activeDate: date });
}
export function useActiveDate(): [string, (d: string) => void] {
  const date = useStore((s) => s.activeDate);
  return [date, setActiveDate];
}
export function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
/** Libellé humain : « Aujourd'hui » uniquement pour la date réelle du jour. */
export function dateLabel(date: string, today: string = SEED_TODAY) {
  if (date === today) return "Aujourd'hui";
  if (date === shiftDate(today, -1)) return "Hier";
  if (date === shiftDate(today, 1)) return "Demain";
  return new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
export function longDateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
  const d = new Date(`${date}T12:00:00`);
  const weekday = d.getDay(); // 0 = dimanche
  const dayOfMonth = d.getDate();
  return orderedShiftTasks(s).filter((t) => {
    const p = s.processes.find((x) => x.id === t.processId);
    if (p && !isProcessAvailableOn(p, date)) return false;
    // Chaque date possède réellement son propre jeu de tâches selon la fréquence.
    if (t.frequency === "Hebdomadaire") return hash(t.processId) % 7 === weekday;
    if (t.frequency === "Mensuel") return (hash(t.id) % 28) + 1 === dayOfMonth;
    if (t.frequency === "À la demande") return hash(date + t.id) % 5 === 0;
    return true;
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

/* -------------------- statistiques par restaurant -------------------- */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export interface RestaurantStats {
  total: number;
  done: number;
  late: number;
  remaining: number;
  progress: number;
  compliance: number;
  steps: number;
  stepsKo: number;
  evidenceOk: number;
  fraud: number;
  avgDuration: number;
}

/** Statistiques du jour pour un restaurant : réelles pour le restaurant du shift, dérivées (déterministes) sinon. */
export function restaurantStats(restaurantId: string, s: State = state): RestaurantStats {
  const controls = s.controls.filter((c) => c.restaurantId === restaurantId);
  const evidence = s.evidence.filter((e) => e.restaurantId === restaurantId);
  const rest = s.restaurants.find((r) => r.id === restaurantId);
  const compliance = rest?.compliance ?? 90;
  const live = s.shiftTasks;
  const isShiftRestaurant = s.restaurants[0]?.id === restaurantId;

  let total: number;
  let done: number;
  let late: number;
  if (isShiftRestaurant && live.length) {
    total = live.length;
    done = live.filter((t) => t.status === "Terminé").length;
    late = live.filter((t) => t.status === "En retard").length;
  } else {
    const h = hash(restaurantId);
    total = 24 + (h % 9);
    done = Math.round((total * Math.min(100, compliance + (h % 7) - 3)) / 100);
    late = h % 4;
  }
  const steps = total * 4;
  const stepsKo = controls.filter((c) => c.status === "Non conforme").length + (late || 0);
  const fraud = evidence.filter((e) => e.status === "Dupliquée" || e.status === "Suspecte" || e.status === "Rejetée").length;
  return {
    total,
    done,
    late,
    remaining: Math.max(0, total - done),
    progress: Math.round((done / Math.max(1, total)) * 100),
    compliance,
    steps,
    stepsKo,
    evidenceOk: evidence.filter((e) => e.status === "Valide").length,
    fraud,
    avgDuration: Math.round(controls.reduce((a, c) => a + c.duration, 0) / Math.max(1, controls.length)) || 18,
  };
}


/* -------------------- preuves soumises par tâche -------------------- */
const EV_STEP_LABEL: Record<string, string[]> = {
  Cuisine: ["Plan de travail", "Friteuses", "Sol cuisine"],
  Stockage: ["Étiquetage DLC", "Rangement réserve", "Zone sèche"],
  "Chambre froide": ["Relevé température", "Rangement froid positif", "Sonde"],
  Salle: ["Vue salle", "Tables & banquettes", "Sol salle"],
  Toilettes: ["Sanitaires", "Consommables", "Sol toilettes"],
  Terrasse: ["Vue terrasse", "Mobilier extérieur", "Propreté sol"],
  Entrée: ["Façade & entrée", "Vitrine", "Paillasson"],
  Extérieur: ["Abords", "Local poubelles", "Parking"],
  Équipements: ["Contrôle équipement", "Maintenance", "Relevé compteur"],
};

/** Preuve déterministe réellement « soumise » par le restaurant pour une tâche/date. */
function synthEvidence(
  date: string,
  task: ShiftTask,
  restaurantId: string,
  userId: string,
  idx: number,
): Evidence {
  const h = hash(`${date}|${task.id}|${idx}`);
  const roll = h % 100;
  const status: Evidence["status"] =
    roll < 74 ? "Valide" : roll < 84 ? "Suspecte" : roll < 92 ? "Dupliquée" : roll < 97 ? "Rejetée" : "En analyse";
  const labels = EV_STEP_LABEL[task.zone] ?? ["Preuve terrain"];
  const suspicious = status === "Dupliquée" || status === "Suspecte";
  return {
    id: `ev-${date}-${task.id}-${idx}`,
    ref: `EVD-${date.replaceAll("-", "").slice(4)}-${(h % 900) + 100}`,
    kind: task.type === "Vidéo" ? "Vidéo" : idx === 2 && h % 5 === 0 ? "Vidéo" : "Photo",
    restaurantId,
    userId,
    processId: task.processId,
    stepName: labels[idx % labels.length] ?? task.name,
    taskId: task.id,
    taskName: task.name,
    zone: task.zone,
    date,
    time: addMinutes(task.time, 3 + idx * 4 + (h % 5)),
    aiScore: status === "Valide" ? 88 + (h % 12) : 40 + (h % 45),
    hash: `sha1:${(h * (idx + 7)).toString(16)}`,
    status,
    gradient: ZONE_GRADIENT[task.zone],
    ...(suspicious
      ? {
          similarity: status === "Dupliquée" ? 93 + (h % 7) : 70 + (h % 18),
          previousEvidenceId: `ev-${shiftDate(date, -1)}-${task.id}-${idx}`,
          note:
            status === "Dupliquée"
              ? "Empreinte identique à la preuve du jour précédent."
              : "Cadrage quasi identique à une preuve antérieure.",
        }
      : status === "Rejetée"
        ? { note: "Preuve floue ou hors sujet — nouvelle preuve demandée." }
        : {}),
  };
}

/** Preuves soumises pour une tâche à une date donnée (1 à 3 selon l'étape). */
export function taskEvidence(date: string, task: ShiftTask, restaurantId: string, userId: string): Evidence[] {
  if (!task.evidenceRequired) return [];
  const count = 1 + (hash(date + task.id) % 3);
  return Array.from({ length: count }, (_, i) => synthEvidence(date, task, restaurantId, userId, i));
}

/* -------------------- journée opérationnelle -------------------- */
export type DayKind = "past" | "today" | "future";

export interface DayTaskReport {
  task: ShiftTask;
  planned: string;
  startedAt?: string;
  completedAt?: string;
  status: ShiftTask["status"];
  stepsDone: number;
  stepsTotal: number;
  evidence?: Evidence;
  /** Toutes les preuves réellement soumises pour cette tâche ce jour-là. */
  evidences: Evidence[];
  evidenceRejected: boolean;
  fraud: boolean;
  comment?: string;
  result?: string;
}

export function dayKind(date: string, today: string): DayKind {
  return date < today ? "past" : date > today ? "future" : "today";
}

function addMinutes(time: string, min: number) {
  const [h = "0", m = "0"] = time.split(":");
  const total = Number(h) * 60 + Number(m) + min;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Rapport opérationnel d'une journée : historique réel (passé), état live (aujourd'hui), plan (futur). */
export function dayReport(
  date: string,
  today: string,
  s: State = state,
  restaurantId?: string,
): DayTaskReport[] {
  const tasks = tasksForDate(date, s);
  const kind = dayKind(date, today);
  const rid = restaurantId ?? s.restaurants[0]?.id ?? "r1";
  const uid2 = s.users.find((u) => u.restaurantId === rid)?.id ?? s.session?.userId ?? "u2";
  return tasks.map((task, i) => {
    if (kind === "today") {
      const ev = s.evidence.find((e) => e.id === task.evidenceId);
      const submitted =
        task.status === "Terminé"
          ? ev
            ? [ev, ...taskEvidence(date, task, rid, uid2).slice(1)]
            : taskEvidence(date, task, rid, uid2)
          : ev
            ? [ev]
            : [];
      return {
        task,
        planned: task.time,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
        status: task.status,
        stepsDone: task.status === "Terminé" ? 4 : task.status === "En cours" ? 2 : 0,
        stepsTotal: 4,
        evidence: submitted[0] ?? ev,
        evidences: submitted,
        evidenceRejected: ev?.status === "Rejetée",
        fraud: ev?.status === "Dupliquée" || ev?.status === "Suspecte",
        result: task.result,
      };
    }
    if (kind === "future") {
      return {
        task,
        planned: task.time,
        status: "À faire",
        stepsDone: 0,
        stepsTotal: 4,
        evidences: [],
        evidenceRejected: false,
        fraud: false,
      };
    }
    const h = hash(date + task.id + i);
    const roll = h % 100;
    const status: ShiftTask["status"] = roll < 82 ? "Terminé" : roll < 90 ? "En retard" : roll < 96 ? "Non conforme" : "Bloqué";
    const delay = roll < 82 ? h % 4 : 6 + (h % 22);
    const submitted = status === "Terminé" || status === "Non conforme" ? taskEvidence(date, task, rid, uid2) : [];
    const evidence = submitted[0];
    return {
      task,
      planned: task.time,
      startedAt: addMinutes(task.time, delay),
      completedAt: addMinutes(task.time, delay + task.duration + (h % 7)),
      status,
      stepsDone: status === "Terminé" ? 4 : 2 + (h % 2),
      stepsTotal: 4,
      evidence,
      evidences: submitted,
      evidenceRejected: submitted.some((e) => e.status === "Rejetée"),
      fraud: submitted.some((e) => e.status === "Dupliquée" || e.status === "Suspecte"),
      comment:
        status === "Non conforme"
          ? "Écart constaté — action corrective enregistrée par le responsable."
          : status === "En retard"
            ? "Démarrage tardif lié à l'affluence du service."
            : undefined,
      result: status === "Terminé" ? "Conforme" : status,
    };
  });
}

/* -------------------- agrégats de la journée -------------------- */
export interface DayStats {
  total: number;
  done: number;
  running: number;
  late: number;
  missed: number;
  planned: number;
  issues: number;
  fraud: number;
  evidenceRejected: number;
  progress: number;
  compliance: number;
}

export function dayStats(reports: DayTaskReport[]): DayStats {
  const total = reports.length;
  const done = reports.filter((r) => r.status === "Terminé").length;
  const running = reports.filter((r) => r.status === "En cours").length;
  const late = reports.filter((r) => r.status === "En retard").length;
  const missed = reports.filter((r) => r.status === "Bloqué" || r.status === "Non conforme").length;
  const planned = reports.filter((r) => r.status === "À faire").length;
  const fraud = reports.filter((r) => r.fraud).length;
  const evidenceRejected = reports.filter((r) => r.evidenceRejected).length;
  return {
    total,
    done,
    running,
    late,
    missed,
    planned,
    issues: missed + evidenceRejected + fraud,
    fraud,
    evidenceRejected,
    progress: Math.round((done / Math.max(1, total)) * 100),
    compliance: Math.round(((done - missed * 0.5 - evidenceRejected * 0.5) / Math.max(1, total)) * 100),
  };
}

export interface ProcessDayReport {
  process: Process;
  reports: DayTaskReport[];
  tasks: number;
  done: number;
  remaining: number;
  steps: number;
  stepsDone: number;
  fraud: number;
  evidence: number;
  progress: number;
  compliance: number;
  duration: number;
}

/** Niveau de complétion de chaque processus pour la date active. */
export function processDayReports(
  date: string,
  today: string,
  s: State = state,
  restaurantId?: string,
): ProcessDayReport[] {
  const reports = dayReport(date, today, s, restaurantId);
  const byProcess = new Map<string, DayTaskReport[]>();
  for (const r of reports) {
    const list = byProcess.get(r.task.processId) ?? [];
    list.push(r);
    byProcess.set(r.task.processId, list);
  }
  const out: ProcessDayReport[] = [];
  for (const [pid, list] of byProcess) {
    const process = s.processes.find((p) => p.id === pid);
    if (!process) continue;
    const steps = list.reduce((a, r) => a + r.stepsTotal, 0);
    const stepsDone = list.reduce((a, r) => a + r.stepsDone, 0);
    const done = list.filter((r) => r.status === "Terminé").length;
    const st = dayStats(list);
    out.push({
      process,
      reports: list,
      tasks: list.length,
      done,
      remaining: list.length - done,
      steps,
      stepsDone,
      fraud: st.fraud,
      evidence: list.filter((r) => !!r.evidence).length,
      progress: Math.round((stepsDone / Math.max(1, steps)) * 100),
      compliance: st.compliance,
      duration: list.reduce((a, r) => a + r.task.duration, 0),
    });
  }
  return out.sort((a, b) => a.process.name.localeCompare(b.process.name));
}


/* -------------------- alertes fraude -------------------- */
export function fraudAlertsFor(
  s: State = state,
  opts: { restaurantId?: string; date?: string } = {},
): FraudAlert[] {
  return s.fraudAlerts
    .filter((f) => (!opts.restaurantId || f.restaurantId === opts.restaurantId) && (!opts.date || f.date === opts.date))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
}

export interface FraudStats {
  today: number;
  week: number;
  open: number;
  resolved: number;
  critical: number;
}

export function fraudStats(list: FraudAlert[], today: string): FraudStats {
  const weekStart = shiftDate(today, -6);
  const isOpen = (f: FraudAlert) => f.status === "À vérifier" || f.status === "Nouvelle preuve demandée";
  return {
    today: list.filter((f) => f.date === today).length,
    week: list.filter((f) => f.date >= weekStart && f.date <= today).length,
    open: list.filter(isOpen).length,
    resolved: list.filter((f) => !isOpen(f)).length,
    critical: list.filter((f) => f.severity === "CRITICAL" && isOpen(f)).length,
  };
}

export function setFraudStatus(id: string, status: FraudStatus, author = "Responsable restaurant", text?: string) {
  setState((s) => ({
    fraudAlerts: s.fraudAlerts.map((f) =>
      f.id === id
        ? {
            ...f,
            status,
            comments: [
              ...f.comments,
              {
                at: new Date().toISOString().slice(0, 16).replace("T", " "),
                author,
                text: text ?? `Statut mis à jour : ${status}.`,
              },
            ],
          }
        : f,
    ),
  }));
}

export function addFraudComment(id: string, text: string, author = "Responsable restaurant") {
  setState((s) => ({
    fraudAlerts: s.fraudAlerts.map((f) =>
      f.id === id
        ? {
            ...f,
            comments: [
              ...f.comments,
              { at: new Date().toISOString().slice(0, 16).replace("T", " "), author, text },
            ],
          }
        : f,
    ),
  }));
}

/** Retrouve une preuve : catalogue seed ou preuve synthétisée d'une journée. */
export function findEvidence(id: string, s: State = state): Evidence | undefined {
  return s.evidence.find((e) => e.id === id);
}
