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
}

export type UserRole =
  | "Manager"
  | "Responsable restaurant"
  | "Operations Admin"
  | "Restaurant Admin"
  | "Auditeur"
  | "Super Admin";

export interface User {
  id: ID;
  firstName: string;
  lastName: string;
  email: string;
  restaurantId: ID | null;
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
  gradient: string;
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
}
