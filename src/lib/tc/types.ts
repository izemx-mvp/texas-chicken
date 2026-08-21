export type ID = string;

export type Zone =
  | "Cuisine"
  | "Stockage"
  | "Chambre froide"
  | "Salle"
  | "Toilettes"
  | "Terrasse"
  | "Entrée"
  | "Extérieur"
  | "Équipements";

export const ZONES: Zone[] = [
  "Cuisine",
  "Stockage",
  "Chambre froide",
  "Salle",
  "Toilettes",
  "Terrasse",
  "Entrée",
  "Extérieur",
  "Équipements",
];

export const ZONE_GROUP: Record<Zone, "BOH" | "FOH"> = {
  Cuisine: "BOH",
  Stockage: "BOH",
  "Chambre froide": "BOH",
  Équipements: "BOH",
  Salle: "FOH",
  Toilettes: "FOH",
  Terrasse: "FOH",
  Entrée: "FOH",
  Extérieur: "FOH",
};

export type Priority = "Basse" | "Normale" | "Haute" | "Critique";
export type Frequency =
  | "Par shift"
  | "Quotidien"
  | "Hebdomadaire"
  | "Mensuel"
  | "À la demande";

export type StepType =
  | "Checklist"
  | "Photo"
  | "Vidéo"
  | "Oui / Non"
  | "Score"
  | "Valeur numérique"
  | "Sélection"
  | "Commentaire"
  | "Anomalie";

export type TaskStatus =
  | "À faire"
  | "En cours"
  | "Terminé"
  | "En retard"
  | "Non conforme"
  | "Bloqué";

export interface Condition {
  id: ID;
  when: string;
  operator: ">" | "<" | "=" | "!=";
  value: string;
  then: string;
}

export interface ProcessStep {
  id: ID;
  name: string;
  description: string;
  instructions: string;
  zone: Zone;
  role: string;
  time: string;
  duration: number; // minutes
  frequency: Frequency;
  priority: Priority;
  type: StepType;
  evidenceRequired: boolean;
  critical: boolean;
  criteria: string;
  conditions: Condition[];
  videoUrl?: string;
  guide?: string[];
}

export type AvailabilityType = "Permanent" | "Période" | "Dates spécifiques";

export interface Availability {
  type: AvailabilityType;
  startDate?: string;
  endDate?: string;
  dates?: string[];
}

export interface ProcessVersion {
  version: string;
  author: string;
  date: string;
  changes: string;
}

export interface Process {
  id: ID;
  name: string;
  description: string;
  category: string;
  restaurantIds: ID[];
  zones: Zone[];
  role: string;
  priority: Priority;
  frequency: Frequency;
  status: "Actif" | "Brouillon" | "Archivé" | "Inactif";
  version: string;
  updatedAt: string;
  author: string;
  steps: ProcessStep[];
  versions: ProcessVersion[];
  availability: Availability;
}

export interface Restaurant {
  id: ID;
  name: string;
  code: string;
  city: string;
  address: string;
  managerId: ID;
  staff: number;
  status: "Actif" | "Inactif";
  compliance: number;
  processCount: number;
  controlCount: number;
  lastActivity: string;
  score: number;
  openedAt: string;
  lat: number;
  lng: number;
}

export type UserRole =
  | "Manager"
  | "Responsable restaurant"
  | "Operations Admin"
  | "Restaurant Admin"
  | "Auditeur"
  | "Super Admin"
  | "Operations Manager"
  | "General Manager"
  | "Restaurant Manager"
  | "Assistant Manager"
  | "Shift Leader"
  | "Crew Member"
  | "Cook"
  | "Cashier"
  | "Drive-Thru Staff"
  | "Cleaning / Hygiene Staff"
  | "Maintenance";


export interface User {
  id: ID;
  firstName: string;
  lastName: string;
  email: string;
  restaurantId: ID | null;
  /** Restaurants supplémentaires autorisés pour un manager multi-sites. */
  restaurantIds?: ID[];
  role: UserRole;
  status: "Actif" | "Inactif";
  lastLogin: string;
  score: number;
  tasks: number;
  late: number;
  processes: number;
  alerts: number;
  password?: string;
  roleId: ID;
}

