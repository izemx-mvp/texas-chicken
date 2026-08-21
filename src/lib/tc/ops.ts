/**
 * Modules opérationnels additionnels : communication (groupes & messages),
 * formations métier, approvisionnement (fournisseurs, bons de commande, livraisons).
 * Mock data déterministe et riche, branchée sur les restaurants / utilisateurs existants.
 */
import { restaurants, users, TODAY, REF_DATE } from "./data";
import type { ID } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");
const shift = (days: number) => {
  const d = new Date(REF_DATE);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/* ============================ CHAT / GROUPES ============================ */

export type GroupType =
  | "Groupe restaurant"
  | "Groupe managers"
  | "Groupe opérationnel"
  | "Groupe régional"
  | "Groupe administration"
  | "Groupe personnalisé";

export const GROUP_TYPES: GroupType[] = [
  "Groupe restaurant",
  "Groupe managers",
  "Groupe opérationnel",
  "Groupe régional",
  "Groupe administration",
  "Groupe personnalisé",
];

export interface ChatMessage {
  id: ID;
  groupId: ID;
  userId: ID;
  text: string;
  at: string; // "YYYY-MM-DD HH:mm"
  readBy: ID[];
}

export interface ChatGroup {
  id: ID;
  name: string;
  description: string;
  type: GroupType;
  restaurantId: ID | null;
  avatar: string; // dégradé CSS
  memberIds: ID[];
  adminId: ID;
  createdAt: string;
  status: "Actif" | "Inactif";
}

const AVATARS = [
  "linear-gradient(135deg,#d8452f,#f0a32f)",
  "linear-gradient(135deg,#2f6fd8,#39c2c9)",
  "linear-gradient(135deg,#8e44ad,#e8b23a)",
  "linear-gradient(135deg,#1f8a54,#a8d94a)",
  "linear-gradient(135deg,#c0392b,#7f2d1d)",
  "linear-gradient(135deg,#34495e,#5f8fb0)",
  "linear-gradient(135deg,#e8b23a,#d8452f)",
];

const managerUser = users.find((u) => u.id === "u1")!;
const adminUser = users.find((u) => u.id === "u0")!;
const staffOf = (rid: ID) => users.filter((u) => u.restaurantId === rid).map((u) => u.id);

const GROUP_DEFS: [string, string, GroupType, ID | null][] = [
  ["Restaurant Casablanca — Équipe", "Coordination quotidienne de l'équipe du restaurant", "Groupe restaurant", "r1"],
  ["Restaurant Rabat — Équipe", "Shift, ouverture / fermeture et incidents", "Groupe restaurant", "r2"],
  ["Managers Maroc", "Échanges entre responsables de restaurants du réseau", "Groupe managers", null],
  ["Direction Opérations", "Pilotage réseau, standards et performance", "Groupe administration", null],
  ["Cuisine & Operations", "Standards produit, cuisson, qualité et hygiène", "Groupe opérationnel", null],
  ["Maintenance", "Pannes équipements, interventions et suivi technique", "Groupe opérationnel", null],
  ["Région Grand Casablanca", "Coordination régionale multi-restaurants", "Groupe régional", null],
  ["Administration", "Comptes, permissions, approvisionnement et reporting", "Groupe administration", null],
];

export const chatGroups: ChatGroup[] = GROUP_DEFS.map(([name, description, type, rid], i) => {
  const base = rid ? staffOf(rid) : users.slice(0, 10).map((u) => u.id);
  const memberIds = Array.from(new Set([managerUser.id, adminUser.id, ...base])).slice(0, 12);
  return {
    id: `g${i + 1}`,
    name,
    description,
    type,
    restaurantId: rid,
    avatar: AVATARS[i % AVATARS.length]!,
    memberIds,
    adminId: type === "Groupe restaurant" ? managerUser.id : adminUser.id,
    createdAt: shift(-120 + i * 9),
    status: i === 6 ? "Inactif" : "Actif",
  };
});

const MSG_SCRIPTS: Record<string, string[]> = {
  g1: [
    "Bonjour l'équipe, ouverture validée à 07:05, températures conformes.",
    "La friteuse 2 chauffe lentement, je passe une demande maintenance.",
    "Bien reçu, je note l'anomalie sur le contrôle du shift.",
    "Livraison surgelés annoncée pour 14:00, prévoir deux personnes en réception.",
    "Rush midi terminé, salle nettoyée et preuves photo envoyées.",
  ],
  g2: [
    "Checklist fermeture d'hier complète, aucune non-conformité.",
    "Stock packaging bas : boîtes 8 pièces à commander.",
    "Je remonte le besoin à l'administration ce matin.",
  ],
  g3: [
    "Rappel : audit hygiène réseau la semaine prochaine.",
    "Casablanca à 94% de conformité cette semaine, bravo l'équipe.",
    "Pensez à valider les formations Food Safety avant vendredi.",
  ],
  g4: [
    "Nouveau standard de cuisson diffusé à tous les restaurants.",
    "Les bons de commande passent désormais par la plateforme.",
    "Reporting mensuel disponible dans Analytics.",
  ],
  g5: [
    "Contrôle huile de friture : viscosité à vérifier deux fois par shift.",
    "Photos de plan de travail à prendre après chaque nettoyage.",
  ],
  g6: [
    "Intervention prévue mercredi sur la chambre froide de Rabat.",
    "Pièce détachée commandée, délai 48h.",
  ],
  g7: ["Réunion régionale jeudi 10:00 en visio."],
  g8: [
    "Nouveaux comptes équipiers créés pour Casablanca et Marrakech.",
    "Permissions Formations activées pour tous les rôles restaurant.",
  ],
};

export const chatMessages: ChatMessage[] = [];
chatGroups.forEach((g, gi) => {
  const scripts = MSG_SCRIPTS[g.id] ?? ["Message d'équipe Texas Chicken."];
  scripts.forEach((text, i) => {
    const author = g.memberIds[(i + gi) % g.memberIds.length]!;
    const dayOffset = i === scripts.length - 1 ? 0 : -(scripts.length - i);
    const hour = 7 + i * 2;
    const unread = i >= scripts.length - 1 && gi % 2 === 0;
    chatMessages.push({
      id: `m${g.id}-${i}`,
      groupId: g.id,
      userId: author,
      text,
      at: `${shift(dayOffset)} ${pad(Math.min(hour, 21))}:${pad((i * 17) % 60)}`,
      readBy: unread ? [author] : g.memberIds,
    });
  });
});

/* ============================== FORMATIONS ============================== */

export type TrainingLevel = "Débutant" | "Intermédiaire" | "Avancé";

export interface TrainingStep {
  id: ID;
  title: string;
  content: string;
  videoUrl?: string;
  duration: number; // minutes
  tips: string[];
  warnings: string[];
}

export interface TrainingModule {
  id: ID;
  title: string;
  steps: TrainingStep[];
}

export interface TrainingQuiz {
  question: string;
  options: string[];
  answer: number;
}

export interface Training {
  id: ID;
  title: string;
  description: string;
  category: string;
  roles: string[];
  level: TrainingLevel;
  duration: number; // minutes
  mandatory: boolean;
  cover: string; // dégradé
  mainVideo: string;
  documents: { name: string; type: string }[];
  rules: string[];
  modules: TrainingModule[];
  quiz: TrainingQuiz[];
  status: "Publiée" | "Brouillon";
}

const VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
];

