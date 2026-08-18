# Texas Chicken Command Center

Créer entièrement une nouvelle application SaaS Enterprise FROM SCRATCH pour Texas Chicken / Church’s Chicken.

IMPORTANT :
- Ne pas modifier un projet existant.
- Ne pas réutiliser une ancienne structure d'application.
- Ne pas partir d'un dashboard existant.
- Construire toute l'application, son architecture, ses pages, ses composants, ses données mock et ses interactions depuis zéro.
- L'application doit être complète et fonctionnelle dès la première génération.
- Ne pas créer uniquement une maquette ou des écrans statiques.
- Toutes les fonctionnalités, navigations, CRUD, recherches, filtres, notifications, permissions, processus et interactions doivent fonctionner avec des mock data réalistes.

# 1. OBJECTIF DU PRODUIT

Créer une plateforme appelée :

Texas Chicken Operational Excellence Platform

Cette plateforme doit permettre à Texas Chicken de digitaliser et automatiser le contrôle de l'exécution des standards opérationnels dans ses restaurants.

Le système doit couvrir l'ensemble du cycle :

Standards
→ Processus
→ Étapes
→ Tâches
→ Exécution terrain
→ Preuves photo/vidéo
→ Analyse IA
→ Contrôle
→ Alertes
→ KPI
→ Analytics
→ Amélioration de la conformité

La plateforme doit être composée de deux interfaces complètement structurées :

1. Restaurant Operations
2. Administration / Back-office

# 2. IDENTITÉ VISUELLE TEXAS CHICKEN

Utiliser le site officiel :

https://texaschicken.com/

comme référence principale.

Utiliser la même identité visuelle que Texas Chicken :

- Logo officiel
- Favicon officiel
- Couleurs officielles
- Style graphique
- Typographie lorsque possible
- Univers visuel
- Esprit de la marque

Le logo et le favicon doivent reprendre ceux du site officiel.

L'application doit donner l'impression d'être une plateforme technologique officielle créée spécialement pour Texas Chicken.

# 3. DESIGN — OUT OF THIS WORLD

Le design doit être exceptionnel.

Je ne veux PAS :

- un dashboard SaaS générique
- un template Bootstrap
- des cartes basiques
- des formulaires simples
- des tableaux classiques
- une interface générique générée par IA
- un design sans personnalité

Créer une expérience visuelle :

Texas Chicken × AI × Restaurant Operations × Process Control × Mission Control

Le design doit être :

- Premium
- Moderne
- Immersif
- Audacieux
- Enterprise
- Élégant
- Technologique
- Très fluide
- Unique

Créer des :

- animations
- micro-interactions
- transitions
- effets de profondeur
- effets lumineux
- gradients
- hover states
- animations de KPI
- graphiques animés
- notifications animées
- loading states
- skeleton loaders
- animations de validation
- animations d'analyse IA
- transitions entre les pages

# 4. BACKGROUND ANIMÉ

Créer un background animé unique pour Texas Chicken.

Il doit être inspiré subtilement de :

- l'univers Texas
- l'énergie de la marque
- la restauration
- le mouvement
- la technologie
- le contrôle opérationnel

Ne pas utiliser un simple gradient animé.

Créer une identité visuelle propriétaire avec :

- profondeur
- lumières dynamiques
- particules ou éléments abstraits
- mouvements subtils
- effets de glow
- transitions lumineuses

Le background doit rester professionnel et ne jamais gêner la lisibilité.

# 5. ARCHITECTURE GLOBALE

Créer deux espaces complètement séparés.

## INTERFACE 1 — RESTAURANT OPERATIONS

Destinée aux :

- Managers
- Responsables restaurant

Objectif :

Exécuter les processus et standards opérationnels pendant le shift.

## INTERFACE 2 — ADMINISTRATION

Destinée aux :

- Super Admin
- Admin
- Operations Manager
- Auditeur
- Utilisateurs autorisés

Objectif :

Piloter :

