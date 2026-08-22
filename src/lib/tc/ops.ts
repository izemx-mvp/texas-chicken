/**
 * Modules opérationnels additionnels : communication (groupes & messages),
 * formations métier, approvisionnement (fournisseurs, bons de commande, livraisons).
 * Mock data déterministe et riche, branchée sur les restaurants / utilisateurs existants.
 */
import { restaurants, users, TODAY, REF_DATE } from "./data";
import type { ID } from "./types";
import { GROUP_PHOTOS } from "./people";
import coverFoodSafety from "@/assets/trainings/food-safety.jpg";
import coverKitchen from "@/assets/trainings/kitchen.jpg";
import coverProduct from "@/assets/trainings/product.jpg";
import coverService from "@/assets/trainings/service.jpg";
import coverCleaning from "@/assets/trainings/cleaning.jpg";
import coverDrive from "@/assets/trainings/drive.jpg";
import coverManagement from "@/assets/trainings/management.jpg";


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

export interface ChatAttachment {
  name: string;
  kind: "Image" | "Document";
  url?: string;
}

export interface ChatMessage {
  id: ID;
  groupId: ID;
  userId: ID;
  text: string;
  at: string; // "YYYY-MM-DD HH:mm"
  readBy: ID[];
  attachments?: ChatAttachment[];
  mentions?: ID[];
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
  /** Administrateurs additionnels du groupe. */
  adminIds?: ID[];
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

/** Trouve un collaborateur par rôle (et restaurant), de façon déterministe. */
const byRole = (role: string, rid?: ID | null, nth = 0): ID => {
  const pool = users.filter((u) => u.role === role && (rid ? u.restaurantId === rid : true));
  return (pool[nth % Math.max(pool.length, 1)] ?? users[nth % users.length]!).id;
};

const GROUP_DEFS: [string, string, GroupType, ID | null, string][] = [
  [
    "Restaurant Casablanca — Équipe",
    "Coordination quotidienne de l'équipe du restaurant",
    "Groupe restaurant",
    "r1",
    GROUP_PHOTOS.teamCasablanca,
  ],
  ["Restaurant Rabat — Équipe", "Shift, ouverture / fermeture et incidents", "Groupe restaurant", "r2", GROUP_PHOTOS.teamRabat],
  ["Managers Maroc", "Échanges entre responsables de restaurants du réseau", "Groupe managers", null, GROUP_PHOTOS.managers],
  ["Direction Opérations", "Pilotage réseau, standards et performance", "Groupe administration", null, GROUP_PHOTOS.operations],
  ["Cuisine & Operations", "Standards produit, cuisson, qualité et hygiène", "Groupe opérationnel", null, GROUP_PHOTOS.kitchen],
  ["Maintenance", "Pannes équipements, interventions et suivi technique", "Groupe opérationnel", null, GROUP_PHOTOS.maintenance],
  ["Région Grand Casablanca", "Coordination régionale multi-restaurants", "Groupe régional", null, GROUP_PHOTOS.regional],
  ["Administration", "Comptes, permissions, approvisionnement et reporting", "Groupe administration", null, GROUP_PHOTOS.administration],
];

export const chatGroups: ChatGroup[] = GROUP_DEFS.map(([name, description, type, rid, photo], i) => {
  const base = rid ? staffOf(rid) : users.slice(0, 10).map((u) => u.id);
  const memberIds = Array.from(new Set([managerUser.id, adminUser.id, ...base])).slice(0, 12);
  return {
    id: `g${i + 1}`,
    name,
    description,
    type,
    restaurantId: rid,
    avatar: photo,
    memberIds,
    adminId: type === "Groupe restaurant" ? managerUser.id : adminUser.id,
    createdAt: shift(-120 + i * 9),
    status: i === 6 ? "Inactif" : "Actif",
  };
});

/* --------------------------- casting des conversations --------------------------- */
/** Casting réaliste par groupe : les mêmes personnes reviennent d'un jour à l'autre. */
const CASTS: Record<string, ID[]> = {
  g1: [
    byRole("Restaurant Manager", "r1"),
    byRole("Shift Leader", "r1"),
    byRole("Cook", "r1"),
    byRole("Crew Member", "r1"),
    byRole("Cashier", "r1"),
    byRole("Cleaning / Hygiene Staff", "r1"),
  ],
  g2: [
    byRole("Restaurant Manager", "r2"),
    byRole("Shift Leader", "r2"),
    byRole("Cook", "r2"),
    byRole("Crew Member", "r2"),
    byRole("Assistant Manager", "r2"),
  ],
  g3: [managerUser.id, byRole("Restaurant Manager", "r2"), byRole("Restaurant Manager", "r3"), byRole("Restaurant Manager", "r4"), adminUser.id],
  g4: [adminUser.id, byRole("Operations Admin"), byRole("Auditeur"), managerUser.id],
  g5: [byRole("Cook", "r1"), byRole("Cook", "r2"), byRole("Restaurant Manager", "r3"), byRole("Operations Admin"), byRole("Shift Leader", "r1")],
  g6: [byRole("Maintenance"), byRole("Restaurant Manager", "r2"), managerUser.id, byRole("Operations Admin")],
  g7: [adminUser.id, managerUser.id, byRole("Restaurant Manager", "r3"), byRole("Restaurant Manager", "r5")],
  g8: [adminUser.id, byRole("Restaurant Admin"), byRole("Auditeur"), byRole("Operations Admin"), managerUser.id],
};

/** "jour|heure|castIndex|texte" — les pièces jointes sont ajoutées via ATTACHMENTS. */
const CONVERSATIONS: Record<string, string[]> = {
  g1: [
    "-5|07:04|1|Ouverture faite. Températures chambre froide 2,4°C, friteuses en chauffe.",
    "-5|07:22|2|Marinades du jour préparées, lot tracé sur la fiche production.",
    "-5|09:40|0|Merci. Pensez au contrôle des DLC avant le rush.",
    "-5|11:58|3|Contrôle DLC terminé, 2 produits retirés et tracés.",
    "-5|14:15|4|Caisse 2 a un ticket bloqué, je bascule les clients sur la caisse 1.",
    "-5|14:20|0|Ok, je crée un ticket maintenance. Continuez sur une caisse.",
    "-5|22:41|1|Checklist de fermeture complétée à 22:38, zéro non-conformité ✅",
    "-4|07:10|1|Ouverture ok. Le contrôle de la zone cuisine est terminé, il reste la chambre froide.",
    "-4|07:26|2|Température contrôlée à 3,1°C. J'ajoute la preuve photo dans la checklist.",
    "-4|07:35|0|Parfait. Pensez aussi à vérifier le stockage avant la fin du shift.",
    "-4|10:02|1|C'est fait, le point de contrôle est maintenant à 100 %.",
    "-4|12:40|3|Rush midi : file drive à 5 min, on ouvre un deuxième poste emballage.",
    "-4|15:05|5|Salle et sanitaires nettoyés, preuves envoyées 📸",
    "-4|19:30|2|La friteuse 2 chauffe lentement (168°C au lieu de 175°C).",
    "-4|19:34|0|Je bloque la friteuse 2 et je remonte au groupe Maintenance.",
    "-3|08:12|0|Briefing du jour : objectif temps de service < 4 min 30.",
    "-3|11:20|4|Bien reçu 👍",
    "-3|13:50|3|312 commandes ce midi, temps moyen 4 min 20 🔥",
    "-3|17:05|1|Livraison surgelés annoncée à 18:00, deux personnes en réception.",
    "-3|18:40|2|Livraison réceptionnée, tout est conforme sauf 1 carton de nuggets abîmé.",
    "-3|18:52|0|Note-le sur la réception, je remonte la réserve au fournisseur.",
    "-2|07:08|1|Ouverture ok, aucun incident cette nuit.",
    "-2|09:45|5|Filtration huile faite sur les 3 friteuses.",
    "-2|12:15|3|Rupture de sauce Buffalo, on bascule sur le stock de réserve.",
    "-2|12:30|0|Commande urgente passée à l'administration.",
    "-2|21:58|1|Fermeture conforme, score du shift 96 %.",
    "-1|07:00|0|Bonjour l'équipe 👋 audit hygiène possible cette semaine, on reste carré sur les preuves.",
    "-1|08:30|2|Reçu chef. Photos systématiques après chaque nettoyage.",
    "-1|14:10|4|Formation Food Safety terminée de mon côté ✅",
    "-1|20:20|1|Il reste 2 équipiers à finaliser leur formation, relance faite.",
    "0|07:06|1|Ouverture du jour validée, températures conformes.",
    "0|09:15|2|Marinades prêtes, contrôle visuel ok.",
    "0|11:40|0|Pensez à la vérification du stockage sec avant midi.",
    "0|12:05|3|Stockage vérifié, rien à signaler.",
    "0|14:45|5|Zone terrasse nettoyée, preuve ajoutée à la tâche.",
  ],
  g2: [
    "-6|07:15|1|Ouverture Rabat faite, checklist en cours.",
    "-6|09:10|0|Le stock packaging est bas : boîtes 8 pièces à 1,5 jour de couverture ⚠️",
    "-6|09:22|4|Je remonte le besoin à l'administration ce matin.",
    "-6|16:30|2|Chambre froide à 5,8°C, au-dessus du seuil. Je surveille.",
    "-6|16:45|0|Ticket maintenance ouvert, on transfère les produits sensibles.",
    "-5|08:00|1|Contrôle DLC réalisé : 3 produits retirés et tracés.",
    "-5|12:20|3|Rush midi géré, 4 min 50 de temps moyen.",
    "-5|18:10|4|Planning du week-end publié, merci de confirmer vos créneaux 🕒",
    "-4|07:40|1|Ouverture ok. Chambre froide toujours à 5,4°C.",
    "-4|10:05|0|Le technicien passe mercredi, thermostat commandé.",
    "-4|15:00|2|Nettoyage grill effectué, photos ajoutées.",
    "-3|08:20|1|Formation Food Safety : 4 équipiers sur 6 l'ont terminée.",
    "-3|09:00|0|Relance faite auprès des 2 derniers, deadline vendredi.",
    "-3|19:45|3|Panne mineure sur la machine à glaçons, contournement en place.",
    "-2|07:25|1|Checklist de fermeture d'hier complète, aucune non-conformité.",
    "-2|11:50|4|Livraison boissons reçue, 1 bidon de sirop manquant.",
    "-2|12:02|0|Réserve notée sur le bon de commande, avoir demandé.",
    "-1|08:05|1|Chambre froide réparée ✅ 2,9°C ce matin.",
    "-1|13:30|2|Fiche technique Spicy Chicken appliquée, retour équipe positif.",
    "-1|21:10|0|Score conformité de la semaine : 92 %. On vise 95 %.",
    "0|07:18|1|Ouverture ok, températures conformes.",
    "0|10:40|3|Preuves photo du shift du matin envoyées.",
    "0|13:15|0|Merci, c'était le point demandé par la direction.",
  ],
  g3: [
    "-7|09:00|4|Rappel : audit hygiène réseau la semaine prochaine, préparez les registres.",
    "-7|09:20|0|Casablanca prêt, registres à jour.",
    "-7|10:05|1|Rabat : il me manque les preuves du shift du soir, je corrige aujourd'hui.",
    "-6|08:30|2|Marrakech à 91 %, on travaille le temps de service au drive.",
    "-6|14:00|4|Pensez à valider les formations Food Safety avant vendredi.",
    "-5|09:45|3|Tanger : nouvel Assistant Manager arrivé, formation Onboarding lancée.",
    "-5|17:20|0|Casablanca à 94 % de conformité cette semaine 🔥",
    "-4|08:15|4|Synthèse conformité réseau du mois en pièce jointe.",
    "-4|11:00|1|Merci, je diffuse à mon équipe.",
    "-3|10:30|2|Question staffing : quelqu'un a un modèle de planning rush week-end ?",
    "-3|10:48|0|Je t'envoie le mien, il gère les pics 12h-14h et 19h-21h.",
    "-2|09:10|4|Point managers jeudi 10:00 : pertes, staffing, drive.",
    "-2|15:30|3|Noté. Je prépare les chiffres pertes de Tanger.",
    "-1|08:40|1|Rabat repasse au-dessus de l'objectif, chambre froide réparée.",
    "-1|18:00|0|Bravo 👏",
    "0|08:20|4|Deux restaurants ont des preuves manquantes ce matin, merci de régulariser.",
    "0|09:05|2|Marrakech régularisé ✅",
  ],
  g4: [
    "-8|09:00|0|Nouveau standard de cuisson diffusé à tous les restaurants (v2.4).",
    "-8|11:30|1|Les bons de commande passent désormais exclusivement par la plateforme.",
    "-7|10:15|2|Audit interne : 3 restaurants avec preuves dupliquées détectées par l'IA ⚠️",
    "-7|10:40|0|On traite en priorité, contact des managers concernés aujourd'hui.",
    "-6|09:20|1|Objectif réseau Q3 : 95 % de conformité et zéro alerte fraude critique.",
    "-5|14:00|2|Rapport d'audit hebdomadaire disponible.",
    "-4|09:45|3|Casablanca a corrigé les écarts signalés la semaine dernière.",
    "-3|11:10|1|Reporting mensuel disponible dans Analytics, filtré par ville et par rôle.",
    "-2|08:50|0|Budget formation validé pour le T4 : 6 nouvelles formations métier.",
    "-1|16:20|2|Deux alertes anti-fraude à traiter aujourd'hui : preuves dupliquées.",
    "0|08:35|0|Revue hebdo à 15:00, ordre du jour : conformité, formations, approvisionnement.",
    "0|09:12|3|Présent, je prépare les indicateurs restaurant.",
  ],
  g5: [
    "-6|08:10|0|Contrôle huile de friture : viscosité à vérifier deux fois par shift.",
    "-6|13:25|1|Fait à Rabat, huile changée sur la friteuse 3.",
    "-5|09:30|3|Nouvelle fiche technique Spicy Chicken : marinade 12h minimum.",
    "-5|10:00|4|Reçu, on applique dès demain.",
    "-4|11:15|2|Retour qualité client sur la panure trop foncée à Marrakech.",
    "-4|11:40|0|On réduit le temps de cuisson de 15 secondes et on mesure.",
    "-3|08:45|3|Rappel : température à cœur 74°C minimum, sonde désinfectée entre chaque mesure.",
    "-3|15:00|1|Photos de plan de travail prises après chaque nettoyage 📸",
    "-2|09:20|4|Nouveau format d'emballage testé sur le drive, gain de 20 secondes.",
    "-1|10:10|0|Résultat du test panure : couleur conforme sur 3 lots consécutifs ✅",
    "-1|17:30|3|Excellent, on généralise au réseau.",
    "0|08:55|1|Contrôle huile du matin fait, viscosité conforme.",
    "0|12:30|2|Sonde recalibrée à Marrakech.",
  ],
  g6: [
    "-5|08:30|1|Chambre froide de Rabat instable, 5,8°C constatés.",
    "-5|09:00|0|Intervention prévue mercredi ❄️ pièce détachée commandée (thermostat), délai 48h.",
    "-4|10:20|2|Friteuse 2 Casablanca hors service depuis hier soir.",
    "-4|11:00|0|Résistance en stock, je passe cet après-midi.",
    "-4|16:10|0|Friteuse 2 : résistance remplacée, remise en service validée ✅",
    "-4|16:18|2|Merci, je referme le ticket et je réactive la tâche de cuisson.",
    "-3|09:40|0|Thermostat Rabat reçu, intervention demain matin 07:00.",
    "-2|08:05|0|Chambre froide Rabat réparée, 2,9°C stables sur 12h.",
    "-2|08:20|1|Confirmé de notre côté, merci 🙏",
    "-1|14:00|3|Planning maintenance préventive du mois publié.",
    "0|09:25|2|Machine à glaçons Rabat à surveiller, bruit anormal.",
    "0|09:40|0|Je passe en fin de journée.",
  ],
  g7: [
    "-6|09:00|0|Réunion régionale jeudi 10:00 en visio.",
    "-5|11:00|1|Trois restaurants du Grand Casablanca au-dessus de l'objectif conformité 💪",
    "-4|10:30|2|Besoin de renfort équipiers sur le site Maarif pour le week-end.",
    "-4|10:52|0|Je regarde les disponibilités des autres sites.",
    "-3|09:15|3|Support de la réunion régionale partagé.",
    "-2|16:40|1|Pertes matières en baisse de 12 % sur la région ce mois-ci.",
    "-1|08:50|0|Bonne dynamique, on garde le cap sur le drive.",
    "0|09:30|2|Renfort trouvé pour le week-end ✅",
  ],
  g8: [
    "-7|09:10|0|Nouveaux comptes équipiers créés pour Casablanca et Marrakech.",
    "-6|10:00|1|Permissions Formations activées pour tous les rôles restaurant.",
    "-5|11:20|2|Audit des accès terminé : 4 comptes inactifs désactivés.",
    "-4|09:45|3|Le module Commandes est ouvert aux Restaurant Managers en lecture seule.",
    "-3|14:10|4|Demande d'accès au module Livraisons pour mon Assistant Manager.",
    "-3|14:35|0|Validé, accès ouvert en lecture.",
    "-2|10:05|1|Rappel : toute demande d'accès passe par un ticket dans ce groupe 📦",
    "-1|09:00|2|Reporting des commandes fournisseurs du mois disponible.",
    "0|08:40|0|Deux bons de commande en retard à relancer aujourd'hui.",
    "0|09:20|3|Je m'en occupe.",
  ],
};

const ATTACHMENTS: Record<string, ChatAttachment[]> = {
  "g1-1": [{ name: "releve-temperatures.jpg", kind: "Image" }],
  "g1-12": [{ name: "nettoyage-salle.jpg", kind: "Image" }],
  "g2-5": [{ name: "fiche-destruction.pdf", kind: "Document" }],
  "g3-7": [{ name: "conformite-reseau-mensuelle.pdf", kind: "Document" }],
  "g4-5": [{ name: "rapport-audit-hebdo.pdf", kind: "Document" }],
  "g5-2": [{ name: "fiche-technique-spicy.pdf", kind: "Document" }],
  "g6-9": [{ name: "planning-maintenance.pdf", kind: "Document" }],
  "g7-4": [{ name: "reunion-regionale.pptx", kind: "Document" }],
  "g8-8": [{ name: "reporting-commandes.xlsx", kind: "Document" }],
};

export const chatMessages: ChatMessage[] = [];
chatGroups.forEach((g, gi) => {
  const cast = CASTS[g.id] ?? g.memberIds.slice(0, 4);
  const lines = CONVERSATIONS[g.id] ?? [];
  lines.forEach((line, i) => {
    const [day, time, castIdx, text] = line.split("|");
    const author = cast[Number(castIdx) % cast.length] ?? g.memberIds[0]!;
    const isLast = i >= lines.length - 2;
    const unread = isLast && gi % 2 === 0 && author !== managerUser.id;
    const att = ATTACHMENTS[`${g.id}-${i}`];
    chatMessages.push({
      id: `m${g.id}-${i}`,
      groupId: g.id,
      userId: author,
      text: text!,
      at: `${shift(Number(day))} ${time}`,
      readBy: unread ? [author] : Array.from(new Set([...g.memberIds, author])),
      ...(att ? { attachments: att } : {}),
    });
  });
});

/** Membres réellement actifs dans une conversation (utile pour l'affichage). */
export const groupCast = CASTS;



/* ============================== FORMATIONS ============================== */

export type TrainingLevel = "Débutant" | "Intermédiaire" | "Avancé";

/** Type de contenu pédagogique attachable à un module OU à une étape. */
export type TrainingMediaKind = "video" | "image" | "document" | "text";

/**
 * Contenu pédagogique. Les vidéos, images et documents proviennent toujours
 * d'un import de fichier (jamais d'une URL saisie par l'utilisateur).
 */
export interface TrainingMedia {
  id: ID;
  kind: TrainingMediaKind;
  title: string;
  /** URL locale/objet issue de l'upload (ou asset packagé pour les mock data). */
  url?: string;
  /** Corps de texte pour kind = "text". */
  body?: string;
  fileName?: string;
  fileType?: string;
  size?: number;
  duration?: number;
}

/**
 * Question de quiz QCM. Une question peut accepter une seule bonne réponse
 * ou plusieurs, et vaut un nombre de points défini par le créateur.
 */
export interface QuizQuestion {
  id: ID;
  question: string;
  options: string[];
  /** Indices des bonnes réponses. */
  correct: number[];
  /** true = plusieurs bonnes réponses attendues. */
  multiple: boolean;
  points: number;
}

export interface TrainingStep {
  id: ID;
  title: string;
  content: string;
  videoUrl?: string;
  duration: number; // minutes
  tips: string[];
  warnings: string[];
  /** Objectif pédagogique de l'étape. */
  objective?: string;
  /** Procédure détaillée, geste par geste. */
  procedure?: string[];
  /** Erreurs fréquentes à éviter. */
  mistakes?: string[];
  /** Document de référence rattaché à l'étape. */
  document?: { name: string; type: string; url?: string };
  /** Illustration de l'étape. */
  image?: string;
  /** Contenus multiples de l'étape (vidéos, images, documents, textes). */
  media?: TrainingMedia[];
  /** Instructions détaillées de l'étape. */
  instructions?: string;
  /** Quiz QCM rattaché à l'étape (peut être vide). */
  quiz?: QuizQuestion[];
}


export interface TrainingModule {
  id: ID;
  title: string;
  /** Description / introduction du module. */
  description?: string;
  /** Instructions générales du module. */
  instructions?: string;
  steps: TrainingStep[];
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
  cover: string; // dégradé (repli) ou URL d'image
  coverPhoto?: string;
  /** Objectifs pédagogiques globaux. */
  objectives?: string[];
  /** Prérequis avant de démarrer la formation. */
  prerequisites?: string[];
  mainVideo: string;
  documents: { name: string; type: string; url?: string }[];