const TRAINING_DEFS: {
  title: string;
  description: string;
  category: string;
  roles: string[];
  level: TrainingLevel;
  mandatory: boolean;
  modules: [string, string[]][];
}[] = [
  {
    title: "Food Safety Basics",
    description:
      "Les fondamentaux de la sécurité alimentaire Texas Chicken : hygiène personnelle, chaîne du froid, contaminations croisées.",
    category: "Hygiène & Sécurité",
    roles: ["Crew Member", "Cook", "Cashier", "Shift Leader", "Restaurant Manager"],
    level: "Débutant",
    mandatory: true,
    modules: [
      ["Hygiène personnelle", ["Lavage des mains", "Tenue et EPI", "Santé et déclaration"]],
      ["Chaîne du froid", ["Températures de stockage", "Réception marchandise", "Contrôle et traçabilité"]],
      ["Contaminations croisées", ["Codes couleur planches", "Séparation cru / cuit", "Nettoyage & désinfection"]],
    ],
  },
  {
    title: "Kitchen Operations",
    description: "Maîtriser le poste cuisine : mise en place, friteuses, cuissons, temps de maintien.",
    category: "Cuisine",
    roles: ["Cook", "Crew Member", "Shift Leader"],
    level: "Intermédiaire",
    mandatory: true,
    modules: [
      ["Mise en place", ["Préparer son poste", "Panage et marinade", "Rotation FIFO"]],
      ["Cuisson", ["Paramètres friteuse", "Contrôle de l'huile", "Temps et températures à cœur"]],
      ["Maintien produit", ["Holding time", "Gestion des rebuts", "Qualité visuelle"]],
    ],
  },
  {
    title: "Product Preparation — Burger Texas Chicken",
    description:
      "Assembler un burger conforme au standard Texas Chicken : grammage, ordre des ingrédients, présentation.",
    category: "Produit",
    roles: ["Cook", "Crew Member"],
    level: "Débutant",
    mandatory: true,
    modules: [
      ["Standard produit", ["Présentation du standard", "Fiche technique et grammages"]],
      ["Préparation", ["Préparation du poste", "Préparation des ingrédients"]],
      ["Assemblage", ["Ordre d'assemblage", "Dosage des sauces", "Emballage"]],
      ["Contrôle qualité", ["Contrôle visuel", "Présentation finale", "Erreurs à éviter"]],
    ],
  },
  {
    title: "Customer Service",
    description: "Accueil, posture et gestion des réclamations selon l'expérience Texas Chicken.",
    category: "Service",
    roles: ["Cashier", "Crew Member", "Shift Leader", "Assistant Manager"],
    level: "Débutant",
    mandatory: false,
    modules: [
      ["Accueil client", ["Les 5 étapes de l'accueil", "Langage et posture"]],
      ["Gestion des situations", ["Réclamations", "Attente et rush", "Fidélisation"]],
    ],
  },
  {
    title: "Cashier Operations",
    description: "Encaissement, fonds de caisse, moyens de paiement et clôture.",
    category: "Caisse",
    roles: ["Cashier", "Shift Leader"],
    level: "Débutant",
    mandatory: true,
    modules: [
      ["Ouverture de caisse", ["Fonds de caisse", "Vérification matériel"]],
      ["Encaissement", ["Prise de commande", "Paiements et rendus", "Erreurs et annulations"]],
      ["Clôture", ["Comptage", "Écarts de caisse", "Remise en coffre"]],
    ],
  },
  {
    title: "Drive-Thru Operations",
    description: "Fluidité, temps de service et qualité de commande au drive.",
    category: "Drive",
    roles: ["Drive-Thru Staff", "Crew Member", "Shift Leader"],
    level: "Intermédiaire",
    mandatory: false,
    modules: [
      ["Prise de commande", ["Casque et communication", "Suggestion de vente"]],
      ["Temps de service", ["Objectifs de temps", "Coordination cuisine / drive", "Contrôle du sac"]],
    ],
  },
  {
    title: "Cleaning & Hygiene",
    description: "Plan de nettoyage, produits, dilutions et fréquences par zone.",
    category: "Hygiène & Sécurité",
    roles: ["Cleaning / Hygiene Staff", "Crew Member"],
    level: "Débutant",
    mandatory: true,
    modules: [
      ["Produits & sécurité", ["Fiches produits", "Dilutions", "EPI"]],
      ["Plan de nettoyage", ["Zones cuisine", "Salle et sanitaires", "Fréquences et traçabilité"]],
    ],
  },
  {
    title: "Quality Standards",
    description: "Les standards qualité Texas Chicken et leur contrôle au quotidien.",
    category: "Qualité",
    roles: ["Shift Leader", "Assistant Manager", "Restaurant Manager"],
    level: "Avancé",
    mandatory: false,
    modules: [
      ["Référentiel", ["Les piliers qualité", "Grille d'évaluation"]],
      ["Contrôle terrain", ["Auto-évaluation", "Plan d'action correctif"]],
    ],
  },
  {
    title: "Opening Procedures",
    description: "Séquence complète d'ouverture du restaurant.",
    category: "Opérations",
    roles: ["Shift Leader", "Assistant Manager", "Restaurant Manager"],
    level: "Intermédiaire",
    mandatory: true,
    modules: [
      ["Avant ouverture", ["Sécurité et alarmes", "Contrôle températures", "Mise en route équipements"]],
      ["Prêt à servir", ["Briefing équipe", "Contrôle salle", "Validation checklist"]],
    ],
  },
  {
    title: "Closing Procedures",
    description: "Fermeture sécurisée : nettoyage, stocks, caisse et fermeture du site.",
    category: "Opérations",
    roles: ["Shift Leader", "Assistant Manager", "Restaurant Manager"],
    level: "Intermédiaire",
    mandatory: true,
    modules: [
      ["Nettoyage final", ["Cuisine", "Salle et sanitaires"]],
      ["Clôture", ["Stocks et pertes", "Caisse", "Sécurisation du site"]],
    ],
  },
  {
    title: "Shift Management",
    description: "Piloter un shift : planning, briefing, arbitrages et gestion des imprévus.",
    category: "Management",
    roles: ["Shift Leader", "Assistant Manager", "Restaurant Manager", "General Manager"],
    level: "Avancé",
    mandatory: false,
    modules: [
      ["Préparer le shift", ["Lecture des prévisions", "Positionnement de l'équipe"]],
      ["Piloter", ["Briefing", "Gestion du rush", "Gestion des incidents"]],
      ["Clôturer", ["Débriefing", "Transmission au shift suivant"]],
    ],
  },
];