- restaurants
- utilisateurs
- processus
- standards
- contrôles
- preuves
- alertes
- analytics
- permissions

# 6. ÉCRAN DE DÉPART

Avant la connexion, créer une page :

"Welcome to Texas Chicken Operational Excellence"

Présenter deux grandes interfaces.

## Restaurant Operations

"Exécutez les standards et contrôles de votre restaurant en temps réel."

CTA :

"Accéder à Restaurant Operations"

## Administration

"Pilotez les restaurants, processus, standards, contrôles et performances."

CTA :

"Accéder à Administration"

Créer deux grands panneaux premium avec :

- animations
- hover
- glow
- transitions
- effets de profondeur

Après sélection, transition vers le login correspondant.

# 7. LOGIN MANAGER

Créer une vraie page de login.

Champs :

Email
Mot de passe

Pré-remplir :

Email :
manager@texaschicken-demo.com

Mot de passe :
Manager123!

Ajouter :

- afficher/masquer password
- remember me
- connexion
- loading
- erreur
- succès

Les credentials doivent fonctionner.

# 8. LOGIN ADMIN

Créer une page de login séparée.

Credentials pré-remplis :

Email :
admin@texaschicken-demo.com

Mot de passe :
Admin123!

Les credentials doivent fonctionner.

# 9. SESSION ET AUTORISATION

Le système doit gérer les sessions.

Un Manager ne doit pas pouvoir accéder au Back-office.

Un Admin ne doit pouvoir accéder qu'aux modules autorisés par ses permissions.

Protéger les routes.

Si un utilisateur tente d'accéder à une interface non autorisée :

Afficher une page :

"Accès non autorisé"

# 10. DÉCONNEXION

Les deux interfaces doivent avoir un bouton :

"Déconnexion"

Il doit réellement :

- fermer la session
- supprimer l'état utilisateur
- bloquer les routes protégées
- revenir au login

# 11. MANAGER APP — MOBILE FIRST

L'application Manager doit être conçue pour :

- smartphone
- tablette

Elle doit être extrêmement rapide pendant un shift.

Le Manager doit voir immédiatement :

- ce qu'il doit faire
- les tâches urgentes
- les tâches en retard
- les preuves nécessaires
- les tâches terminées
- les anomalies

# 12. MANAGER DASHBOARD

Créer un :

"Shift Command Center"

Afficher :

- Restaurant
- Manager
- Shift
- Heure actuelle
- Heure de fin
- Temps restant
- Conformité
- Tâches terminées
- Tâches restantes
- Tâches en retard
- Alertes

Créer une grande progression :

"Progression du shift"

Exemple :

78 %

Animation fluide.

# 13. PROCESSUS DU JOUR

Créer une section :

"Processus du jour"

Ne pas simplement afficher une liste.

Créer une visualisation de workflow.

Exemples :

- Ouverture restaurant
- Préparation avant service
- Contrôle cuisine
- Contrôle salle
- Contrôle hygiène
- Fermeture

Chaque processus doit afficher :

- progression
- nombre d'étapes
- statut
- score
- retard éventuel

# 14. PROCESSUS

Exemple :

Ouverture restaurant

1. Contrôle extérieur
2. Entrée
3. Salle
4. Toilettes
5. Terrasse
6. Chambre froide
7. Stockage
8. Cuisine
9. Équipements
10. Validation finale

Créer une timeline interactive.

Statuts :

- À faire
- En cours
- Terminé
- En retard
- Non conforme
- Bloqué

# 15. CHECKLISTS PAR ZONE

BACK OF THE HOUSE :

- Cuisine
- Stockage
- Chambre froide

FRONT OF THE HOUSE :

- Salle
- Toilettes
- Terrasse
- Entrée

Prévoir des zones supplémentaires configurables dans le Back-office.

# 16. CHECKLISTS PAR RÔLE

Supporter :

- Manager
- Responsable restaurant
- Responsable zone

Prévoir des rôles configurables.

Chaque tâche doit pouvoir être associée à :

