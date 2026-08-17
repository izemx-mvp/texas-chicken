import type {
  Alert,
  Control,
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
  };
});

/* ---------------- users ---------------- */
export const roles: Role[] = [
  {
    id: "role-super",
    name: "Super Admin",
    description: "Accès total à la plateforme",
    system: true,
    permissions: {},
  },
  {
    id: "role-ops",
    name: "Operations Admin",
    description: "Pilotage opérationnel du réseau",
    system: true,
    permissions: {},
  },
  {
    id: "role-resto",
    name: "Restaurant Admin",
    description: "Gestion d'un périmètre de restaurants",
    system: true,
    permissions: {},
  },
  {
    id: "role-audit",
    name: "Auditeur",
    description: "Lecture seule, contrôles et preuves",
    system: true,
    permissions: {},
  },
  {
    id: "role-manager",
    name: "Manager",
    description: "Exécution terrain des standards",
    system: true,
    permissions: {},
  },
];

const ALL_MODULES = [
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
];
for (const m of ALL_MODULES) {
  roles[0].permissions[m] = ["Voir", "Créer", "Modifier", "Supprimer", "Exporter"];
  roles[1].permissions[m] = ["Dashboard", "Restaurants", "Processus", "Contrôles", "Standards", "Checklists", "Preuves", "Notifications", "Analytics", "Rapports"].includes(m)
    ? ["Voir", "Créer", "Modifier", "Exporter"]
    : ["Voir"];
  roles[2].permissions[m] = ["Dashboard", "Restaurants", "Contrôles", "Preuves", "Notifications", "Analytics"].includes(m)
    ? ["Voir", "Modifier", "Exporter"]
    : [];
  roles[3].permissions[m] = ["Dashboard", "Contrôles", "Preuves", "Analytics", "Rapports", "Audit"].includes(m)
    ? ["Voir", "Exporter"]
    : [];
  roles[4].permissions[m] = [];
}

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
const GRADS = [
  "from-amber-500/70 to-red-700/70",
  "from-orange-400/70 to-rose-800/70",
  "from-yellow-400/60 to-amber-700/70",
  "from-red-500/70 to-neutral-900/80",
  "from-lime-500/50 to-emerald-900/70",
  "from-sky-500/50 to-indigo-900/70",
];
export const evidence: Evidence[] = [];
for (let i = 1; i <= 220; i++) {
  const r = restaurants[i % restaurants.length];
  const p = processes[i % processes.length];
  const s = p.steps[i % p.steps.length];
  const statusRoll = rnd();
  evidence.push({
    id: `e${i}`,
    ref: `EVD-${1000 + i}`,
    kind: i % 17 === 0 ? "Vidéo" : "Photo",
    restaurantId: r.id,
    userId: users[(i % 28) + 1]?.id ?? "u1",
    processId: p.id,
    stepName: s.name,
    date: dateMinus(int(0, 88)),
    time: `${pad(int(6, 23))}:${pad(int(0, 59))}`,
    aiScore: Math.round((0.55 + rnd() * 0.44) * 100),
    hash: `sha1:${Math.floor(rnd() * 1e16).toString(16)}`,
    status:
      statusRoll > 0.9
        ? "Dupliquée"
        : statusRoll > 0.83
          ? "Rejetée"
          : statusRoll > 0.78
            ? "Suspecte"
            : statusRoll > 0.75
              ? "En analyse"
              : "Valide",
    gradient: GRADS[i % GRADS.length],
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
{
  let n = 0;
  for (const pid of SHIFT_PROCESSES) {
    const p = processes.find((x) => x.id === pid)!;
    p.steps.forEach((s, i) => {
      n++;
      let status: ShiftTask["status"] = "À faire";
      if (pid === "p1") status = "Terminé";
      else if (pid === "p3") status = i < 4 ? "Terminé" : i === 4 ? "En cours" : "À faire";
      else if (pid === "p4") status = i < 3 ? "Terminé" : "À faire";
      else if (pid === "p5") status = i < 2 ? "Terminé" : i === 2 ? "En retard" : "À faire";
      else if (pid === "p7") status = i === 0 ? "En retard" : "À faire";
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
        status,
      });
    });
  }
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