export const trainings: Training[] = TRAINING_DEFS.map((d, i) => {
  let stepN = 0;
  const modules: TrainingModule[] = d.modules.map((m, mi) => ({
    id: `tr${i + 1}-m${mi + 1}`,
    title: m[0],
    steps: m[1].map((title, si) => {
      stepN++;
      return {
        id: `tr${i + 1}-s${stepN}`,
        title,
        content: `${title} — standard Texas Chicken. Suivez la démonstration vidéo, puis reproduisez le geste sur votre poste. Le formateur ou le Shift Leader valide la bonne exécution avant de passer à l'étape suivante.`,
        videoUrl: VIDEOS[(i + si) % VIDEOS.length]!,
        duration: 4 + ((si + mi) % 5),
        tips: [
          "Respecter scrupuleusement l'ordre des opérations.",
          "Vérifier le matériel avant de commencer.",
        ],
        warnings: si % 2 === 0 ? ["Toute non-conformité doit être signalée immédiatement au Shift Leader."] : [],
      };
    }),
  }));
  const duration = modules.reduce((a, m) => a + m.steps.reduce((b, s) => b + s.duration, 0), 0);
  return {
    id: `tr${i + 1}`,
    title: d.title,
    description: d.description,
    category: d.category,
    roles: d.roles,
    level: d.level,
    duration,
    mandatory: d.mandatory,
    cover: AVATARS[i % AVATARS.length]!,
    mainVideo: VIDEOS[i % VIDEOS.length]!,
    documents: [
      { name: `${d.title} — fiche standard.pdf`, type: "PDF" },
      { name: `${d.title} — checklist formateur.pdf`, type: "PDF" },
    ],
    rules: [
      "La formation doit être suivie dans l'ordre des modules.",
      "Chaque étape validée est enregistrée dans le dossier du collaborateur.",
      d.mandatory ? "Formation obligatoire — à compléter sous 30 jours." : "Formation recommandée.",
    ],
    modules,
    quiz: [
      {
        question: `Quel est le point le plus critique de « ${d.title} » ?`,
        options: ["Le respect du standard Texas Chicken", "La rapidité seule", "L'improvisation"],
        answer: 0,
      },
      {
        question: "Que faire en cas de non-conformité constatée ?",
        options: ["Continuer le service", "Signaler immédiatement au Shift Leader", "Attendre le lendemain"],
        answer: 1,
      },
    ],
    status: "Publiée",
  };
});