- restaurant
- zone
- rôle
- processus

# 17. TÂCHE

Lorsqu'un Manager ouvre une tâche :

Afficher :

- nom
- description
- instructions
- zone
- processus
- rôle
- heure prévue
- durée
- fréquence
- priorité
- preuve obligatoire
- statut

CTA :

"Commencer la tâche"

# 18. TIMER

Pour les tâches ayant une durée :

Afficher un vrai timer.

Exemple :

04:32

Le timer doit fonctionner.

# 19. TYPES DE TÂCHES

Supporter :

- Checklist
- Photo
- Vidéo
- Oui / Non
- Score
- Valeur numérique
- Sélection
- Commentaire
- Anomalie

# 20. PHOTO — RÈGLE CRITIQUE

Pour les tâches nécessitant une preuve photo :

La photo doit obligatoirement être prise depuis l'application.

INTERDIRE complètement l'import depuis la galerie.

Ne pas afficher :

"Upload depuis galerie"

Ne permettre que :

"Prendre une photo"

# 21. ANTI-FRAUDE IA

Lorsqu'une photo est prise :

1. Capturer
2. Analyser immédiatement
3. Comparer aux preuves historiques
4. Détecter si elle a déjà été utilisée
5. Bloquer immédiatement si elle est déjà présente

NE PAS :

- accepter la photo
- enregistrer la preuve
- valider la tâche

avant la validation.

Si la photo existe déjà :

Afficher :

"Photo déjà utilisée"

"Cette photo semble avoir déjà été utilisée comme preuve pour une autre tâche ou une précédente vérification. Veuillez prendre une nouvelle photo."

Bouton :

"Prendre une nouvelle photo"

# 22. SIMULATION IA

Créer une animation :

"Analyse de la preuve..."

Puis :

"Comparaison avec les preuves historiques..."

Puis :

"Validation IA..."

Résultat :

"Preuve validée"

ou :

"Preuve rejetée — photo déjà utilisée"

Créer une animation de scan IA premium.

# 23. SCÉNARIO PHOTO DUPLIQUÉE

Créer un scénario mock fonctionnel.

Manager :

"Vérifier la propreté de la cuisine"

Clique :

"Prendre une photo"

Simulation :

Analyse...

Résultat :

"Photo déjà utilisée"

Bloquer.

Manager :

"Prendre une nouvelle photo"

Nouvelle preuve :

"Preuve validée"

Puis :

"Terminer la tâche"

# 24. VALIDATION D'UNE TÂCHE

Une tâche ne peut être terminée que si :

- les conditions sont remplies
- la preuve obligatoire est validée
- le Manager confirme

Après validation :

- mettre à jour le processus
- mettre à jour les KPI
- mettre à jour la conformité
- enregistrer la preuve
- créer une alerte si nécessaire

# 25. BACK-OFFICE — DASHBOARD

Créer :

"Operations Command Center"

Afficher :

- conformité globale
- restaurants actifs
- processus actifs
- contrôles
- tâches
- alertes
- preuves analysées
- preuves rejetées
- non-conformités

Créer des graphiques :

- évolution de conformité
- conformité par restaurant
- conformité par processus
- performance managers
- anomalies
- preuves

# 26. MODULE RESTAURANTS

Créer un module :

"Restaurants"

CRUD complet :

- créer
- consulter
- modifier
- supprimer
- activer
- désactiver

Ajouter :

- recherche
- filtres
- tri
- pagination
- actions groupées

# 27. PROFIL RESTAURANT

Chaque restaurant doit avoir un profil complet.

Afficher :

- informations
- managers
- processus
- standards
- contrôles
- conformité
- KPI
- alertes
- preuves
- historique
- tendances

# 28. MODULE PROCESSUS

Créer :

"Processus & Contrôles"

Afficher tous les processus.

Chaque ligne/card doit montrer :

- nom
- catégorie
- restaurants
- fréquence
- étapes
- statut
- version
- dernière modification

Actions :

