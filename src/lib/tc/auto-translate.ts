/**
 * Traduction automatique de toute l'interface.
 *
 * L'application est écrite en français ; quand l'utilisateur choisit l'anglais
 * ou l'arabe, ce module parcourt le DOM et remplace chaque texte connu du
 * dictionnaire (`i18n.ts`), y compris les libellés de champs (placeholder,
 * aria-label, title). Un MutationObserver applique la traduction aux écrans
 * affichés ensuite (navigation, modales, listes).
 */
import { getLang, tr } from "./i18n";

const ATTRS = ["placeholder", "aria-label", "title", "alt"];
const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE", "PRE"]);

function translateTextNode(node: Text) {
  const value = node.nodeValue;
  if (!value || !value.trim()) return;
  const next = tr(value);
  if (next !== value) node.nodeValue = next;
}

function translateElement(el: Element) {
  for (const attr of ATTRS) {
    const value = el.getAttribute(attr);
    if (!value || !value.trim()) continue;
    const next = tr(value);
    if (next !== value) el.setAttribute(attr, next);
  }
  if (el instanceof HTMLInputElement && (el.type === "button" || el.type === "submit")) {
    const next = tr(el.value);
    if (next !== el.value) el.value = next;
  }
}

function walk(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root as Text);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const el = root as Element;
  if (SKIP.has(el.tagName)) return;
  translateElement(el);

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) =>
      node.nodeType === Node.ELEMENT_NODE && SKIP.has((node as Element).tagName)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  });
  let current = walker.nextNode();
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) translateTextNode(current as Text);
    else translateElement(current as Element);
    current = walker.nextNode();
  }
}

let started = false;

/** Active la traduction automatique du DOM (sans effet en français). */
export function startAutoTranslate() {
  if (started || typeof window === "undefined") return;
  if (getLang() === "fr") return;
  started = true;

  const run = () => walk(document.body);
  run();

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "characterData") translateTextNode(record.target as Text);
      else if (record.type === "attributes" && record.target.nodeType === Node.ELEMENT_NODE)
        translateElement(record.target as Element);
      else record.addedNodes.forEach((n) => walk(n));
    }
  });

  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ATTRS,
  });
}