export interface TrainingProgress {
  userId: ID;
  trainingId: ID;
  completedStepIds: ID[];
  startedAt?: string;
  completedAt?: string;
}

export const trainingProgress: TrainingProgress[] = [];
{
  const seeds: [string, number][] = [
    ["tr1", 0.75],
    ["tr2", 0.4],
    ["tr4", 1],
    ["tr3", 0.25],
    ["tr7", 0.6],
    ["tr9", 1],
  ];
  for (const [tid, ratio] of seeds) {
    const tr = trainings.find((t) => t.id === tid)!;
    const all = tr.modules.flatMap((m) => m.steps.map((s) => s.id));
    const done = all.slice(0, Math.round(all.length * ratio));
    trainingProgress.push({
      userId: managerUser.id,
      trainingId: tid,
      completedStepIds: done,
      startedAt: shift(-20),
      completedAt: ratio >= 1 ? shift(-4) : undefined,
    });
  }
  // progression réseau pour quelques équipiers
  users.slice(2, 14).forEach((u, i) => {
    const tr = trainings[i % trainings.length]!;
    const all = tr.modules.flatMap((m) => m.steps.map((s) => s.id));
    const ratio = [0.2, 0.5, 0.8, 1][i % 4]!;
    trainingProgress.push({
      userId: u.id,
      trainingId: tr.id,
      completedStepIds: all.slice(0, Math.round(all.length * ratio)),
      startedAt: shift(-30 + i),
      completedAt: ratio >= 1 ? shift(-3) : undefined,
    });
  });
}