- consulter
- modifier
- dupliquer
- archiver
- activer
- désactiver
- supprimer

# 29. PROCESS BUILDER

Créer un véritable Process Builder.

PAS un simple formulaire.

Créer une interface visuelle permettant de construire un processus.

Étapes :

1. Informations
2. Étapes
3. Conditions
4. Preuves
5. Affectation
6. Résumé
7. Publication

# 30. CRÉATION D'UN PROCESSUS

Informations :

- nom
- description
- catégorie
- restaurant(s)
- zone(s)
- rôle
- priorité
- fréquence
- statut

# 31. BUILDER D'ÉTAPES

Bouton :

"+ Ajouter une étape"

Chaque étape :

- nom
- description
- instructions
- zone
- responsable
- heure
- durée
- fréquence
- priorité
- type
- preuve
- condition
- critère de validation

Permettre :

- drag & drop
- réorganisation
- duplication
- modification
- suppression

# 32. CONDITIONS

Créer des règles configurables.

Exemples :

Si température > 5°C :

→ Non conforme
→ Alerte

Si réponse = Non :

→ Demander une photo

Si photo rejetée :

→ Bloquer étape

Si score < 70 % :

→ Créer alerte

Si étape critique non terminée :

→ Bloquer finalisation

# 33. VERSIONS

Permettre :

- Version 1.0
- Version 1.1
- Version 2.0

Afficher :

- auteur
- date
- modifications

# 34. MODULE STANDARDS

Créer :

"Standards"

CRUD complet.

Champs :

- nom
- description
- catégorie
- zone
- rôle
- fréquence
- heure
- durée
- priorité
- preuve
- critères

# 35. MODULE CONTRÔLES

Créer :

"Contrôles"

Chaque processus exécuté génère un contrôle.

Afficher :

- processus
- restaurant
- manager
- date
- heure
- score
- conformité
- anomalies
- preuves
- statut

# 36. DÉTAIL CONTRÔLE

Créer une page complète.

Sections :

Résumé

- score
- conformité
- durée
- statut

Étapes

Timeline.

Preuves

Photos/vidéos.

Anomalies

Liste complète.

Historique

Toutes les actions.

# 37. MODULE PREUVES

Créer :

"Preuves"

Afficher :

- photo / vidéo
- restaurant
- manager
- processus
- étape
- date
- heure
- analyse IA
- statut

Statuts :

- valide
- rejetée
- dupliquée
- suspecte
- analyse

Ajouter :

- recherche
- filtres
- tri
- pagination

# 38. ALERT CENTER

Créer :

"Alert Center"

Types :

- tâche en retard
- processus en retard
- étape critique
- non-conformité
- preuve rejetée
- photo dupliquée
- restaurant sous seuil
- performance manager faible

Niveaux :

- Information
- Attention
- Important
- Critique

# 39. ANALYTICS

Créer :

"Analytics"

KPI :

- conformité globale
- conformité par restaurant
- conformité par processus
- conformité par standard
- performance manager
- performance zone
- tâches en retard
- processus incomplets
- preuves rejetées
- anomalies

Filtres :

- période
- restaurant
- processus
- manager
- zone
- standard
- statut

# 40. GESTION DES UTILISATEURS

Créer :

"Utilisateurs"

CRUD complet.

Types :

- Manager
- Responsable
- Admin
- Super Admin

# 41. GESTION DES ADMINISTRATEURS

Créer :

"Administrateurs"

CRUD complet.

Permettre :

- création
- modification
- suppression
- activation
- désactivation
- attribution de rôle
- attribution de permissions

# 42. RÔLES ET PERMISSIONS

Créer :

"Rôles & Permissions"

Rôles par défaut :

- Super Admin
- Operations Admin
- Restaurant Admin
- Auditeur

Permettre de créer des rôles personnalisés.

Modules :

- Dashboard
- Restaurants
- Processus
- Contrôles
- Standards
- Checklists
- Utilisateurs
- Administrateurs
- Rôles
- Permissions
- Preuves
- Notifications
- Analytics
- Rapports
- Audit
- Paramètres

