/**
 * Multilingue Texas Chicken — français (défaut), anglais, arabe.
 * La langue choisie est mémorisée sur l'appareil (localStorage) et l'arabe
 * reste en lecture gauche-droite : aucune inversion de mise en page.
 *
 * Deux niveaux de traduction :
 *  1. des clés courtes (`nav.tasks`, `common.search`) ;
 *  2. un dictionnaire de PHRASES françaises (titres, statuts, boutons, onglets)
 *     qui permet de traduire directement le texte affiché sans clé dédiée.
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

/**
 * Dictionnaire de phrases : texte français exact → anglais / arabe.
 * Utilisé par `tr()` pour traduire titres, sous-titres, statuts et boutons.
 */
const PHRASES: Record<string, { en: string; ar: string }> = {
  /* ---------- statuts ---------- */
  "À faire": { en: "To do", ar: "للقيام به" },
  "En cours": { en: "In progress", ar: "قيد التنفيذ" },
  Terminé: { en: "Completed", ar: "منتهي" },
  Terminée: { en: "Completed", ar: "منتهية" },
  "En retard": { en: "Late", ar: "متأخر" },
  Conforme: { en: "Compliant", ar: "مطابق" },
  "Non conforme": { en: "Non-compliant", ar: "غير مطابق" },
  Écart: { en: "Discrepancy", ar: "فرق" },
  "En attente": { en: "Pending", ar: "في الانتظار" },
  Approuvée: { en: "Approved", ar: "مقبولة" },
  Rejetée: { en: "Rejected", ar: "مرفوضة" },
  Commandée: { en: "Ordered", ar: "تم طلبها" },
  Livrée: { en: "Delivered", ar: "تم التوصيل" },
  Reçue: { en: "Received", ar: "مستلمة" },
  Clôturée: { en: "Closed", ar: "مغلقة" },
  "À envoyer": { en: "To send", ar: "للإرسال" },
  Envoyée: { en: "Sent", ar: "مرسلة" },
  Confirmée: { en: "Confirmed", ar: "مؤكدة" },
  "En préparation": { en: "Being prepared", ar: "قيد التحضير" },
  Expédiée: { en: "Shipped", ar: "تم الشحن" },
  "En livraison": { en: "Out for delivery", ar: "في الطريق" },
  Actif: { en: "Active", ar: "نشط" },
  Inactif: { en: "Inactive", ar: "غير نشط" },
  Publié: { en: "Published", ar: "منشور" },
  Brouillon: { en: "Draft", ar: "مسودة" },

  /* ---------- titres de pages ---------- */
  Commande: { en: "Orders", ar: "الطلبيات" },
  Commandes: { en: "Orders", ar: "الطلبيات" },
  Fournisseurs: { en: "Suppliers", ar: "الموردون" },
  Demandes: { en: "Requests", ar: "الطلبات" },
  "Mes demandes": { en: "My requests", ar: "طلباتي" },
  Attendues: { en: "Expected", ar: "منتظرة" },
  Reçues: { en: "Received", ar: "المستلمة" },
  Tâches: { en: "Tasks", ar: "المهام" },
  "Mes tâches": { en: "My tasks", ar: "مهامي" },
  Formations: { en: "Training", ar: "التكوين" },
  "Mes formations": { en: "My training", ar: "تكويناتي" },
  Restaurants: { en: "Restaurants", ar: "المطاعم" },
  Utilisateurs: { en: "Users", ar: "المستخدمون" },
  "Processus & Contrôles": { en: "Processes & Controls", ar: "العمليات والمراقبة" },
  Processus: { en: "Processes", ar: "العمليات" },
  Profil: { en: "Profile", ar: "الملف الشخصي" },
  "Mon profil": { en: "My profile", ar: "ملفي الشخصي" },
  Alertes: { en: "Alerts", ar: "التنبيهات" },
  Preuves: { en: "Evidence", ar: "الإثباتات" },
  Shift: { en: "Shift", ar: "الوردية" },
  "Command Center": { en: "Command Center", ar: "مركز القيادة" },

  /* ---------- sous-titres fréquents ---------- */
  "Demandes de marchandise et réceptions de votre restaurant": {
    en: "Goods requests and deliveries for your restaurant",
    ar: "طلبات السلع واستلامات مطعمك",
  },
  "Fournisseurs, demandes des restaurants et bons de commande": {
    en: "Suppliers, restaurant requests and purchase orders",
    ar: "الموردون وطلبات المطاعم وأوامر الشراء",
  },

  /* ---------- boutons & actions ---------- */
  Annuler: { en: "Cancel", ar: "إلغاء" },
  Fermer: { en: "Close", ar: "إغلاق" },
  Enregistrer: { en: "Save", ar: "حفظ" },
  Continuer: { en: "Continue", ar: "متابعة" },
  Retour: { en: "Back", ar: "رجوع" },
  Terminer: { en: "Finish", ar: "إنهاء" },
  Modifier: { en: "Edit", ar: "تعديل" },
  Supprimer: { en: "Delete", ar: "حذف" },
  Approuver: { en: "Approve", ar: "قبول" },
  Rejeter: { en: "Reject", ar: "رفض" },
  Réinitialiser: { en: "Reset", ar: "إعادة تعيين" },
  "Voir détails": { en: "View details", ar: "عرض التفاصيل" },
  "Nouvelle demande": { en: "New request", ar: "طلب جديد" },
  "Nouveau fournisseur": { en: "New supplier", ar: "مورد جديد" },
  "Envoyer la demande": { en: "Send request", ar: "إرسال الطلب" },
  "Envoyer au fournisseur": { en: "Send to supplier", ar: "إرسال إلى المورد" },
  "Confirmer la réception (Livrée)": { en: "Confirm receipt (Delivered)", ar: "تأكيد الاستلام (تم التوصيل)" },
  "Importer le bon de livraison": { en: "Upload the delivery note", ar: "تحميل سند التوصيل" },
  "Bon de livraison": { en: "Delivery note", ar: "سند التوصيل" },
  "Bon de commande": { en: "Purchase order", ar: "أمر الشراء" },
  Total: { en: "Total", ar: "المجموع" },
  Statut: { en: "Status", ar: "الحالة" },
  Actions: { en: "Actions", ar: "الإجراءات" },
  Produit: { en: "Product", ar: "المنتج" },
  Restaurant: { en: "Restaurant", ar: "المطعم" },
  Fournisseur: { en: "Supplier", ar: "المورد" },
  Retard: { en: "Late", ar: "تأخر" },
  "En route": { en: "In transit", ar: "في الطريق" },
  "Demandes en attente": { en: "Pending requests", ar: "طلبات في الانتظار" },
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
  return DICT[current][key] ?? FR[key] ?? tr(key, current);
}

/** Traduit une phrase française affichée telle quelle dans l'interface. */
export function tr(text: string, current: Lang = lang) {
  if (current === "fr" || !text) return text;
  const hit = PHRASES[text.trim()];
  return hit ? hit[current] : text;
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
  return {
    lang: current,
    setLang,
    t: (key: string) => translate(key, current),
    tr: (text: string) => tr(text, current),
  };
}