/* ========================= APPROVISIONNEMENT ========================= */

export interface SupplierProduct {
  id: ID;
  name: string;
  unit: string;
  price: number;
  category: string;
}

export interface Supplier {
  id: ID;
  name: string;
  category: string;
  contact: string;
  email: string;
  phone: string;
  leadTimeDays: number;
  products: SupplierProduct[];
}

const SUPPLIER_DEFS: [string, string, string, string[]][] = [
  [
    "Fournisseur Produits Alimentaires Maroc",
    "Alimentaire",
    "contact@fpam.ma",
    [
      "Filet de poulet mariné|kg|58",
      "Ailes de poulet|kg|46",
      "Panure Texas Original|kg|32",
      "Pains burger brioche|carton|180",
      "Salade iceberg|kg|14",
      "Cheddar tranches|kg|72",
    ],
  ],
  [
    "Fournisseur Boissons",
    "Boissons",
    "commandes@boissons-maroc.ma",
    ["Sirop cola 10L|bidon|420", "Sirop orange 10L|bidon|395", "Eau minérale 50cl|pack|48", "Café grains|kg|96"],
  ],
  [
    "Fournisseur Produits Surgelés",
    "Surgelés",
    "orders@surgeles.ma",
    ["Frites 9mm|carton|210", "Nuggets|carton|340", "Onion rings|carton|260", "Glaces vanille|carton|180"],
  ],
  [
    "Fournisseur Produits d'Entretien",
    "Entretien",
    "service@cleanpro.ma",
    ["Dégraissant cuisine 5L|bidon|130", "Désinfectant surfaces 5L|bidon|145", "Sacs poubelle 100L|carton|85", "Gants nitrile|boîte|45"],
  ],
  [
    "Fournisseur Packaging",
    "Packaging",
    "pack@boxmaroc.ma",
    ["Boîtes 8 pièces|carton|150", "Sacs kraft|carton|110", "Gobelets 50cl|carton|165", "Serviettes|carton|60"],
  ],
];

export const suppliers: Supplier[] = SUPPLIER_DEFS.map(([name, category, email, prods], i) => ({
  id: `sup${i + 1}`,
  name,
  category,
  contact: ["Karim Idrissi", "Nadia Berrada", "Hassan Ouali", "Salma Tazi", "Omar Fassi"][i]!,
  email,
  phone: `+212 5 22 ${pad(30 + i)} ${pad(10 + i)} ${pad(40 + i)}`,
  leadTimeDays: 1 + (i % 3),
  products: prods.map((p, pi) => {
    const [pname, unit, price] = p.split("|");
    return {
      id: `sup${i + 1}-p${pi + 1}`,
      name: pname!,
      unit: unit!,
      price: Number(price),
      category,
    };
  }),
}));