Permissions :

- Voir
- Créer
- Modifier
- Supprimer
- Exporter

Ces permissions doivent réellement contrôler l'accès.

# 43. MOCK DATA — TRÈS RICHE

Créer une base de données mock extrêmement riche.

Ne pas utiliser seulement quelques lignes.

Créer suffisamment de données pour que l'application semble déjà utilisée par un grand réseau de restaurants.

Toutes les données doivent être cohérentes entre elles.

# 44. MOCK RESTAURANTS

Créer minimum 15 restaurants fictifs.

Villes :

- Tanger
- Tétouan
- Rabat
- Casablanca
- Marrakech
- Agadir
- Fès
- Meknès
- Oujda
- Kénitra

Chaque restaurant :

- nom
- code
- ville
- adresse
- manager
- effectif
- statut
- conformité
- processus
- contrôles
- dernière activité
- score

Créer différents niveaux de performance.

# 45. MOCK MANAGERS

Créer minimum 25 managers fictifs.

Chaque manager :

- prénom
- nom
- email
- restaurant
- rôle
- statut
- dernière connexion
- score
- tâches
- retards
- processus
- alertes

# 46. MOCK PROCESSUS

Créer minimum 12 processus :

- Ouverture restaurant
- Fermeture restaurant
- Préparation avant service
- Contrôle cuisine
- Contrôle chambre froide
- Contrôle stockage
- Contrôle hygiène
- Contrôle salle
- Contrôle toilettes
- Contrôle terrasse
- Contrôle sécurité
- Contrôle qualité produit

Chaque processus doit avoir plusieurs étapes.

# 47. MOCK CONTRÔLES

Créer plusieurs centaines de contrôles.

Répartir sur :

- restaurants
- managers
- processus
- dates
- semaines
- mois

Statuts :

- conforme
- partiellement conforme
- non conforme
- en retard
- incomplet

# 48. MOCK PREUVES

Créer de nombreuses preuves.

Associer chaque preuve à :

- restaurant
- manager
- processus
- étape
- date
- heure
- résultat IA

Créer :

- preuves valides
- preuves rejetées
- preuves dupliquées
- preuves suspectes
- preuves en analyse

# 49. MOCK ALERTES

Créer minimum 100 alertes.

Exemples :

- contrôle chambre froide en retard
- photo déjà utilisée
- restaurant sous le seuil
- processus incomplet
- non-conformité
- étape critique non réalisée

# 50. MOCK KPI

Créer des données cohérentes pour :

- conformité
- tâches
- processus
- contrôles
- preuves
- alertes
- managers
- restaurants

Les KPI doivent être calculés à partir des données mock.

# 51. MOCK HISTORIQUE

Créer plusieurs mois d'historique.

Permettre de visualiser :

- tendances
- progression
- baisse
- amélioration
- comparaison

# 52. MOCK SHIFT MANAGER

Créer un scénario réaliste :

Manager :

Youssef El Amrani

Restaurant :

Texas Chicken Tanger Centre

Shift :

08:00 → 16:00

Conformité :

89 %

Tâches terminées :

24

Tâches restantes :

6

Tâches en retard :

2

Preuves rejetées :

1

# 53. MOCK PROCESS BUILDER

Précharger plusieurs processus.

Lorsqu'on ouvre :

"Ouverture restaurant"

Afficher toutes ses étapes.

Permettre de :

- ajouter
- modifier
- supprimer
- dupliquer
- réorganiser
- modifier conditions
- modifier preuve
- modifier heure
- modifier durée
- sauvegarder

# 54. CRÉATION D'UN NOUVEAU PROCESSUS

La création doit réellement fonctionner.

Exemple :

Processus :

"Contrôle fermeture terrasse"

Étapes :

1. Vérifier tables
2. Vérifier chaises
3. Vérifier propreté
4. Prendre photo
5. Valider fermeture

Après sauvegarde :

