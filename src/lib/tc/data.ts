import type {
  Alert,
  Control,
  FraudAlert,
  Evidence,
  Process,
  ProcessStep,
  Restaurant,
  Role,
  ShiftTask,
  Standard,
  User,
  Zone,
} from "./types";

/* ---------------- deterministic PRNG ---------------- */
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260817);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const int = (min: number, max: number) =>
  Math.floor(rnd() * (max - min + 1)) + min;
const pad = (n: number) => String(n).padStart(2, "0");

export const REF_DATE = new Date("2026-08-17T09:40:00");

function dateMinus(days: number) {
  const d = new Date(REF_DATE);
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function datePlus(days: number) {
  const d = new Date(REF_DATE);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const TODAY = `${REF_DATE.getFullYear()}-${pad(REF_DATE.getMonth() + 1)}-${pad(REF_DATE.getDate())}`;

/* ---------------- restaurants ---------------- */
const CITIES = [
  ["Tanger", "Centre"],
  ["Tanger", "Malabata"],
  ["Tétouan", "Martil"],
  ["Rabat", "Agdal"],
  ["Rabat", "Hay Riad"],
  ["Casablanca", "Maarif"],
  ["Casablanca", "Anfa Place"],
  ["Casablanca", "Ain Diab"],
  ["Marrakech", "Gueliz"],
  ["Marrakech", "Menara"],
  ["Agadir", "Founty"],
  ["Fès", "Ville Nouvelle"],
  ["Meknès", "Hamria"],
  ["Oujda", "Centre"],
  ["Kénitra", "Mimosas"],
  ["Casablanca", "Sidi Maarouf"],
  ["Tanger", "Free Zone"],
];

const FIRST = [
  "Youssef",
  "Salma",
  "Anas",
  "Imane",
  "Hamza",
  "Nadia",
  "Karim",
  "Sara",
  "Mehdi",
  "Fatima",
  "Reda",
  "Khadija",
  "Omar",
  "Leila",
  "Yassine",
  "Amine",
  "Hind",
  "Soufiane",
  "Meryem",
  "Ilyas",
  "Zineb",
  "Tarik",
  "Ghita",
  "Bilal",
  "Asmae",
  "Nabil",
  "Rania",
];
const LAST = [
  "El Amrani",
  "Bennani",
  "Alaoui",
  "Chraibi",
  "Berrada",
  "Tazi",
  "El Fassi",
  "Ouazzani",
  "Idrissi",
  "Benjelloun",
  "Sabri",
  "Hakimi",
  "Lahlou",
  "Moutawakil",
  "Sekkat",
  "Bourkia",
  "Radi",
  "Zniber",
];

export const CITY_COORDS: Record<string, [number, number]> = {
  Tanger: [35.7595, -5.834],
  "Tétouan": [35.5785, -5.3684],
  Rabat: [34.0209, -6.8416],
  Casablanca: [33.5731, -7.5898],
  Marrakech: [31.6295, -7.9811],
  Agadir: [30.4278, -9.5981],
  "Fès": [34.0331, -5.0003],
  "Meknès": [33.8935, -5.5473],
  Oujda: [34.6814, -1.9086],
  "Kénitra": [34.261, -6.5802],
};

export const restaurants: Restaurant[] = CITIES.map(([city, area], i) => {
  const compliance = [96, 93, 71, 88, 84, 91, 63, 78, 95, 82, 74, 89, 68, 86, 92, 80, 58][i];
  return {
    id: `r${i + 1}`,
    name: `Texas Chicken ${city} ${area}`,
    code: `TC-${city.slice(0, 3).toUpperCase()}-${pad(i + 1)}`,
    city,
    address: `${int(3, 240)} Avenue ${pick(["Mohammed V", "Hassan II", "Al Massira", "Ibn Battouta", "Zerktouni"])}, ${city}`,
    managerId: `u${i + 1}`,
    staff: int(14, 46),
    status: i === 16 ? "Inactif" : "Actif",
    compliance,
    processCount: int(6, 12),
    controlCount: int(40, 180),
    lastActivity: `${dateMinus(int(0, 3))} ${pad(int(7, 22))}:${pad(int(0, 59))}`,
    score: Math.max(40, Math.min(99, compliance + int(-6, 6))),
    openedAt: `20${int(14, 24)}-${pad(int(1, 12))}-${pad(int(1, 28))}`,
    lat: (CITY_COORDS[city as string]?.[0] ?? 33.5) + (i % 3 - 1) * 0.055,
    lng: (CITY_COORDS[city as string]?.[1] ?? -7.5) + ((i % 4) - 1.5) * 0.06,
  };
});

/* ---------------- users ---------------- */
/**
 * Système de rôles d'entreprise : administration, management restaurant et équipiers.
 * Chaque rôle possède une matrice de permissions par module (interface).
 */
const ALL_MODULES = [
  "Dashboard",
  "Restaurants",
  "Processus",
  "Contrôles",
  "Standards",
  "Checklists",
  "Formations",
  "Chat",
  "Groupes",
  "Commandes",
  "Livraisons",
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
];

type Perm = "Voir" | "Créer" | "Modifier" | "Supprimer" | "Exporter";
const CRUD: Perm[] = ["Voir", "Créer", "Modifier", "Supprimer", "Exporter"];
const RU: Perm[] = ["Voir", "Modifier"];
const RC: Perm[] = ["Voir", "Créer"];
const R: Perm[] = ["Voir"];
const NONE: Perm[] = [];

interface RoleDef {
  id: string;
  name: string;
  description: string;
  group: "Administration" | "Restaurant Management" | "Restaurant Staff";
  base: Perm[];
  overrides: Record<string, Perm[]>;
}

/**
 * Rôles de permission = 3 profils d'accès uniquement.
 * Le « rôle métier » (User.role) reste libre et couvre tous les métiers du réseau.
 */
const ROLE_DEFS: RoleDef[] = [
  {
    id: "role-super",
    name: "Super Admin",
    description: "Accès total à toutes les interfaces et à tous les modules",
    group: "Administration",
    base: CRUD,
    overrides: {},
  },
  {
    id: "role-admin",
    name: "Admin",
    description: "Accès limité à l'interface Administration",
    group: "Administration",
    base: RU,
    overrides: {
      Dashboard: R,
      Restaurants: RU,
      Processus: CRUD,
      Contrôles: CRUD,
      Standards: CRUD,
      Checklists: CRUD,
      Formations: CRUD,
      Chat: CRUD,
      Groupes: CRUD,
      Commandes: CRUD,
      Livraisons: RU,
      Preuves: ["Voir", "Exporter"],
      Notifications: R,
      Analytics: ["Voir", "Exporter"],
      Rapports: ["Voir", "Exporter"],
      Audit: R,
      Utilisateurs: RU,
      Administrateurs: NONE,
      Rôles: R,
      Permissions: R,
      Paramètres: R,
    },
  },
  {
    id: "role-staff",
    name: "Staff",
    description: "Accès uniquement à l'interface Restaurant Manager",
    group: "Restaurant Management",
    base: NONE,
    overrides: {
      Dashboard: R,
      Restaurants: R,
      Processus: R,
      Contrôles: CRUD,
      Checklists: CRUD,
      Standards: R,
      Formations: RU,
      Chat: RC,
      Groupes: R,
      Commandes: RC,
      Livraisons: RU,
      Preuves: RC,
      Notifications: R,
      Analytics: R,
    },
  },
];


export const ROLE_GROUPS = ["Administration", "Restaurant Management", "Restaurant Staff"] as const;
export const ROLE_GROUP_OF: Record<string, string> = {};

export const roles: Role[] = ROLE_DEFS.map((d) => {
  const permissions: Record<string, Perm[]> = {};
  for (const m of ALL_MODULES) permissions[m] = d.overrides[m] ?? d.base;
  ROLE_GROUP_OF[d.id] = d.group;
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    system: true,
    permissions,
  };
});


export const users: User[] = [];
users.push({
  id: "u1",
  firstName: "Youssef",
  lastName: "El Amrani",
  email: "manager@texaschicken-demo.com",
  password: "Manager123!",
  restaurantId: "r1",
  role: "Manager",
  roleId: "role-manager",
  status: "Actif",
  lastLogin: `${dateMinus(0)} 07:52`,
  score: 89,
  tasks: 30,
  late: 2,
  processes: 6,
  alerts: 3,
});
users.push({
  id: "u0",
  firstName: "Sanaa",
  lastName: "Bennis",
  email: "admin@texaschicken-demo.com",
  password: "Admin123!",
  restaurantId: null,
  role: "Super Admin",
  roleId: "role-super",
  status: "Actif",
  lastLogin: `${dateMinus(0)} 08:14`,
  score: 97,
  tasks: 0,
  late: 0,
  processes: 12,
  alerts: 0,
});

for (let i = 2; i <= 30; i++) {
  const f = FIRST[(i * 3) % FIRST.length];
  const l = LAST[(i * 5) % LAST.length];
  const rid = restaurants[(i - 1) % restaurants.length].id;
  const isAdmin = i > 26;
  users.push({
    id: `u${i}`,
    firstName: f,
    lastName: l,
    email: `${f.toLowerCase()}.${l.toLowerCase().replace(/[^a-z]/g, "")}@texaschicken-demo.com`,
    password: "Demo123!",
    restaurantId: isAdmin ? null : rid,
    role: isAdmin
      ? (["Operations Admin", "Restaurant Admin", "Auditeur", "Super Admin"][i - 27] as User["role"])
      : i % 5 === 0
        ? "Responsable restaurant"
        : "Manager",
    roleId: isAdmin
      ? ["role-ops", "role-resto", "role-audit", "role-super"][i - 27]
      : "role-manager",
    status: i % 11 === 0 ? "Inactif" : "Actif",
    lastLogin: `${dateMinus(int(0, 9))} ${pad(int(6, 23))}:${pad(int(0, 59))}`,
    score: int(55, 99),
    tasks: int(80, 460),
    late: int(0, 34),
    processes: int(3, 12),
    alerts: int(0, 14),
  });
}

/* équipiers & encadrement restaurant (accès application avec permissions adaptées) */
const STAFF_ROLES: [User["role"], string][] = [
  ["Restaurant Manager", "role-manager"],
  ["Assistant Manager", "role-assistant"],
  ["Shift Leader", "role-shift"],
  ["Crew Member", "role-crew"],
  ["Cook", "role-cook"],
  ["Cashier", "role-cashier"],
  ["Drive-Thru Staff", "role-drive"],
  ["Cleaning / Hygiene Staff", "role-clean"],
];
for (let i = 0; i < 40; i++) {
  const f = FIRST[(i * 7 + 2) % FIRST.length];
  const l = LAST[(i * 11 + 3) % LAST.length];
  const [role, roleId] = STAFF_ROLES[i % STAFF_ROLES.length]!;
  const rid = restaurants[i % Math.min(restaurants.length, 8)].id;
  users.push({
    id: `s${i + 1}`,
    firstName: f,
    lastName: l,
    email: `${f.toLowerCase()}.${l.toLowerCase().replace(/[^a-z]/g, "")}${i}@texaschicken-demo.com`,
    password: "Crew123!",
    restaurantId: rid,
    role,
    roleId,
    status: i % 13 === 0 ? "Inactif" : "Actif",
    lastLogin: `${dateMinus(int(0, 6))} ${pad(int(6, 23))}:${pad(int(0, 59))}`,
    score: int(60, 99),
    tasks: int(20, 220),
    late: int(0, 12),
    processes: int(1, 6),
    alerts: int(0, 5),
  });
}


/* ---------------- processes ---------------- */
const ROLE_OPTS = ["Manager", "Responsable restaurant", "Responsable zone"];

function step(
  pid: string,
  i: number,
  name: string,
  zone: Zone,
  type: ProcessStep["type"],
  opts: Partial<ProcessStep> = {},
): ProcessStep {
  return {
    id: `${pid}-s${i}`,
    name,
    description: `${name} — vérification conforme aux standards Texas Chicken.`,
    instructions: `Se rendre en zone ${zone}. Contrôler visuellement, mesurer si nécessaire, puis enregistrer le résultat. Toute anomalie doit être déclarée immédiatement.`,
    zone,
    role: ROLE_OPTS[i % 3],
    time: `${pad(6 + ((i * 2) % 15))}:${pad((i * 15) % 60)}`,
    duration: [2, 3, 5, 8, 10][i % 5],
    frequency: "Par shift",
    priority: i % 7 === 0 ? "Critique" : i % 3 === 0 ? "Haute" : "Normale",
    type,
    evidenceRequired: type === "Photo" || type === "Vidéo" || i % 4 === 0,
    critical: i % 7 === 0,
    criteria:
      type === "Valeur numérique"
        ? "Température comprise entre 0°C et 5°C"
        : type === "Score"
          ? "Score minimum requis : 80 %"
          : "Conforme au référentiel visuel Texas Chicken",
    guide: [
      `Préparer le matériel nécessaire pour « ${name} ».`,
      `Se positionner en zone ${zone} et sécuriser l'espace.`,
      `Réaliser le contrôle selon le référentiel Texas Chicken.`,
      `Enregistrer le résultat et la preuve demandée.`,
    ],
    videoUrl:
      i % 3 === 0
        ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
        : i % 3 === 1
          ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
          : undefined,
    conditions:
      type === "Valeur numérique"
        ? [
            {
              id: `${pid}-s${i}-c1`,
              when: "Température",
              operator: ">",
              value: "5",
              then: "Non conforme + Alerte critique",
            },
          ]
        : type === "Oui / Non"
          ? [
              {
                id: `${pid}-s${i}-c1`,
                when: "Réponse",
                operator: "=",
                value: "Non",
                then: "Demander une photo",
              },
            ]
          : [],
    ...opts,
  };
}

const PROCESS_DEFS: [string, string, Zone[], string[]][] = [
  [
    "Ouverture restaurant",
    "Ouverture",
    ["Extérieur", "Entrée", "Salle", "Toilettes", "Terrasse", "Chambre froide", "Stockage", "Cuisine", "Équipements"],
    [
      "Contrôle extérieur",
      "Entrée",
      "Salle",
      "Toilettes",
      "Terrasse",
      "Chambre froide",
      "Stockage",
      "Cuisine",
      "Équipements",
      "Validation finale",
    ],
  ],
  [
    "Fermeture restaurant",
    "Fermeture",
    ["Cuisine", "Salle", "Terrasse", "Stockage"],
    ["Arrêt équipements", "Nettoyage cuisine", "Rangement salle", "Fermeture terrasse", "Contrôle stocks", "Sécurisation caisse", "Validation fermeture"],
  ],
  [
    "Préparation avant service",
    "Service",
    ["Cuisine", "Stockage"],
    ["Mise en place", "Contrôle friteuses", "Contrôle marinades", "Contrôle DLC", "Briefing équipe", "Validation mise en place"],
  ],
  ["Contrôle cuisine", "Qualité", ["Cuisine"], ["Propreté surfaces", "Températures huiles", "Hygiène ustensiles", "Photo poste de cuisson", "Validation"]],
  ["Contrôle chambre froide", "Sécurité alimentaire", ["Chambre froide"], ["Température chambre", "Rotation FIFO", "Étiquetage DLC", "Photo rayonnages", "Validation"]],
  ["Contrôle stockage", "Sécurité alimentaire", ["Stockage"], ["Rangement", "DLC produits secs", "Propreté sol", "Photo réserve", "Validation"]],
  ["Contrôle hygiène", "Hygiène", ["Cuisine", "Toilettes"], ["Lavage des mains", "Tenues équipe", "Produits d'entretien", "Photo poste de lavage", "Score hygiène", "Validation"]],
  ["Contrôle salle", "Expérience client", ["Salle"], ["Propreté tables", "Sol et vitres", "Ambiance et musique", "Photo salle", "Validation"]],
  ["Contrôle toilettes", "Hygiène", ["Toilettes"], ["Propreté", "Consommables", "Odeurs", "Photo toilettes", "Validation"]],
  ["Contrôle terrasse", "Expérience client", ["Terrasse"], ["Tables", "Chaises", "Propreté sol", "Photo terrasse", "Validation"]],
  ["Contrôle sécurité", "Sécurité", ["Équipements", "Extérieur"], ["Extincteurs", "Issues de secours", "Éclairage secours", "Photo tableau électrique", "Validation"]],
  ["Contrôle qualité produit", "Qualité", ["Cuisine"], ["Poids portions", "Température produit", "Aspect visuel", "Photo produit fini", "Score dégustation", "Validation"]],
];

const TYPES: ProcessStep["type"][] = [
  "Checklist",
  "Oui / Non",
  "Photo",
  "Valeur numérique",
  "Score",
  "Commentaire",
  "Sélection",
];

export const processes: Process[] = PROCESS_DEFS.map(([name, category, zones, stepNames], idx) => {
  const id = `p${idx + 1}`;
  const steps = stepNames.map((sn, i) =>
    step(
      id,
      i + 1,
      sn,
      zones[i % zones.length],
      sn.toLowerCase().includes("photo")
        ? "Photo"
        : sn.toLowerCase().includes("température") || sn.toLowerCase().includes("poids")
          ? "Valeur numérique"
          : sn.toLowerCase().includes("score")
            ? "Score"
            : sn.toLowerCase().includes("validation")
              ? "Oui / Non"
              : TYPES[i % TYPES.length],
    ),
  );
  return {
    id,
    name,
    description: `Processus standardisé « ${name} » applicable au réseau Texas Chicken.`,
    category,
    restaurantIds: restaurants.slice(0, int(6, 17)).map((r) => r.id),
    zones,
    role: "Manager",
    priority: idx % 5 === 0 ? "Critique" : idx % 2 === 0 ? "Haute" : "Normale",
    frequency: idx < 3 ? "Par shift" : idx % 4 === 0 ? "Quotidien" : "Quotidien",
    status: idx === 11 ? "Brouillon" : "Actif",
    version: `${1 + (idx % 2)}.${idx % 3}`,
    updatedAt: dateMinus(int(1, 60)),
    author: "Sanaa Bennis",
    steps,
    versions: [
      { version: "1.0", author: "Sanaa Bennis", date: dateMinus(240), changes: "Création du processus" },
      { version: "1.1", author: "Operations Admin", date: dateMinus(120), changes: "Ajout des preuves photo obligatoires" },
      { version: `${1 + (idx % 2)}.${idx % 3}`, author: "Sanaa Bennis", date: dateMinus(int(1, 60)), changes: "Mise à jour des critères de validation" },
    ],
    availability:
      idx === 6
        ? { type: "Période", startDate: dateMinus(10), endDate: datePlus(20) }
        : idx === 9
          ? { type: "Dates spécifiques", dates: [dateMinus(0), datePlus(2), datePlus(5), datePlus(9)] }
          : idx === 11
            ? { type: "Période", startDate: datePlus(3), endDate: datePlus(45) }
            : { type: "Permanent" },
  };
});

/* ---------------- standards ---------------- */
export const standards: Standard[] = processes.flatMap((p, pi) =>
  p.steps.slice(0, 4).map((s, si) => ({
    id: `st${pi + 1}-${si + 1}`,
    name: `${s.name} — ${p.category}`,
    description: s.description,
    category: p.category,
    zone: s.zone,
    role: s.role,
    frequency: s.frequency,
    time: s.time,
    duration: s.duration,
    priority: s.priority,
    evidenceRequired: s.evidenceRequired,
    criteria: s.criteria,
    status: (pi + si) % 13 === 0 ? "Inactif" : "Actif",
  })),
);

/* ---------------- evidence ---------------- */
/**
 * Rendu visuel contextuel d'une preuve : chaque zone a sa propre ambiance
 * (inox froid de la chambre froide, chaleur de la cuisine, carrelage clair des
 * sanitaires…) afin de ne jamais réutiliser une image générique.
 */
export const ZONE_GRADIENT: Record<Zone, string> = {
  Cuisine:
    "linear-gradient(150deg, oklch(0.78 0.15 68) 0%, oklch(0.42 0.14 38) 55%, oklch(0.22 0.05 40) 100%)",
  Stockage:
    "linear-gradient(150deg, oklch(0.70 0.07 92) 0%, oklch(0.42 0.06 80) 55%, oklch(0.20 0.03 70) 100%)",
  "Chambre froide":
    "linear-gradient(150deg, oklch(0.86 0.06 225) 0%, oklch(0.55 0.09 235) 55%, oklch(0.24 0.05 240) 100%)",
  Salle:
    "linear-gradient(150deg, oklch(0.82 0.09 60) 0%, oklch(0.52 0.13 30) 55%, oklch(0.24 0.06 32) 100%)",
  Toilettes:
    "linear-gradient(150deg, oklch(0.90 0.03 200) 0%, oklch(0.65 0.05 210) 55%, oklch(0.30 0.03 215) 100%)",
  Terrasse:
    "linear-gradient(150deg, oklch(0.88 0.11 85) 0%, oklch(0.62 0.12 60) 55%, oklch(0.30 0.06 50) 100%)",
  Entrée:
    "linear-gradient(150deg, oklch(0.80 0.14 45) 0%, oklch(0.48 0.18 28) 55%, oklch(0.22 0.07 30) 100%)",
  Extérieur:
    "linear-gradient(150deg, oklch(0.82 0.07 240) 0%, oklch(0.50 0.08 250) 55%, oklch(0.24 0.04 250) 100%)",
  Équipements:
    "linear-gradient(150deg, oklch(0.76 0.04 250) 0%, oklch(0.45 0.04 255) 55%, oklch(0.22 0.02 255) 100%)",
};

export const evidence: Evidence[] = [];
for (let i = 1; i <= 220; i++) {
  const r = restaurants[i % restaurants.length];
  const p = processes[i % processes.length];
  const s = p.steps[i % p.steps.length];
  const statusRoll = rnd();
  const status: Evidence["status"] =
    statusRoll > 0.9
      ? "Dupliquée"
      : statusRoll > 0.83
        ? "Rejetée"
        : statusRoll > 0.78
          ? "Suspecte"
          : statusRoll > 0.75
            ? "En analyse"
            : "Valide";
  evidence.push({
    id: `e${i}`,
    ref: `EVD-${1000 + i}`,
    kind: i % 17 === 0 ? "Vidéo" : "Photo",
    restaurantId: r.id,
    userId: users[(i % 28) + 1]?.id ?? "u1",
    processId: p.id,
    stepName: s.name,
    taskName: s.name,
    zone: s.zone,
    date: dateMinus(int(0, 88)),
    time: `${pad(int(6, 23))}:${pad(int(0, 59))}`,
    aiScore: Math.round((0.55 + rnd() * 0.44) * 100),
    hash: `sha1:${Math.floor(rnd() * 1e16).toString(16)}`,
    status,
    gradient: ZONE_GRADIENT[s.zone],
    ...(status === "Dupliquée" || status === "Suspecte"
      ? {
          similarity: status === "Dupliquée" ? 92 + int(0, 8) : 74 + int(0, 12),
          previousEvidenceId: `e${Math.max(1, i - 7)}`,
          note:
            status === "Dupliquée"
              ? "Empreinte identique à une preuve déjà utilisée."
              : "Cadrage et luminosité très proches d'une preuve antérieure.",
        }
      : {}),
  });
}


/* ---------------- controls ---------------- */
export const controls: Control[] = [];
for (let i = 1; i <= 420; i++) {
  const r = restaurants[i % restaurants.length];
  const p = processes[(i * 3) % processes.length];
  const u = users.filter((x) => x.restaurantId === r.id)[0] ?? users[0];
  const base = r.compliance + int(-18, 12);
  const score = Math.max(28, Math.min(100, base));
  const status: Control["status"] =
    score >= 90 ? "Conforme" : score >= 75 ? "Partiellement conforme" : score >= 60 ? "Incomplet" : i % 9 === 0 ? "En retard" : "Non conforme";
  const day = int(0, 120);
  controls.push({
    id: `c${i}`,
    ref: `CTL-${5000 + i}`,
    processId: p.id,
    restaurantId: r.id,
    userId: u.id,
    date: dateMinus(day),
    time: `${pad(int(6, 22))}:${pad(int(0, 59))}`,
    score,
    status,
    anomalies:
      score < 80
        ? [
            "Température chambre froide hors seuil",
            "Étiquetage DLC incomplet",
            "Sol cuisine non conforme",
            "Preuve photo rejetée",
          ].slice(0, int(1, 3))
        : [],
    evidenceIds: evidence.slice(i % 180, (i % 180) + int(1, 3)).map((e) => e.id),
    duration: int(12, 75),
    stepResults: p.steps.map((s, si) => ({
      stepId: s.id,
      name: s.name,
      status: (score < 70 && si % 4 === 0 ? "Non conforme" : si % 9 === 7 ? "En retard" : "Terminé") as ShiftTask["status"],
      note: score < 70 && si % 4 === 0 ? "Écart constaté, action corrective demandée." : "RAS",
    })),
    history: [
      { at: `${dateMinus(day)} 08:02`, label: "Contrôle démarré" },
      { at: `${dateMinus(day)} 08:31`, label: "Preuves téléversées et analysées par l'IA" },
      { at: `${dateMinus(day)} 08:44`, label: `Contrôle clôturé — score ${score}%` },
    ],
  });
}

/* ---------------- alerts ---------------- */
const ALERT_TYPES: [string, Alert["level"], string][] = [
  ["Tâche en retard", "Attention", "Tâche « Contrôle chambre froide » en retard de 42 min"],
  ["Processus en retard", "Important", "Processus « Ouverture restaurant » non finalisé"],
  ["Étape critique", "Critique", "Étape critique « Températures huiles » non réalisée"],
  ["Non-conformité", "Important", "Non-conformité relevée en zone Cuisine"],
  ["Preuve rejetée", "Attention", "Preuve photo rejetée par l'analyse IA"],
  ["Photo dupliquée", "Critique", "Photo déjà utilisée détectée par l'anti-fraude IA"],
  ["Restaurant sous seuil", "Critique", "Conformité sous le seuil réseau de 75 %"],
  ["Performance manager faible", "Information", "Score manager en baisse sur 7 jours"],
];
export const alerts: Alert[] = [];
for (let i = 1; i <= 128; i++) {
  const [type, level, message] = ALERT_TYPES[i % ALERT_TYPES.length];
  const r = restaurants[(i * 5) % restaurants.length];
  alerts.push({
    id: `a${i}`,
    type,
    level,
    message: `${message} — ${r.name}`,
    restaurantId: r.id,
    userId: users[(i % 28) + 1]?.id ?? null,
    processId: processes[i % processes.length].id,
    createdAt: `${dateMinus(int(0, 21))} ${pad(int(6, 23))}:${pad(int(0, 59))}`,
    read: i % 3 === 0,
    resolved: i % 7 === 0,
  });
}

/* ---------------- shift tasks (manager scenario) ---------------- */
const SHIFT_PROCESSES = ["p1", "p3", "p4", "p5", "p7", "p2"];
export const shiftTasks: ShiftTask[] = [];
// heure « courante » du shift simulé : tout ce qui précède est traité, la suite reste à faire
export const SHIFT_NOW = "11:30";
{
  let n = 0;
  for (const pid of SHIFT_PROCESSES) {
    const p = processes.find((x) => x.id === pid)!;
    p.steps.forEach((s) => {
      n++;
      shiftTasks.push({
        id: `t${n}`,
        processId: pid,
        stepId: s.id,
        name: s.name,
        description: s.description,
        instructions: s.instructions,
        zone: s.zone,
        role: s.role,
        time: s.time,
        duration: s.duration,
        frequency: s.frequency,
        priority: s.priority,
        type: s.type,
        evidenceRequired: s.evidenceRequired,
        status: "À faire",
        date: TODAY,
        guide: s.guide,
        videoUrl: s.videoUrl,
      });
    });
  }
}

// ordre chronologique global du shift (toutes tâches, tous processus confondus)
shiftTasks.sort((a, b) => (a.time === b.time ? a.id.localeCompare(b.id) : a.time.localeCompare(b.time)));

// statuts cohérents avec la chronologie : passé = traité, présent = en cours, futur = à faire
{
  let currentAssigned = false;
  shiftTasks.forEach((t, i) => {
    if (t.time < SHIFT_NOW) {
      // quelques exceptions réalistes dans le passé
      t.status = i % 11 === 7 ? "Non conforme" : i % 9 === 5 ? "En retard" : "Terminé";
      t.startedAt = `${TODAY} ${t.time}`;
      t.completedAt = `${TODAY} ${t.time}`;
    } else if (!currentAssigned) {
      t.status = "En cours";
      t.startedAt = `${TODAY} ${t.time}`;
      currentAssigned = true;
    } else {
      t.status = "À faire";
    }
  });
}

/* ---------------- history / trends ---------------- */
export const complianceHistory = Array.from({ length: 26 }, (_, i) => {
  const d = new Date(REF_DATE);
  d.setDate(d.getDate() - (25 - i) * 7);
  return {
    label: `S${pad(i + 1)}`,
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    conformite: Math.round(68 + i * 0.75 + Math.sin(i / 2) * 5),
    preuves: Math.round(120 + i * 6 + Math.cos(i / 3) * 18),
    anomalies: Math.round(48 - i * 0.9 + Math.sin(i / 1.7) * 7),
  };
});

/* ---------------- alertes fraude (scénarios IA) ---------------- */
const FRAUD_CASES: {
  reason: string;
  severity: FraudAlert["severity"];
  similarity: number;
  status: FraudAlert["status"];
}[] = [
  { reason: "Photo identique détectée — empreinte déjà utilisée hier.", severity: "CRITICAL", similarity: 99, status: "À vérifier" },
  { reason: "Photo très similaire à une preuve précédente (même cadrage).", severity: "HIGH", similarity: 96, status: "À vérifier" },
  { reason: "Preuve prise avant l'heure planifiée de l'étape.", severity: "MEDIUM", similarity: 61, status: "Nouvelle preuve demandée" },
  { reason: "Preuve incohérente avec la zone déclarée.", severity: "MEDIUM", similarity: 48, status: "Fraude confirmée" },
  { reason: "Tentative de réutilisation d'une ancienne preuve (J-6).", severity: "HIGH", similarity: 94, status: "Rejetée" },
  { reason: "Luminosité et métadonnées suspectes détectées par l'IA.", severity: "LOW", similarity: 38, status: "À vérifier" },
];

export const fraudAlerts: FraudAlert[] = [];
{
  let n = 0;
  for (let day = 0; day <= 9; day++) {
    const date = dateMinus(day);
    const count = day === 0 ? 3 : day < 7 ? ((day % 2) + 1) : 1;
    for (let k = 0; k < count; k++) {
      n++;
      // Le restaurant du shift concentre les cas du jour pour la démo Manager.
      const r = day <= 1 || n % 3 === 0 ? restaurants[0] : restaurants[(n * 5) % restaurants.length];
      const p = processes[(n * 2) % processes.length];
      const s = p.steps[n % p.steps.length];
      const c = FRAUD_CASES[n % FRAUD_CASES.length];
      const ev = evidence[(n * 7) % evidence.length];
      const prev = evidence[(n * 7 + 13) % evidence.length];
      const resolved = day > 2 && n % 3 !== 0;
      fraudAlerts.push({
        id: `f${n}`,
        ref: `FRD-${2000 + n}`,
        restaurantId: r.id,
        userId: users.find((u) => u.restaurantId === r.id)?.id ?? "u2",
        processId: p.id,
        taskName: p.name,
        stepName: s.name,
        date,
        time: `${pad(7 + ((n * 3) % 13))}:${pad((n * 17) % 60)}`,
        evidenceId: ev.id,
        previousEvidenceId: prev.id,
        similarity: c.similarity,
        reason: c.reason,
        severity: c.severity,
        status: resolved ? (n % 2 === 0 ? "Fraude confirmée" : "Rejetée") : c.status,
        comments: resolved
          ? [
              {
                at: `${date} ${pad(9 + (n % 8))}:15`,
                author: "Analyse IA",
                text: `Similarité ${c.similarity} % avec la preuve ${prev.ref}.`,
              },
              {
                at: `${date} ${pad(10 + (n % 7))}:02`,
                author: "Responsable restaurant",
                text: n % 2 === 0 ? "Fraude confirmée après vérification terrain." : "Alerte rejetée : contexte justifié.",
              },
            ]
          : [
              {
                at: `${date} ${pad(9 + (n % 8))}:15`,
                author: "Analyse IA",
                text: `Similarité ${c.similarity} % avec la preuve ${prev.ref}.`,
              },
            ],
      });
    }
  }
}
