# Commandes manager ↔ fournisseurs, chat audio, filtres et multilingue

## 1. Manager : « Livraisons » devient « Commande »

- Le menu, le titre de page et tous les textes visibles passent de « Livraisons » à « Commande ».
- La page garde le suivi des livraisons attendues/reçues et gagne deux onglets : **Mes demandes** et **Réceptions**.

## 2. Manager : créer une demande de marchandise

- Bouton « Nouvelle demande » : choix du fournisseur, recherche produit, ajout de lignes avec quantité et unité, commentaire, envoi.
- La demande est rattachée automatiquement au restaurant du manager et apparaît dans « Mes demandes » avec son statut : En attente, Approuvée, Rejetée (motif affiché), Commandée, Livrée.

## 3. Admin (Fournisseurs) : file des demandes

- Nouvel onglet « Demandes » dans l'interface Fournisseurs : restaurant, demandeur, date, produits, quantités, statut.
- Actions : **Approuver** ou **Rejeter avec motif obligatoire**. Le manager voit immédiatement le résultat et le motif.

## 4. Règle bloquante : bon de commande adossé à une demande approuvée

- Dans l'assistant de commande, la première étape demande de sélectionner une **demande approuvée** du restaurant concerné ; les lignes de la commande sont pré-remplies depuis la demande (modifiables).
- Sans demande approuvée pour ce restaurant, l'envoi du bon de commande est bloqué avec un message explicite (« Aucune demande approuvée pour ce restaurant — le manager doit d'abord soumettre une demande »).
- Une fois le bon de commande envoyé, la demande passe en « Commandée ».

## 5. Manager : bon de livraison à la réception

- Sur une commande arrivée, le manager confirme la réception : contrôle des quantités reçues, commentaire d'écart, puis génération d'un **Bon de Livraison** numéroté (BL-xxxx) avec date, signataire, lignes commandées/reçues, écarts.
- Le bon de livraison est consultable et imprimable côté manager, au même format que le bon de commande existant.

## 6. Admin : le bon de livraison est rattaché à la commande

- Le bon de livraison remonte dans la fiche fournisseur, lié à sa commande ; la colonne statut affiche **Livrée**.
- Le tableau des commandes montre un lien « BL » qui ouvre le document ; les écarts signalés sont visibles.

## 7. Fournisseurs : filtre de période sur le tableau des commandes

- Deux champs date (début / fin), filtrage inclusif, bouton « Réinitialiser », combinable avec les filtres existants.

## 8. Fournisseurs : correction de l'affichage Statut / Total

- Largeurs de colonnes fixées, alignement du total à droite, pastille de statut non tronquée, défilement horizontal propre sur petit écran.

## 9. Chat : message vocal

- Bouton micro dans la zone de saisie : enregistrement, minuteur, aperçu avant envoi, annulation.
- Le message vocal s'affiche comme une bulle lecteur audio (durée + lecture) dans le fil, comme les autres messages.

## 10. Process Builder étape 7 : vidéo par upload

- Le champ URL de vidéo est supprimé ; on importe un fichier vidéo depuis l'appareil, avec aperçu et suppression, comme les uploads déjà en place dans les formations.

## 11. Sélecteur de langue dans le header

- Sélecteur Français / English / العربية dans l'en-tête des deux interfaces, choix mémorisé sur l'appareil.
- Traduction complète de tous les écrans : navigation, titres, tableaux, boutons, statuts, messages de confirmation et d'erreur, textes vides. L'arabe reste en lecture gauche-droite (pas d'inversion de mise en page).
- Les données de démonstration (noms de restaurants, produits, messages de chat) restent telles quelles.

## Détails techniques

- Modèle : nouveau type `ProductRequest` (id, restaurantId, requesterId, supplierId, lines[], status, createdAt, decision {by, at, reason}) et `DeliveryNote` (id, ref, orderId, requestId, receivedLines, gaps, signedBy, at) dans `src/lib/tc/ops.ts`, avec mock data cohérente dans `src/lib/tc/data.ts` (demandes en attente, approuvées, une rejetée, une livrée).
- Store `src/lib/tc/store.ts` : `submitRequest`, `approveRequest`, `rejectRequest`, `createDeliveryNote`, sélecteurs par restaurant/fournisseur ; `createOrder`/`sendOrder` reçoivent un `requestId` obligatoire et refusent l'envoi sans demande approuvée.
- UI : `src/routes/app.deliveries.tsx` renommée en interface « Commande » avec onglets ; assistant de demande et document BL en réutilisant `TCModal` et `order-document.tsx` ; onglet Demandes + filtre de dates dans `admin.suppliers.$id.tsx` / `admin.suppliers.index.tsx`.
- Audio : `MediaRecorder` côté navigateur, blob converti en URL locale stockée sur le message (`type: "audio"`, `durationMs`), lecteur audio dans `chat-dock.tsx`.
- i18n : dictionnaire maison léger (`src/lib/i18n/{fr,en,ar}.ts`) + contexte `LanguageProvider` et hook `useT()` dans `__root.tsx`, persistance `localStorage`, remplacement des chaînes littérales dans tous les composants/routes.
