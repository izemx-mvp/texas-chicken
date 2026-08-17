import type { Zone } from "./types";

import cuisine from "@/assets/evidence/cuisine.jpg";
import planTravail from "@/assets/evidence/plan-travail.jpg";
import chambreFroide from "@/assets/evidence/chambre-froide.jpg";
import stockage from "@/assets/evidence/stockage.jpg";
import salle from "@/assets/evidence/salle.jpg";
import toilettes from "@/assets/evidence/toilettes.jpg";
import terrasse from "@/assets/evidence/terrasse.jpg";
import entree from "@/assets/evidence/entree.jpg";
import equipements from "@/assets/evidence/equipements.jpg";
import exterieur from "@/assets/evidence/exterieur.jpg";
import rejetee from "@/assets/evidence/rejetee.jpg";

/** Photos réellement soumises par les restaurants, par zone de contrôle. */
export const ZONE_PHOTOS: Record<Zone, string[]> = {
  Cuisine: [cuisine, planTravail, equipements],
  Stockage: [stockage, planTravail],
  "Chambre froide": [chambreFroide, stockage],
  Salle: [salle, entree],
  Toilettes: [toilettes],
  Terrasse: [terrasse, exterieur],
  Entrée: [entree, salle],
  Extérieur: [exterieur, entree],
  Équipements: [equipements, cuisine],
};

/** Photo utilisée lorsqu'une preuve est rejetée par l'IA (floue / inexploitable). */
export const REJECTED_PHOTO = rejetee;

/** Vidéos de preuve (parcours filmé de la zone par le manager). */
export const EVIDENCE_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
];

export function zonePhoto(zone: Zone, index: number) {
  const list = ZONE_PHOTOS[zone] ?? ZONE_PHOTOS.Cuisine;
  return list[index % list.length] as string;
}

export function evidenceVideo(index: number) {
  return EVIDENCE_VIDEOS[index % EVIDENCE_VIDEOS.length] as string;
}
