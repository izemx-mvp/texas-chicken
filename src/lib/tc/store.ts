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
import { REJECTED_PHOTO, evidenceVideo, zonePhoto } from "./media";
import {
  chatGroups as seedChatGroups,
  chatMessages as seedChatMessages,
  trainings as seedTrainings,
  trainingProgress as seedTrainingProgress,
  suppliers as seedSuppliers,
  purchaseOrders as seedPurchaseOrders,
  assigneesOf,
} from "./ops";
import type {
  ChatGroup,
  ChatMessage,
  OrderLine,
  OrderStatus,
  PurchaseOrder,
  Supplier,
  Training,
  TrainingProgress,
} from "./ops";

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
  chatGroups: ChatGroup[];
  chatMessages: ChatMessage[];
  trainings: Training[];
  trainingProgress: TrainingProgress[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
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
  chatGroups: seedChatGroups,
  chatMessages: seedChatMessages,
  trainings: seedTrainings,
  trainingProgress: seedTrainingProgress,
  suppliers: seedSuppliers,
  purchaseOrders: seedPurchaseOrders,
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
  const kind: Evidence["kind"] = task.type === "Vidéo" ? "Vidéo" : idx === 2 && h % 5 === 0 ? "Vidéo" : "Photo";
  return {
    id: `ev-${date}-${task.id}-${idx}`,
    ref: `EVD-${date.replaceAll("-", "").slice(4)}-${(h % 900) + 100}`,
    kind,
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
    imageUrl: status === "Rejetée" ? REJECTED_PHOTO : zonePhoto(task.zone, idx + (h % 3)),
    ...(kind === "Vidéo" ? { videoUrl: evidenceVideo(h) } : {}),
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

/* -------------------- détail d'exécution d'une tâche -------------------- */

/** Checklist réellement exécutée sur le terrain, par zone de contrôle. */
const CHECKLIST: Record<string, { name: string; question?: string; answers: string[]; ai: string }[]> = {
  Cuisine: [
    { name: "Vérifier nettoyage du plan de travail", answers: ["Conforme", "Conforme après reprise"], ai: "Plan de travail dégagé et désinfecté." },
    { name: "Vérifier nettoyage des équipements", answers: ["Conforme"], ai: "Équipements propres, aucun résidu détecté." },
    { name: "Contrôle huile des friteuses", question: "Indice de qualité de l'huile ?", answers: ["TPM 18 %", "TPM 21 %"], ai: "Couleur d'huile conforme au référentiel." },
    { name: "Température de maintien", question: "Température relevée ?", answers: ["64 °C", "66 °C"], ai: "Température visible et conforme (> 63 °C)." },
    { name: "Vérifier sol et évacuations", answers: ["Conforme", "Écart mineur"], ai: "Sol sec, siphons dégagés." },
    { name: "Fermeture des équipements", answers: ["Conforme"], ai: "Équipements éteints et sécurisés." },
  ],
  "Chambre froide": [
    { name: "Vérification température", question: "Température de la chambre froide ?", answers: ["4 °C — conforme", "3 °C — conforme", "6 °C — écart"], ai: "Température visible et environnement conforme." },
    { name: "Contrôle étiquetage DLC", answers: ["Conforme"], ai: "Étiquettes DLC lisibles sur l'ensemble des bacs." },
    { name: "Rangement froid positif", answers: ["Conforme", "Réorganisé"], ai: "Rangement conforme au plan de stockage." },
    { name: "Contrôle joints et fermeture", answers: ["Conforme"], ai: "Joints propres, fermeture étanche." },
    { name: "Relevé de la sonde", question: "Sonde calibrée ?", answers: ["Oui", "Oui — recalibrée"], ai: "Sonde présente et fonctionnelle." },
  ],
  Stockage: [
    { name: "Contrôle rotation des stocks", answers: ["FIFO respecté"], ai: "Rotation FIFO visible sur les rayonnages." },
    { name: "Étiquetage et DLC", answers: ["Conforme", "2 produits retirés"], ai: "Aucune DLC dépassée détectée." },
    { name: "Propreté de la réserve", answers: ["Conforme"], ai: "Sol propre, aucun carton au sol." },
    { name: "Contrôle nuisibles", question: "Traces détectées ?", answers: ["Aucune"], ai: "Aucune trace de nuisible visible." },
  ],
  Salle: [
    { name: "Nettoyage des tables", answers: ["Conforme"], ai: "Tables dégagées et désinfectées." },
    { name: "État des banquettes", answers: ["Conforme", "Écart mineur"], ai: "Assises propres, aucun dommage visible." },
    { name: "Propreté du sol", answers: ["Conforme"], ai: "Sol nettoyé, aucune zone grasse." },
    { name: "Affichage et menus", answers: ["Conforme"], ai: "Affichage réglementaire présent." },
  ],
  Toilettes: [
    { name: "Nettoyage sanitaires", answers: ["Conforme"], ai: "Sanitaires propres et secs." },
    { name: "Réassort consommables", question: "Consommables complets ?", answers: ["Oui", "Réassort effectué"], ai: "Savon et essuie-mains disponibles." },
    { name: "Fiche de suivi horaire", answers: ["Signée"], ai: "Fiche de passage renseignée." },
  ],
  Terrasse: [
    { name: "Propreté du mobilier", answers: ["Conforme"], ai: "Mobilier propre et aligné." },
    { name: "Propreté du sol extérieur", answers: ["Conforme", "Balayage refait"], ai: "Sol balayé, aucun déchet visible." },
    { name: "Sécurité des installations", answers: ["Conforme"], ai: "Installations stables et sécurisées." },
  ],
  Entrée: [
    { name: "Façade et vitrine", answers: ["Conforme"], ai: "Vitrine propre, enseigne fonctionnelle." },
    { name: "Paillasson et accès", answers: ["Conforme"], ai: "Accès dégagé et propre." },
    { name: "Affichage horaires", answers: ["Conforme"], ai: "Affichage à jour." },
  ],
  Extérieur: [
    { name: "Local poubelles", answers: ["Conforme", "Nettoyage complémentaire"], ai: "Bacs fermés, local nettoyé." },
    { name: "Abords et parking", answers: ["Conforme"], ai: "Abords dégagés, aucun déchet." },
    { name: "Éclairage extérieur", question: "Éclairage fonctionnel ?", answers: ["Oui"], ai: "Éclairage opérationnel." },
  ],
  Équipements: [
    { name: "Contrôle visuel équipement", answers: ["Conforme"], ai: "Aucun défaut visible." },
    { name: "Relevé compteur", question: "Valeur relevée ?", answers: ["1 284 kWh", "1 311 kWh"], ai: "Relevé lisible sur la photo." },
    { name: "Maintenance préventive", answers: ["Effectuée"], ai: "Opération de maintenance documentée." },
  ],
};

export type ExecStepStatus = "Validée" | "Non conforme" | "Non réalisée";

export interface ExecStep {
  index: number;
  name: string;
  type: string;
  status: ExecStepStatus;
  time: string;
  question?: string;
  answer?: string;
  comment?: string;
  ai?: string;
  aiScore?: number;
  evidence?: Evidence;
  /** Nouvelle preuve soumise après rejet de la première. */
  replacement?: Evidence;
  rejected: boolean;
  fraud: boolean;
}

export interface ExecTimelineEvent {
  at: string;
  label: string;
  kind: "start" | "step" | "evidence" | "issue" | "end";
}

export interface ExecutionDetail {
  key: string;
  date: string;
  task: ShiftTask;
  process?: Process;
  restaurant?: Restaurant;
  manager?: User;
  status: ShiftTask["status"];
  startedAt: string;
  completedAt?: string;
  duration: number;
  progress: number;
  compliance: number;
  steps: ExecStep[];
  evidences: Evidence[];
  timeline: ExecTimelineEvent[];
  comments: { author: string; at: string; text: string }[];
  kpi: {
    steps: number;
    done: number;
    undone: number;
    proofs: number;
    validated: number;
    rejected: number;
    fraud: number;
    compliance: number;
  };
}

function minutesBetween(a: string, b: string) {
  const [ah = "0", am = "0"] = a.split(":");
  const [bh = "0", bm = "0"] = b.split(":");
  return Number(bh) * 60 + Number(bm) - (Number(ah) * 60 + Number(am));
}

/**
 * Reconstitue l'exécution réelle d'une tâche : checklist, réponses du manager,
 * preuves photo/vidéo, horodatages, analyse IA, rejets et fraude.
 */
export function executionDetail(
  date: string,
  taskId: string,
  restaurantId?: string,
  s: State = state,
): ExecutionDetail | null {
  const report = dayReport(date, TODAY_DATE, s, restaurantId).find((r) => r.task.id === taskId);
  if (!report) return null;
  const task = report.task;
  const rid = restaurantId ?? s.restaurants[0]?.id ?? "r1";
  const restaurant = s.restaurants.find((r) => r.id === rid);
  const manager =
    s.users.find((u) => u.id === restaurant?.managerId) ??
    s.users.find((u) => u.restaurantId === rid) ??
    currentUser() ??
    undefined;
  const managerName = manager ? `${manager.firstName} ${manager.lastName}` : "Manager restaurant";

  const template = CHECKLIST[task.zone] ?? CHECKLIST['Cuisine'] ?? [];
  const base = hash(`${date}|${task.id}|exec`);
  const started = report.startedAt ?? task.time;
  const finished = report.completedAt;
  const future = dayKind(date, TODAY_DATE) === "future";
  const evidences = report.evidences;

  const steps: ExecStep[] = template.map((tpl, i) => {
    const h = hash(`${date}|${task.id}|${i}`);
    const evidence = evidences[i % Math.max(1, evidences.length)];
    const attached = evidences.length && (i < evidences.length || h % 3 === 0) ? evidence : undefined;
    const rejected = attached?.status === "Rejetée";
    const fraud = attached?.status === "Dupliquée" || attached?.status === "Suspecte";
    const stepStatus: ExecStepStatus = future
      ? "Non réalisée"
      : report.status === "Terminé"
        ? rejected || fraud
          ? "Non conforme"
          : "Validée"
        : i < report.stepsDone
          ? "Validée"
          : i === report.stepsDone && report.status !== "À faire"
            ? "Non conforme"
            : "Non réalisée";
    const answers = tpl.answers;
    const answer = answers[h % answers.length];
    const replacement =
      rejected && attached
        ? {
            ...attached,
            id: `${attached.id}-bis`,
            ref: `${attached.ref}-B`,
            status: "Valide" as const,
            aiScore: 91 + (h % 8),
            time: addMinutes(attached.time, 6 + (h % 8)),
            imageUrl: zonePhoto(task.zone, i + 1),
            note: "Nouvelle preuve conforme soumise après demande de l'administration.",
          }
        : undefined;
    return {
      index: i + 1,
      name: tpl.name,
      type: task.type,
      status: stepStatus,
      time: addMinutes(started, 2 + i * Math.max(2, Math.round(task.duration / Math.max(1, template.length)))),
      ...(tpl.question ? { question: tpl.question } : {}),
      ...(stepStatus === "Non réalisée" ? {} : { answer }),
      ...(h % 4 === 0 && stepStatus !== "Non réalisée"
        ? { comment: "Le nettoyage a été effectué avant la fermeture du service." }
        : {}),
      ...(stepStatus === "Non réalisée"
        ? {}
        : {
            ai: rejected
              ? "Image insuffisamment claire — nouvelle preuve demandée."
              : fraud
                ? `Similarité ${attached?.similarity ?? 95} % avec une preuve antérieure.`
                : tpl.ai,
            aiScore: attached?.aiScore ?? 88 + (h % 11),
          }),
      ...(attached && stepStatus !== "Non réalisée" ? { evidence: attached } : {}),
      ...(replacement ? { replacement } : {}),
      rejected: !!rejected,
      fraud: !!fraud,
    };
  });

  const done = steps.filter((x) => x.status === "Validée").length;
  const rejectedCount = steps.filter((x) => x.rejected).length;
  const fraudCount = steps.filter((x) => x.fraud).length;
  const proofs = steps.filter((x) => x.evidence).length;
  const validated = proofs - rejectedCount - fraudCount;
  const compliance = future
    ? 0
    : Math.max(
        0,
        Math.round(((done - rejectedCount * 0.5 - fraudCount) / Math.max(1, steps.length)) * 100),
      );

  const timeline: ExecTimelineEvent[] = [];
  if (!future) {
    timeline.push({ at: started, label: "Tâche démarrée", kind: "start" });
    steps.forEach((st) => {
      if (st.status === "Non réalisée") return;
      timeline.push({ at: st.time, label: `Étape ${st.index} — ${st.name}`, kind: "step" });
      if (st.evidence)
        timeline.push({
          at: st.evidence.time,
          label: `${st.evidence.kind} soumise — ${st.evidence.stepName}`,
          kind: st.rejected || st.fraud ? "issue" : "evidence",
        });
      if (st.replacement)
        timeline.push({ at: st.replacement.time, label: "Nouvelle preuve conforme soumise", kind: "evidence" });
    });
    if (finished) timeline.push({ at: finished, label: "Tâche terminée", kind: "end" });
    timeline.sort((a, b) => a.at.localeCompare(b.at));
  }

  const comments = [
    ...(report.comment ? [{ author: managerName, at: `${date} ${finished ?? started}`, text: report.comment }] : []),
    ...steps
      .filter((st) => st.comment)
      .slice(0, 2)
      .map((st) => ({ author: managerName, at: `${date} ${st.time}`, text: st.comment as string })),
  ];

  return {
    key: `${date}:${task.id}`,
    date,
    task,
    ...(s.processes.find((p) => p.id === task.processId) ? { process: s.processes.find((p) => p.id === task.processId) } : {}),
    ...(restaurant ? { restaurant } : {}),
    ...(manager ? { manager } : {}),
    status: report.status,
    startedAt: started,
    ...(finished ? { completedAt: finished } : {}),
    duration: finished ? Math.max(1, minutesBetween(started, finished)) : task.duration,
    progress: future ? 0 : Math.round((done / Math.max(1, steps.length)) * 100),
    compliance,
    steps,
    evidences: [...evidences, ...steps.flatMap((st) => (st.replacement ? [st.replacement] : []))],
    timeline,
    comments,
    kpi: {
      steps: steps.length,
      done,
      undone: steps.length - done,
      proofs,
      validated: Math.max(0, validated),
      rejected: rejectedCount,
      fraud: fraudCount,
      compliance,
    },
  };
}

/** Toutes les exécutions d'une journée pour un restaurant (table Administration). */
export function executionsForDate(date: string, restaurantId?: string, s: State = state): ExecutionDetail[] {
  return dayReport(date, TODAY_DATE, s, restaurantId)
    .map((r) => executionDetail(date, r.task.id, restaurantId, s))
    .filter(Boolean) as ExecutionDetail[];
}

/** Exécutions sur une plage de jours (historique multi-dates de l'Administration). */
export function executionsRange(
  from: string,
  days: number,
  restaurantId?: string,
  s: State = state,
): ExecutionDetail[] {
  const out: ExecutionDetail[] = [];
  for (let i = 0; i < days; i++) out.push(...executionsForDate(shiftDate(from, -i), restaurantId, s));
  return out;
}

/* ==================== COMMUNICATION (groupes & messages) ==================== */

export function groupsForUser(userId: string | undefined, s: State = state) {
  if (!userId) return [];
  const me = s.users.find((u) => u.id === userId);
  const isSuper = !!me && isSuperAdmin(me);
  return s.chatGroups.filter(
    (g) => g.status === "Actif" && (isSuper || g.memberIds.includes(userId)),
  );
}

export function messagesOf(groupId: string, s: State = state) {
  return s.chatMessages
    .filter((m) => m.groupId === groupId)
    .sort((a, b) => a.at.localeCompare(b.at));
}

export function unreadCount(groupId: string, userId: string | undefined, s: State = state) {
  if (!userId) return 0;
  return s.chatMessages.filter(
    (m) => m.groupId === groupId && m.userId !== userId && !m.readBy.includes(userId),
  ).length;
}

export function totalUnread(userId: string | undefined, s: State = state) {
  return groupsForUser(userId, s).reduce((a, g) => a + unreadCount(g.id, userId, s), 0);
}

function nowStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${state.activeDate} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function sendMessage(
  groupId: string,
  userId: string,
  text: string,
  attachments?: { name: string; kind: "Image" | "Document"; url?: string }[],
) {
  const mentions = (text.match(/@([\p{L}\-']+)/gu) ?? [])
    .map((m) => m.slice(1).toLowerCase())
    .flatMap((n) =>
      state.users.filter((u) => u.firstName.toLowerCase() === n || u.lastName.toLowerCase() === n).map((u) => u.id),
    );
  const msg: ChatMessage = {
    id: uid("m"),
    groupId,
    userId,
    text: text.trim(),
    at: nowStamp(),
    readBy: [userId],
    ...(attachments && attachments.length ? { attachments } : {}),
    ...(mentions.length ? { mentions } : {}),
  };
  setState((s) => ({ chatMessages: [...s.chatMessages, msg] }));
  return msg;
}


export function markGroupRead(groupId: string, userId: string) {
  setState((s) => ({
    chatMessages: s.chatMessages.map((m) =>
      m.groupId === groupId && !m.readBy.includes(userId) ? { ...m, readBy: [...m.readBy, userId] } : m,
    ),
  }));
}

export function upsertGroup(group: ChatGroup) {
  setState((s) => ({
    chatGroups: s.chatGroups.some((g) => g.id === group.id)
      ? s.chatGroups.map((g) => (g.id === group.id ? group : g))
      : [group, ...s.chatGroups],
  }));
}

export function removeGroup(id: string) {
  setState((s) => ({
    chatGroups: s.chatGroups.filter((g) => g.id !== id),
    chatMessages: s.chatMessages.filter((m) => m.groupId !== id),
  }));
}

export function toggleGroupStatus(id: string) {
  setState((s) => ({
    chatGroups: s.chatGroups.map((g) =>
      g.id === id ? { ...g, status: g.status === "Actif" ? "Inactif" : "Actif" } : g,
    ),
  }));
}

/* ============================== FORMATIONS ============================== */

export interface TrainingView {
  training: Training;
  totalSteps: number;
  doneSteps: number;
  percent: number;
  started: boolean;
  completed: boolean;
  nextStepId?: string;
  /** Points obtenus sur l'ensemble des quiz de la formation. */
  score: number;
  /** Score maximum atteignable. */
  maxScore: number;
  /** Pourcentage de réussite aux quiz. */
  scorePercent: number;
  /** Réponses déjà validées, par identifiant de question. */
  quizAnswers: Record<string, number[]>;
  /** Étapes dont le quiz a été validé. */
  quizDoneStepIds: string[];
}

export function trainingSteps(t: Training) {
  return t.modules.flatMap((m) => m.steps);
}

/** Score obtenu par un participant sur une question. */
export function scoreQuestion(q: QuizQuestion, answer: number[] | undefined): number {
  if (!answer) return 0;
  const a = [...answer].sort().join(",");
  const c = [...q.correct].sort().join(",");
  return a === c ? q.points : 0;
}

export function trainingView(trainingId: string, userId: string | undefined, s: State = state): TrainingView | null {
  const training = s.trainings.find((t) => t.id === trainingId);
  if (!training) return null;
  const all = trainingSteps(training);
  const prog = s.trainingProgress.find((p) => p.trainingId === trainingId && p.userId === userId);
  const done = prog?.completedStepIds ?? [];
  const doneSteps = all.filter((x) => done.includes(x.id)).length;
  const next = all.find((x) => !done.includes(x.id));
  const maxScore = trainingMaxScore(training);
  const scores = prog?.quizScores ?? {};
  const score = Object.values(scores).reduce((a, b) => a + b, 0);
  return {
    training,
    totalSteps: all.length,
    doneSteps,
    percent: all.length ? Math.round((doneSteps / all.length) * 100) : 0,
    started: doneSteps > 0,
    completed: doneSteps === all.length && all.length > 0,
    nextStepId: next?.id,
    score,
    maxScore,
    scorePercent: maxScore ? Math.round((score / maxScore) * 100) : 0,
    quizAnswers: prog?.quizAnswers ?? {},
    quizDoneStepIds: Object.keys(scores),
  };
}

export function trainingsForUser(userId: string | undefined, s: State = state): TrainingView[] {
  return s.trainings
    .map((t) => trainingView(t.id, userId, s))
    .filter((v): v is TrainingView => !!v);
}

export function toggleTrainingStep(trainingId: string, userId: string, stepId: string, done: boolean) {
  setState((s) => {
    const training = s.trainings.find((t) => t.id === trainingId);
    const all = training ? trainingSteps(training).map((x) => x.id) : [];
    const existing = s.trainingProgress.find((p) => p.trainingId === trainingId && p.userId === userId);
    const nextIds = done
      ? Array.from(new Set([...(existing?.completedStepIds ?? []), stepId]))
      : (existing?.completedStepIds ?? []).filter((x) => x !== stepId);
    const completedAt = nextIds.length === all.length && all.length ? s.activeDate : undefined;
    const entry: TrainingProgress = {
      ...existing,
      userId,
      trainingId,
      completedStepIds: nextIds,
      startedAt: existing?.startedAt ?? s.activeDate,
      lastActivity: s.activeDate,
      completedAt,
    };
    return {
      trainingProgress: existing
        ? s.trainingProgress.map((p) => (p === existing ? entry : p))
        : [...s.trainingProgress, entry],
    };
  });
}

/** Enregistre les réponses au quiz d'une étape et calcule les points obtenus. */
export function submitStepQuiz(
  trainingId: string,
  userId: string,
  stepId: string,
  answers: Record<string, number[]>,
) {
  setState((s) => {
    const training = s.trainings.find((t) => t.id === trainingId);
    const step = training ? trainingSteps(training).find((x) => x.id === stepId) : undefined;
    if (!step?.quiz?.length) return {};
    const earned = step.quiz.reduce((a, q) => a + scoreQuestion(q, answers[q.id]), 0);
    const existing = s.trainingProgress.find((p) => p.trainingId === trainingId && p.userId === userId);
    const entry: TrainingProgress = {
      ...existing,
      userId,
      trainingId,
      completedStepIds: existing?.completedStepIds ?? [],
      startedAt: existing?.startedAt ?? s.activeDate,
      lastActivity: s.activeDate,
      quizAnswers: { ...(existing?.quizAnswers ?? {}), ...answers },
      quizScores: { ...(existing?.quizScores ?? {}), [stepId]: earned },
    };
    return {
      trainingProgress: existing
        ? s.trainingProgress.map((p) => (p === existing ? entry : p))
        : [...s.trainingProgress, entry],
    };
  });
}


/* ---------------- administration des formations ---------------- */

export interface TrainingAssignee {
  user: User;
  restaurantName: string;
  percent: number;
  status: "Terminé" | "En cours" | "En retard" | "Non démarré";
  lastActivity?: string;
  dueDate?: string;
}

export interface TrainingAdminStats {
  training: Training;
  totalSteps: number;
  assigned: number;
  started: number;
  completed: number;
  late: number;
  notStarted: number;
  avgPercent: number;
  assignees: TrainingAssignee[];
}

export function trainingAdminStats(trainingId: string, s: State = state): TrainingAdminStats | null {
  const training = s.trainings.find((t) => t.id === trainingId);
  if (!training) return null;
  const totalSteps = trainingSteps(training).length;
  const assignees: TrainingAssignee[] = assigneesOf(training, s.users).map((user) => {
    const prog = s.trainingProgress.find((p) => p.trainingId === training.id && p.userId === user.id);
    const done = prog?.completedStepIds.length ?? 0;
    const percent = totalSteps ? Math.round((done / totalSteps) * 100) : 0;
    const overdue = !!prog?.dueDate && prog.dueDate < s.activeDate && percent < 100;
    return {
      user,
      restaurantName: s.restaurants.find((r) => r.id === user.restaurantId)?.name ?? "Réseau",
      percent,
      status: percent >= 100 ? "Terminé" : overdue ? "En retard" : percent > 0 ? "En cours" : "Non démarré",
      lastActivity: prog?.lastActivity,
      dueDate: prog?.dueDate,
    };
  });
  const completed = assignees.filter((a) => a.status === "Terminé").length;
  const late = assignees.filter((a) => a.status === "En retard").length;
  const started = assignees.filter((a) => a.status === "En cours").length;
  const notStarted = assignees.filter((a) => a.status === "Non démarré").length;
  return {
    training,
    totalSteps,
    assigned: assignees.length,
    started,
    completed,
    late,
    notStarted,
    avgPercent: assignees.length ? Math.round(assignees.reduce((a, x) => a + x.percent, 0) / assignees.length) : 0,
    assignees,
  };
}

export function allTrainingStats(s: State = state): TrainingAdminStats[] {
  return s.trainings.map((t) => trainingAdminStats(t.id, s)).filter((x): x is TrainingAdminStats => !!x);
}

export function upsertTraining(t: Training) {
  setState((s) => ({
    trainings: s.trainings.some((x) => x.id === t.id)
      ? s.trainings.map((x) => (x.id === t.id ? t : x))
      : [t, ...s.trainings],
  }));
}

export function removeTraining(id: string) {
  setState((s) => ({
    trainings: s.trainings.filter((t) => t.id !== id),
    trainingProgress: s.trainingProgress.filter((p) => p.trainingId !== id),
  }));
}

export function toggleTrainingStatus(id: string) {
  setState((s) => ({
    trainings: s.trainings.map((t) =>
      t.id === id ? { ...t, status: t.status === "Publiée" ? "Brouillon" : "Publiée" } : t,
    ),
  }));
}

export function duplicateTraining(id: string) {
  const src = state.trainings.find((t) => t.id === id);
  if (!src) return;
  const nid = uid("tr");
  const copy: Training = {
    ...src,
    id: nid,
    title: `${src.title} (copie)`,
    status: "Brouillon",
    createdAt: state.activeDate,
    modules: src.modules.map((m, mi) => ({
      ...m,
      id: `${nid}-m${mi + 1}`,
      steps: m.steps.map((st, si) => ({ ...st, id: `${nid}-m${mi + 1}-s${si + 1}` })),
    })),
  };
  upsertTraining(copy);
}

/* ========================= APPROVISIONNEMENT ========================= */

export function ordersFor(restaurantId: string | null | undefined, s: State = state) {
  const list = restaurantId ? s.purchaseOrders.filter((o) => o.restaurantId === restaurantId) : s.purchaseOrders;
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function orderTotal(o: PurchaseOrder) {
  return o.lines.reduce((a, l) => a + l.quantity * l.price, 0);
}

export function createOrder(input: {
  supplierId: string;
  restaurantId: string;
  lines: OrderLine[];
  note?: string;
  createdBy: string;
  expectedAt: string;
}) {
  const ref = `BC-2026-${String(200 + state.purchaseOrders.length).padStart(3, "0")}`;
  const at = nowStamp();
  const supplier = state.suppliers.find((x) => x.id === input.supplierId);
  const order: PurchaseOrder = {
    id: uid("po"),
    ref,
    supplierId: input.supplierId,
    restaurantId: input.restaurantId,
    createdBy: input.createdBy,
    createdAt: at,
    expectedAt: input.expectedAt,
    status: "Envoyée",
    lines: input.lines,
    note: input.note,
    history: [
      { at, label: "Bon de commande créé" },
      { at, label: `Envoyé à ${supplier?.name ?? "fournisseur"}` },
    ],
  };
  setState((s) => ({ purchaseOrders: [order, ...s.purchaseOrders] }));
  return order;
}

export function setOrderStatus(id: string, status: OrderStatus, label?: string) {
  const at = nowStamp();
  setState((s) => ({
    purchaseOrders: s.purchaseOrders.map((o) =>
      o.id === id ? { ...o, status, history: [...o.history, { at, label: label ?? `Statut : ${status}` }] } : o,
    ),
  }));
}

export function receiveOrder(
  id: string,
  by: string,
  data: { conform: boolean; comment?: string; photo?: string; receivedQuantities?: Record<string, number> },
) {
  const at = nowStamp();
  setState((s) => ({
    purchaseOrders: s.purchaseOrders.map((o) =>
      o.id === id
        ? {
            ...o,
            status: "Reçue" as OrderStatus,
            lines: o.lines.map((l) => ({
              ...l,
              receivedQuantity: data.receivedQuantities?.[l.productId] ?? l.quantity,
            })),
            reception: { at, by, conform: data.conform, comment: data.comment, photo: data.photo },
            history: [
              ...o.history,
              { at, label: data.conform ? "Livraison réceptionnée — conforme" : "Livraison réceptionnée — écart signalé" },
            ],
          }
        : o,
    ),
  }));
}

export interface DeliveryStats {
  attendues: number;
  envoyees: number;
  enLivraison: number;
  recues: number;
  enRetard: number;
}

export function deliveryStats(list: PurchaseOrder[]): DeliveryStats {
  return {
    attendues: list.filter((o) => ["Envoyée", "En préparation", "En livraison", "En retard"].includes(o.status)).length,
    envoyees: list.filter((o) => o.status === "Envoyée").length,
    enLivraison: list.filter((o) => o.status === "En livraison").length,
    recues: list.filter((o) => o.status === "Reçue" || o.status === "Clôturée").length,
    enRetard: list.filter((o) => o.status === "En retard").length,
  };
}