export type OrderStatus =
  | "Brouillon"
  | "Envoyée"
  | "En préparation"
  | "En livraison"
  | "Reçue"
  | "Clôturée"
  | "En retard";

export interface OrderLine {
  productId: ID;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  priority: "Normale" | "Urgente";
  receivedQuantity?: number;
}

export interface PurchaseOrder {
  id: ID;
  ref: string;
  supplierId: ID;
  restaurantId: ID;
  createdBy: ID;
  createdAt: string;
  expectedAt: string;
  status: OrderStatus;
  lines: OrderLine[];
  note?: string;
  reception?: {
    at: string;
    by: ID;
    conform: boolean;
    comment?: string;
    photo?: string;
  };
  history: { at: string; label: string }[];
}

const ORDER_SEEDS: [number, string, OrderStatus, number, number][] = [
  // [supplierIndex, restaurantId, status, jours avant, jours prévus]
  [0, "r1", "Reçue", 6, -3],
  [1, "r1", "En livraison", 2, 0],
  [2, "r1", "Envoyée", 1, 1],
  [4, "r1", "En retard", 8, -2],
  [3, "r1", "En préparation", 1, 2],
  [0, "r2", "Clôturée", 12, -9],
  [2, "r2", "En livraison", 3, 0],
  [1, "r3", "Envoyée", 2, 1],
  [4, "r4", "Reçue", 5, -2],
  [3, "r5", "En retard", 9, -3],
  [0, "r6", "En préparation", 1, 2],
  [2, "r7", "Envoyée", 0, 3],
];

export const purchaseOrders: PurchaseOrder[] = ORDER_SEEDS.map(([si, rid, status, ago, due], i) => {
  const sup = suppliers[si]!;
  const lines: OrderLine[] = sup.products.slice(0, 2 + (i % 3)).map((p, li) => ({
    productId: p.id,
    name: p.name,
    unit: p.unit,
    quantity: 4 + ((i + li) % 9) * 2,
    price: p.price,
    priority: li === 0 && i % 4 === 0 ? "Urgente" : "Normale",
    receivedQuantity:
      status === "Reçue" || status === "Clôturée"
        ? 4 + ((i + li) % 9) * 2 - (i === 8 && li === 1 ? 3 : 0)
        : undefined,
  }));
  const createdAt = `${shift(-ago)} ${pad(8 + (i % 6))}:${pad((i * 13) % 60)}`;
  const history = [{ at: createdAt, label: "Bon de commande créé" }];
  if (status !== "Brouillon") history.push({ at: createdAt, label: `Envoyé à ${sup.name}` });
  if (["En préparation", "En livraison", "Reçue", "Clôturée"].includes(status))
    history.push({ at: `${shift(-ago + 1)} 09:00`, label: "Préparation fournisseur confirmée" });
  if (["En livraison", "Reçue", "Clôturée"].includes(status))
    history.push({ at: `${shift(-ago + 2)} 07:30`, label: "Départ transporteur" });
  if (["Reçue", "Clôturée"].includes(status))
    history.push({ at: `${shift(due)} 11:20`, label: "Livraison réceptionnée au restaurant" });
  if (status === "En retard") history.push({ at: `${shift(due)} 18:00`, label: "Retard de livraison constaté" });

  return {
    id: `po${i + 1}`,
    ref: `BC-2026-${pad(100 + i)}`,
    supplierId: sup.id,
    restaurantId: rid,
    createdBy: adminUser.id,
    createdAt,
    expectedAt: shift(due),
    status,
    lines,
    note: i % 5 === 0 ? "Livraison à réceptionner avant le rush du midi." : undefined,
    reception:
      status === "Reçue" || status === "Clôturée"
        ? {
            at: `${shift(due)} 11:20`,
            by: managerUser.id,
            conform: i !== 8,
            comment: i === 8 ? "Livraison partielle : 3 cartons manquants sur les sacs kraft." : "Livraison conforme.",
          }
        : undefined,
    history,
  };
});

export const ORDER_FLOW: OrderStatus[] = ["Envoyée", "En préparation", "En livraison", "Reçue", "Clôturée"];

export const TODAY_REF = TODAY;
export const restaurantsRef = restaurants;