Le processus doit apparaître immédiatement dans le module Processus.

Il doit pouvoir être affecté à un restaurant.

Il doit pouvoir être exécuté par un Manager.

# 55. RECHERCHE

Créer une recherche globale.

Rechercher dans :

- restaurants
- managers
- processus
- standards
- contrôles
- preuves
- alertes

# 56. FILTRES

Tous les modules importants doivent avoir des filtres fonctionnels.

Filtres :

- restaurant
- ville
- manager
- processus
- zone
- statut
- date
- priorité
- conformité

Les filtres doivent fonctionner ensemble.

# 57. PAGINATION

Créer une pagination réellement fonctionnelle.

Afficher :

- page
- total
- précédent
- suivant
- éléments/page

# 58. CRUD

Tous les modules configurables doivent avoir un CRUD réel :

CREATE
READ
UPDATE
DELETE

Avec :

- validation
- confirmation
- loading
- success
- error

# 59. TOUS LES BOUTONS DOIVENT FONCTIONNER

Aucun bouton décoratif.

Faire fonctionner :

- login
- logout
- navigation
- ajouter
- modifier
- supprimer
- sauvegarder
- annuler
- rechercher
- filtrer
- trier
- pagination
- notifications
- voir
- exporter
- activer
- désactiver
- affecter
- retirer
- créer processus
- ajouter étape
- modifier étape
- supprimer étape
- dupliquer étape
- déplacer étape
- publier processus
- archiver processus
- prendre photo
- reprendre photo
- valider photo
- terminer tâche
- gérer permissions
- gérer rôles

# 60. UI STATES

Tous les écrans doivent gérer :

- Loading
- Success
- Error
- Empty
- No results
- Unauthorized

# 61. RESPONSIVE

Manager :

Mobile-first.

Back-office :

Desktop-first.

Support :

- smartphone
- tablette
- laptop
- desktop
- grands écrans

# 62. ANIMATIONS

Créer des transitions premium pour :

- login
- choix interface
- navigation
- dashboard
- KPI
- graphiques
- process builder
- drag & drop
- IA
- capture photo
- validation
- fin de tâche
- notifications
- modales

# 63. EXTENSIBILITÉ FUTURE

Préparer l'architecture pour :

Smart Cameras :

- détection d'événements
- détection de situations
- détection de non-conformités

Gestion des stocks :

- inventaire début shift
- inventaire fin shift
- quantités
- écarts
- historique

Nouveaux processus :

Les administrateurs doivent pouvoir créer leurs propres processus.

Nouveaux contrôles :

L'architecture doit permettre d'ajouter de nouveaux types d'étapes.

# 64. COHÉRENCE DES DONNÉES

Toutes les données doivent être reliées.

Restaurant
→ Managers
→ Processus
→ Standards
→ Tâches
→ Contrôles
→ Preuves
→ Alertes
→ KPI

Les KPI doivent être cohérents avec les données.

Les filtres doivent réellement filtrer les données.

Les recherches doivent réellement rechercher.

Les pages de détail doivent afficher les données correspondant à l'élément sélectionné.

# 65. EXPÉRIENCE FINALE

Le produit doit donner l'impression d'être une plateforme Enterprise déjà utilisée par un réseau important de Texas Chicken.

L'application Manager doit être :

- simple
- rapide
- intuitive
- orientée action

Le Back-office doit être :

- puissant
- analytique
- configurable
- structuré

Le Process Builder doit être une fonctionnalité majeure.

L'anti-fraude photo doit être un élément central.

Les mock data doivent être extrêmement riches.

Le design doit être exceptionnel.

NE PAS livrer une simple maquette.

NE PAS livrer des boutons non fonctionnels.

NE PAS livrer des tableaux statiques.

NE PAS livrer des données incohérentes.

NE PAS utiliser un template SaaS générique.

Construire toute l'application FROM SCRATCH et créer une expérience Texas Chicken réellement unique.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6d0599fe-8f42-4c37-9cf4-a492a9f3efdc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