export interface Control {
  id: ID;
  ref: string;
  processId: ID;
  restaurantId: ID;
  userId: ID;
  date: string;
  time: string;
  score: number;
  status:
    | "Conforme"
    | "Partiellement conforme"
    | "Non conforme"
    | "En retard"
    | "Incomplet";
  anomalies: string[];
  evidenceIds: ID[];
  duration: number;
  stepResults: { stepId: ID; name: string; status: TaskStatus; note: string }[];
  history: { at: string; label: string }[];
}

export interface Evidence {
  id: ID;
  ref: string;
  kind: "Photo" | "Vidéo";
  restaurantId: ID;
  userId: ID;
  processId: ID;
  stepName: string;
  date: string;
  time: string;
  aiScore: number;
  hash: string;
  status: "Valide" | "Rejetée" | "Dupliquée" | "Suspecte" | "En analyse";
  /** Dégradé CSS contextuel (zone) utilisé en repli si le média est indisponible. */
  gradient: string;
  /** Photo réellement soumise par le restaurant. */
  imageUrl?: string;
  /** Vidéo réellement soumise (preuve filmée). */
  videoUrl?: string;
  zone?: Zone;
  taskId?: ID;
  taskName?: string;
  /** Preuve antérieure détectée par l'IA anti-fraude. */
  previousEvidenceId?: ID;
  similarity?: number;
  note?: string;

}

/** Alerte anti-fraude générée par l'analyse IA des preuves. */
export type FraudSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type FraudStatus =
  | "À vérifier"
  | "Fraude confirmée"
  | "Rejetée"
  | "Nouvelle preuve demandée";

export interface FraudComment {
  at: string;
  author: string;
  text: string;
}

export interface FraudAlert {
  id: ID;
  ref: string;
  restaurantId: ID;
  userId: ID;
  processId: ID;
  taskName: string;
  stepName: string;
  date: string;
  time: string;
  evidenceId: ID;
  previousEvidenceId?: ID;
  similarity: number;
  reason: string;
  severity: FraudSeverity;
  status: FraudStatus;
  comments: FraudComment[];
}

export interface Alert {
  id: ID;
  type: string;
  level: "Information" | "Attention" | "Important" | "Critique";
  message: string;
  restaurantId: ID;
  userId: ID | null;
  processId: ID | null;
  createdAt: string;
  read: boolean;
  resolved: boolean;
}


export interface Standard {
  id: ID;
  name: string;
  description: string;
  category: string;
  zone: Zone;
  role: string;
  frequency: Frequency;
  time: string;
  duration: number;
  priority: Priority;
  evidenceRequired: boolean;
  criteria: string;
  status: "Actif" | "Inactif";
}

export const MODULES = [
  "Dashboard",
  "Restaurants",
  "Processus",
  "Contrôles",
  "Standards",
  "Checklists",
  "Utilisateurs",
  "Administrateurs",
  "Rôles",
  "Permissions",
  "Preuves",
  "Notifications",
  "Analytics",
  "Rapports",
  "Audit",
  "Paramètres",
] as const;
export type ModuleName = (typeof MODULES)[number];

export const PERMISSIONS = [
  "Voir",
  "Créer",
  "Modifier",
  "Supprimer",
  "Exporter",
] as const;
export type PermissionName = (typeof PERMISSIONS)[number];

export interface Role {
  id: ID;
  name: string;
  description: string;
  system: boolean;
  permissions: Record<string, PermissionName[]>;
}

export interface ShiftTask {
  id: ID;
  processId: ID;
  stepId: ID;
  name: string;
  description: string;
  instructions: string;
  zone: Zone;
  role: string;
  time: string;
  duration: number;
  frequency: Frequency;
  priority: Priority;
  type: StepType;
  evidenceRequired: boolean;
  status: TaskStatus;
  result?: string;
  evidenceId?: ID;
  videoUrl?: string;
  guide?: string[];
  date?: string;
  startedAt?: string;
  completedAt?: string;
}
