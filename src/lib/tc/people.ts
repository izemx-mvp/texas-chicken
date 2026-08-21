/**
 * Identité visuelle des personnes et des groupes : photos de profil réalistes
 * (déterministes par utilisateur) et photos de groupe Texas Chicken.
 */
import teamCasablanca from "@/assets/groups/team-casablanca.jpg";
import teamRabat from "@/assets/groups/team-rabat.jpg";
import managersPhoto from "@/assets/groups/managers.jpg";
import operationsPhoto from "@/assets/groups/operations.jpg";
import kitchenPhoto from "@/assets/groups/kitchen.jpg";
import maintenancePhoto from "@/assets/groups/maintenance.jpg";
import regionalPhoto from "@/assets/groups/regional.jpg";
import administrationPhoto from "@/assets/groups/administration.jpg";

export const GROUP_PHOTO_LIBRARY: { id: string; label: string; url: string }[] = [
  { id: "team-casablanca", label: "Équipe restaurant", url: teamCasablanca },
  { id: "team-rabat", label: "Équipe en salle", url: teamRabat },
  { id: "managers", label: "Managers", url: managersPhoto },
  { id: "operations", label: "Direction opérations", url: operationsPhoto },
  { id: "kitchen", label: "Cuisine & production", url: kitchenPhoto },
  { id: "maintenance", label: "Maintenance", url: maintenancePhoto },
  { id: "regional", label: "Coordination régionale", url: regionalPhoto },
  { id: "administration", label: "Administration", url: administrationPhoto },
];

export const GROUP_PHOTOS = {
  teamCasablanca,
  teamRabat,
  managers: managersPhoto,
  operations: operationsPhoto,
  kitchen: kitchenPhoto,
  maintenance: maintenancePhoto,
  regional: regionalPhoto,
  administration: administrationPhoto,
};

const FEMALE = new Set([
  "salma",
  "imane",
  "nadia",
  "sara",
  "fatima",
  "khadija",
  "leila",
  "hind",
  "meryem",
  "zineb",
  "ghita",
  "asmae",
  "rania",
  "sanaa",
  "amina",
]);

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

/** Photo de profil réaliste, stable pour un utilisateur donné (même avatar partout). */
export function userPhoto(user: { id: string; firstName?: string } | undefined | null): string {
  if (!user) return "https://randomuser.me/api/portraits/lego/1.jpg";
  const female = FEMALE.has((user.firstName ?? "").toLowerCase());
  const n = hash(user.id) % 90;
  return `https://randomuser.me/api/portraits/${female ? "women" : "men"}/${n}.jpg`;
}

/** Présence simulée, stable par utilisateur. */
export function isOnline(userId: string): boolean {
  return hash(`presence-${userId}`) % 3 !== 0;
}

export function initialsOf(user: { firstName?: string; lastName?: string } | undefined | null) {
  return `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();
}