  rules: string[];
  modules: TrainingModule[];
  /** Affectation : restaurants concernés (vide = tout le réseau). */
  restaurantIds?: ID[];
  /** Affectation nominative complémentaire. */
  userIds?: ID[];
  createdAt?: string;
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

/** Photo de couverture par catégorie de formation. */
const COVER_BY_CATEGORY: Record<string, string> = {
  "Hygiène & Sécurité": coverFoodSafety,
  Cuisine: coverKitchen,
  Produit: coverProduct,
  Service: coverService,
  Caisse: coverService,
  Drive: coverDrive,
  Opérations: coverManagement,
  Management: coverManagement,
};

const STEP_IMAGES = [coverKitchen, coverProduct, coverFoodSafety, coverService, coverCleaning, coverDrive];

/** Fabrique un contenu pédagogique mock (issu d'un « import de fichier »). */
const mkMedia = (
  id: string,
  kind: TrainingMediaKind,
  title: string,
  opts: Partial<TrainingMedia> = {},
): TrainingMedia => ({
  id,
  kind,
  title,
  ...(kind === "video"
    ? { fileName: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.mp4`, fileType: "MP4", size: 24_800_000, duration: 96 }
    : {}),
  ...(kind === "image" ? { fileName: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`, fileType: "JPG", size: 480_000 } : {}),
  ...(kind === "document" ? { fileName: `${title}.pdf`, fileType: "PDF", size: 1_240_000 } : {}),
  ...opts,
});

export const trainings: Training[] = TRAINING_DEFS.map((d, i) => {
  let stepN = 0;
  const modules: TrainingModule[] = d.modules.map((m, mi) => ({
    id: `tr${i + 1}-m${mi + 1}`,
    title: m[0],
    description: `Contenu de référence du module « ${m[0]} » : à consulter avant de démarrer les étapes.`,
    instructions:
      "Visionnez d'abord les contenus du module, puis déroulez les étapes dans l'ordre. Chaque étape doit être validée par le Shift Leader lors de la première exécution.",
    steps: m[1].map((title, si) => {

      stepN++;
      const media: TrainingMedia[] = [
        mkMedia(`tr${i + 1}-s${stepN}-v1`, "video", `${title} — Démonstration`, {
          url: VIDEOS[(i + si) % VIDEOS.length]!,
        }),
        ...(si % 2 === 1
          ? [
              mkMedia(`tr${i + 1}-s${stepN}-v2`, "video", `${title} — Cas particuliers`, {
                url: VIDEOS[(i + si + 2) % VIDEOS.length]!,
                duration: 74,
              }),
            ]
          : []),
        mkMedia(`tr${i + 1}-s${stepN}-i1`, "image", `${title} — Geste conforme`, {
          url: STEP_IMAGES[(i + si + mi) % STEP_IMAGES.length]!,
        }),
        ...(si % 3 === 0
          ? [
              mkMedia(`tr${i + 1}-s${stepN}-i2`, "image", `${title} — Erreur à éviter`, {
                url: STEP_IMAGES[(i + si + mi + 3) % STEP_IMAGES.length]!,
              }),
            ]
          : []),
        ...(si % 2 === 0 ? [mkMedia(`tr${i + 1}-s${stepN}-d1`, "document", `${title} — Fiche geste`)] : []),
      ];
      return {
        id: `tr${i + 1}-s${stepN}`,
        title,
        content: `${title} — standard Texas Chicken. Suivez la démonstration vidéo, puis reproduisez le geste sur votre poste. Le formateur ou le Shift Leader valide la bonne exécution avant de passer à l'étape suivante.`,
        videoUrl: VIDEOS[(i + si) % VIDEOS.length]!,
        duration: 4 + ((si + mi) % 5),
        objective: `À la fin de cette étape, vous savez exécuter « ${title} » seul(e), au rythme du service et conformément au standard ${d.category}.`,
        instructions: `Reproduire « ${title} » en conditions réelles, sous supervision, jusqu'à obtenir un résultat conforme deux fois de suite.`,
        media,
        procedure: [
          `Préparer le poste et le matériel nécessaire à « ${title} ».`,
          "Réaliser le geste en suivant exactement l'ordre montré dans la vidéo.",
          "Contrôler le résultat (visuel, température, propreté ou temps selon le cas).",
          "Faire valider par le Shift Leader lors de la première exécution.",
        ],
        tips: [
          "Respecter scrupuleusement l'ordre des opérations.",
          "Vérifier le matériel avant de commencer.",
          "En cas de doute, se référer à la fiche standard avant d'agir.",
        ],
        mistakes: [
          "Sauter le contrôle final pour gagner du temps.",
          "Utiliser un matériel non nettoyé ou non vérifié.",
        ],
        warnings: si % 2 === 0 ? ["Toute non-conformité doit être signalée immédiatement au Shift Leader."] : [],
        document: { name: `${title} — fiche geste.pdf`, type: "PDF" },
        image: STEP_IMAGES[(i + si + mi) % STEP_IMAGES.length]!,
        quiz:
          si === m[1].length - 1
            ? [
                {
                  id: `tr${i + 1}-s${stepN}-q1`,
                  question: `« ${m[0]} » : quel est le point de contrôle le plus critique ?`,
                  options: [
                    "Le respect du standard Texas Chicken",
                    "La rapidité seule",
                    "L'improvisation du collaborateur",
                    "L'avis du client",
                  ],
                  correct: [0],
                  multiple: false,
                  points: 1,
                },
                {
                  id: `tr${i + 1}-s${stepN}-q2`,
                  question: `Quels éléments sont obligatoires avant de valider « ${title} » ?`,
                  options: [
                    "Le contrôle visuel du résultat",
                    "La validation par le Shift Leader",
                    "Une photo publiée sur les réseaux",
                    "Le nettoyage du poste",
                  ],
                  correct: [0, 1, 3],
                  multiple: true,
                  points: 2,
                },
              ]
            : undefined,
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
    coverPhoto: COVER_BY_CATEGORY[d.category] ?? coverKitchen,
    objectives: [
      `Maîtriser les standards Texas Chicken de « ${d.title} ».`,
      "Exécuter les gestes clés en autonomie pendant le service.",
      "Identifier et corriger les non-conformités les plus fréquentes.",
    ],
    prerequisites: d.level === "Débutant" ? ["Aucun prérequis"] : ["Food Safety Basics validée", "1 mois d'expérience en poste"],
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
    restaurantIds: i % 4 === 3 ? restaurants.slice(0, 4).map((r) => r.id) : [],
    userIds: [],
    createdAt: shift(-200 + i * 14),
    status: i === 8 ? "Brouillon" : "Publiée",
  };
});

/** Toutes les questions de quiz d'une formation (toutes étapes confondues). */
export function trainingQuestions(t: Training): QuizQuestion[] {
  return t.modules.flatMap((m) => m.steps.flatMap((s) => s.quiz ?? []));
}

/** Score maximum atteignable sur une formation. */
export function trainingMaxScore(t: Training): number {
  return trainingQuestions(t).reduce((a, q) => a + (q.points || 0), 0);
}

export interface TrainingProgress {
  userId: ID;
  trainingId: ID;
  completedStepIds: ID[];
  startedAt?: string;
  completedAt?: string;
  lastActivity?: string;
  dueDate?: string;
  /** Réponses données par question (indices d'options). */
  quizAnswers?: Record<ID, number[]>;
  /** Points obtenus par étape contenant un quiz. */
  quizScores?: Record<ID, number>;
}


/** Utilisateurs concernés par une formation (rôles + restaurants + nominatif). */
export function assigneesOf(t: Training, pool = users) {
  const explicit = new Set(t.userIds ?? []);
  return pool.filter((u) => {
    if (explicit.has(u.id)) return true;
    if (!t.roles.includes(u.role)) return false;
    const rids = t.restaurantIds ?? [];
    if (rids.length && (!u.restaurantId || !rids.includes(u.restaurantId))) return false;
    return true;
  });
}

export const trainingProgress: TrainingProgress[] = [];
{
  const hash = (s: string) => {
    let h = 7;
    for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
    return h;
  };
  // progression du manager de démonstration (états variés et lisibles)
  const seeds: [string, number][] = [
    ["tr1", 0.75],
    ["tr2", 0.4],
    ["tr4", 1],
    ["tr3", 0.25],
    ["tr7", 0.6],
    ["tr9", 1],
  ];
  for (const [tid, ratio] of seeds) {
    const tr = trainings.find((t) => t.id === tid);
    if (!tr) continue;
    const all = tr.modules.flatMap((m) => m.steps.map((s) => s.id));
    trainingProgress.push({
      userId: managerUser.id,
      trainingId: tid,
      completedStepIds: all.slice(0, Math.round(all.length * ratio)),
      startedAt: shift(-20),
      completedAt: ratio >= 1 ? shift(-4) : undefined,
      lastActivity: shift(-2),
      dueDate: shift(tr.mandatory ? 6 : 20),
    });
  }
  // progression réseau : chaque utilisateur assigné a un état cohérent
  for (const tr of trainings) {
    const all = tr.modules.flatMap((m) => m.steps.map((s) => s.id));
    for (const u of assigneesOf(tr)) {
      if (trainingProgress.some((p) => p.userId === u.id && p.trainingId === tr.id)) continue;
      const h = hash(`${tr.id}-${u.id}`);
      const bucket = h % 10; // 0-1 non démarré, 2-4 en cours, 5-8 terminé, 9 en retard
      if (bucket <= 1) continue; // non démarré : aucune ligne de progression
      const ratio = bucket >= 5 && bucket <= 8 ? 1 : [0.2, 0.4, 0.65, 0.85][h % 4]!;
      const late = bucket === 9;
      trainingProgress.push({
        userId: u.id,
        trainingId: tr.id,
        completedStepIds: all.slice(0, Math.round(all.length * ratio)),
        startedAt: shift(-(10 + (h % 40))),
        completedAt: ratio >= 1 ? shift(-(1 + (h % 12))) : undefined,
        lastActivity: shift(-(h % 9)),
        dueDate: shift(late ? -(2 + (h % 5)) : 5 + (h % 20)),
      });
    }
  }
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
