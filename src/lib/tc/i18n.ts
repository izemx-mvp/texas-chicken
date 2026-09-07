/**
 * Multilingue Texas Chicken — français (défaut), anglais, arabe.
 * La langue choisie est mémorisée sur l'appareil (localStorage) et l'arabe
 * reste en lecture gauche-droite : aucune inversion de mise en page.
 */
import { useSyncExternalStore } from "react";

export type Lang = "fr" | "en" | "ar";

export const LANGUAGES: { value: Lang; label: string; short: string }[] = [
  { value: "fr", label: "Français", short: "FR" },
  { value: "en", label: "English", short: "EN" },
  { value: "ar", label: "العربية", short: "AR" },
];

const KEY = "tc-lang";

const DICT: Record<Lang, Record<string, string>> = {
  fr: {},
  en: {
    "nav.commandCenter": "Command Center",
    "nav.restaurants": "Restaurants",
    "nav.processes": "Processes & Controls",
    "nav.trainings": "Training",
    "nav.suppliers": "Suppliers",
    "nav.users": "Users",
    "nav.shift": "Shift",
    "nav.tasks": "Tasks",
    "nav.order": "Orders",
    "nav.analytics": "Analytics",
    "nav.profile": "Profile",
    "common.search": "Search",
    "common.menu": "Menu",
    "common.language": "Language",
    "common.logout": "Sign out",
    "common.notifications": "Notifications",
  },
  ar: {
    "nav.commandCenter": "مركز القيادة",
    "nav.restaurants": "المطاعم",
    "nav.processes": "العمليات والمراقبة",
    "nav.trainings": "التكوين",
    "nav.suppliers": "الموردون",
    "nav.users": "المستخدمون",
    "nav.shift": "الوردية",
    "nav.tasks": "المهام",
    "nav.order": "الطلبيات",
    "nav.analytics": "التحليلات",
    "nav.profile": "الملف الشخصي",
    "common.search": "بحث",
    "common.menu": "القائمة",
    "common.language": "اللغة",
    "common.logout": "تسجيل الخروج",
    "common.notifications": "الإشعارات",
  },
};

/** Libellés français : ils servent de valeur par défaut et de clé de repli. */
const FR: Record<string, string> = {
  "nav.commandCenter": "Command Center",
  "nav.restaurants": "Restaurants",
  "nav.processes": "Processus & Contrôles",
  "nav.trainings": "Formations",
  "nav.suppliers": "Fournisseurs",
  "nav.users": "Utilisateurs",
  "nav.shift": "Shift",
  "nav.tasks": "Tâches",
  "nav.order": "Commande",
  "nav.analytics": "Analytics",
  "nav.profile": "Profil",
  "common.search": "Recherche",
  "common.menu": "Menu",
  "common.language": "Langue",
  "common.logout": "Déconnexion",
  "common.notifications": "Notifications",
};

let lang: Lang = "fr";
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  const stored = window.localStorage.getItem(KEY) as Lang | null;
  if (stored && LANGUAGES.some((l) => l.value === stored)) lang = stored;
}

export function setLang(next: Lang) {
  lang = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, next);
    document.documentElement.lang = next;
    // L'arabe reste en lecture gauche-droite : pas de dir="rtl".
    document.documentElement.dir = "ltr";
  }
  listeners.forEach((l) => l());
}

export function getLang() {
  return lang;
}

/** Traduit une clé ; repli sur le français si la traduction manque. */
export function translate(key: string, current: Lang = lang) {
  return DICT[current][key] ?? FR[key] ?? key;
}

export function useLang() {
  const current = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => lang,
    () => "fr" as Lang,
  );
  return { lang: current, setLang, t: (key: string) => translate(key, current) };
}
