import type { Priority, TaskStatus } from "./types";

/** Options partagées par les filtres Admin / Manager. */
export const STATUS_LIST: TaskStatus[] = [
  "À faire",
  "En cours",
  "Terminé",
  "En retard",
  "Non conforme",
  "Bloqué",
];

export const PRIORITIES_LIST: Priority[] = ["Basse", "Normale", "Haute", "Critique"];
