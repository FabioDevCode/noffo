# noffo --- Architecture et choix techniques initiaux

> Document de référence initial. Il résume les décisions prises pendant
> la phase de conception. Les éléments explicitement indiqués comme « à
> décider » ne sont pas encore verrouillés.

## 1. Vision générale

**noffo** est une application de tâches et de rappels conçue notamment
pour les obligations rares ou à très long intervalle : par exemple, une
action à refaire dans un, trois ou cinq ans.

La promesse centrale est la **fiabilité des rappels dans le temps**. Le
système de notification doit fonctionner indépendamment de l'activité
d'un assistant IA : l'IA peut aider à créer ou modifier une tâche, mais
noffo conserve les données et assure lui-même la planification et
l'envoi des notifications.

Le produit est envisagé d'abord pour un usage personnel. Les besoins des
organisations pourront être étudiés ultérieurement.

## 2. Architecture générale

Le projet est organisé dans un seul dépôt Git nommé `noffo`, avec un
workspace pnpm minimal. Il comporte trois applications indépendantes qui
partagent la même base de données et, progressivement, les mêmes modules
métier.

```text
noffo/
├── apps/
│   ├── web/       # Application web Nuxt
│   ├── mcp/       # Serveur MCP pour les assistants IA
│   └── worker/    # Traitement des notifications
├── packages/      # Modules partagés, ajoutés lorsque nécessaire
├── package.json
└── pnpm-workspace.yaml
```

Il s'agit de trois applications déployables, mais **pas de trois
backends métier indépendants**. Les règles métier doivent rester
communes et indépendantes des interfaces.

```text
                  ┌──────────────────┐
                  │    PostgreSQL    │
                  │ source de vérité │
                  └────────┬─────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
           Nuxt Web       MCP         Worker
           UI + API       /mcp      Notifications
              │            │            │
              └────────────┴────────────┘
                    Core métier partagé
```

Le code partagé (par exemple l'accès aux données et certaines règles
métier) sera extrait dans `packages/` lorsqu'un besoin concret
apparaîtra. Il n'est pas nécessaire de créer tous les packages dès le
début.

## 3. Application Web --- `apps/web`

### Technologies retenues

- **Nuxt 4**
- **Vue 3**
- **TypeScript**
- **Tailwind CSS**
- **Nuxt UI**
- **Drizzle ORM** pour l'accès à PostgreSQL

### Responsabilités

- Interface utilisateur et pages de l'application.
- Authentification et gestion de session.
- Routes API Nitro nécessaires au fonctionnement du frontend.
- Gestion des tâches, des préférences et de la configuration des
  notifications.

Les routes `/api/*` de Nuxt sont une **API interne à l'application
web**, pas une API publique d'intégration. Elles nécessitent une
authentification. Une requête sans session valide doit être refusée.

Il n'est pas prévu de créer un service API séparé pour la V1. Une API
publique pourra être envisagée plus tard si des intégrations tierces,
une application mobile ou d'autres clients le justifient.

## 4. Serveur MCP --- `apps/mcp`

### Technologies envisagées

- **Node.js**
- **TypeScript**
- **SDK officiel Model Context Protocol
  (`@modelcontextprotocol/sdk`)**
- **Drizzle ORM**
- **Zod** pour valider les données externes lorsque nécessaire
- **Hono ou Fastify** comme couche HTTP --- choix encore à trancher
- **Vitest** pour les tests

### Responsabilités

Le serveur MCP expose l'interface destinée aux assistants et agents IA,
sur le point d'accès `/mcp`. Il permet à une IA d'interagir avec les
tâches au moyen d'outils structurés.

Outils envisagés pour une première version :

- `create_task`
- `get_task`
- `list_tasks`
- `search_tasks`
- `update_task`
- `complete_task`
- `snooze_task`

Les outils MCP appellent le même cœur métier que l'application web. Le
serveur MCP ne doit pas implémenter une seconde version des règles
métier et **n'envoie pas lui-même les notifications**.

L'authentification devra être adaptée aux clients MCP visés. La gestion
de jetons personnels dédiés par connexion a été envisagée, avec stockage
des empreintes plutôt que des jetons en clair, révocation et permissions
limitées. La compatibilité exacte avec les mécanismes d'authentification
OAuth des clients hébergés reste à vérifier avant de verrouiller cette
partie.

## 5. Worker --- `apps/worker`

### Technologies retenues

- **Node.js**
- **TypeScript**
- **Drizzle ORM**
- **PostgreSQL**
- **Vitest** pour les tests

Pas de framework applicatif pour le worker dans la V1. Pas de serveur
HTTP public, sauf besoin ultérieur clairement identifié.

Le worker est un processus Node.js de longue durée exécuté dans son
propre conteneur Docker en déploiement. Il exécute une boucle qui
recherche régulièrement les notifications dues. Une fréquence de polling
d'environ **30 secondes** est une proposition initiale, pas une
contrainte définitive.

### Responsabilités

- Récupérer les notifications planifiées arrivées à échéance.
- Verrouiller les jobs pour éviter leur traitement concurrent.
- Appeler le provider de notification approprié.
- Enregistrer le résultat et les erreurs.
- Gérer les tentatives et les nouvelles tentatives.
- Conserver une traçabilité suffisante pour diagnostiquer les échecs.

Le worker n'est pas la mémoire du système : PostgreSQL conserve les
jobs, y compris lorsque le worker est arrêté. Au redémarrage, il peut
reprendre le traitement des jobs en attente selon la politique de retard
qui sera définie.

## 6. Notifications et planification

La notification est traitée comme un système durable et déterministe.
L'IA peut aider l'utilisateur à configurer une tâche ou une stratégie de
rappel, mais elle ne remplace pas le moteur de planification.

Deux entités principales ont été retenues comme base de conception :

- **`Task`** : représente ce que l'utilisateur doit faire, avec
  notamment son échéance et ses règles de récurrence.
- **`NotificationJob`** : représente une notification concrète, pour
  un canal donné et une heure planifiée.

Un job pourra notamment contenir un identifiant, l'identifiant de la
tâche et de l'utilisateur, le canal, `scheduled_at`, le statut, le
nombre de tentatives, les dates de traitement et la dernière erreur.

Cycle de vie indicatif :

```text
pending → processing → sent
                    ↘ failed / retry
```

Les statuts et la stratégie exacte de reprise restent à préciser. Pour
récupérer les jobs, PostgreSQL et `FOR UPDATE SKIP LOCKED` sont
envisagés afin de permettre un traitement concurrent sans distribuer un
même job à plusieurs workers.

Aucun Redis, RabbitMQ ou Kafka n'est prévu au départ : PostgreSQL suffit
comme source durable des jobs pour la première version.

### Architecture des providers

Les canaux utilisent une abstraction commune de type
`NotificationProvider`, avec des opérations adaptées au besoin, par
exemple l'envoi et le test de configuration. Chaque provider encapsule
les détails du service externe.

Canaux envisagés :

- Première étape : email, Web Push, Telegram, webhook et
  export/intégration calendrier ICS.
- Étapes ultérieures possibles : Discord, Slack, Teams, Google
  Calendar, Outlook, ntfy et Gotify.
- SMS et WhatsApp pourront être étudiés plus tard en raison des coûts
  et contraintes de fournisseurs.

Cette liste est indicative : l'ordre et le périmètre exact de la V1
restent à décider.

## 7. Base de données et accès aux données

- **PostgreSQL** est la base principale et la source de vérité.
- **Drizzle ORM** est l'ORM retenu pour les trois applications.
- Les applications doivent partager le même schéma et la même couche
  d'accès aux données, plutôt que d'introduire des ORM différents ou
  un accès SQL maison par application.
- Les requêtes SQL spécifiques à PostgreSQL restent possibles lorsque
  cela apporte une réelle valeur.

Le modèle complet reste à concevoir, notamment la récurrence, les
occurrences, l'historique des notifications et les tentatives de
livraison. Les entités `Task` et `NotificationJob` constituent le point
de départ, pas nécessairement le modèle final complet.

## 8. Outils de développement et déploiement

- **Git** : un seul repository `noffo`.
- **pnpm 10** : gestionnaire de paquets et workspace.
- **Docker** : conteneurisation des applications lors du déploiement.
- **Docker Compose** : envisagé ultérieurement pour orchestrer les
  services du projet.
- **Vitest** : tests.
- **DBeaver** : outil local utilisé pour se connecter à PostgreSQL.

Le workspace pnpm doit rester minimal. Pas de Turborepo ni de Nx au
départ. Chaque application conserve son propre `package.json`, tandis
que pnpm gère le workspace depuis la racine.

L'environnement local actuel utilise PostgreSQL 17 dans un conteneur
Docker indépendant, avec accès via DBeaver. L'intégration de la base
dans un fichier Compose du projet sera étudiée plus tard.

## 9. Principes de développement

- Privilégier un **TypeScript simple, explicite et facile à
  apprendre**.
- Utiliser des interfaces, types et unions littérales lorsque cela
  améliore la lisibilité.
- Éviter les génériques complexes, les abstractions prématurées et le
  typage sophistiqué sans bénéfice concret.
- Introduire une dépendance uniquement lorsqu'elle répond à un besoin
  réel.
- Expliquer les nouveaux concepts TypeScript au fur et à mesure.
- Séparer les interfaces (Nuxt et MCP), le traitement asynchrone
  (worker) et les règles métier partagées.
- Favoriser la fiabilité, la traçabilité et la reprise après incident
  pour les notifications.

## 10. Décisions encore ouvertes

Les sujets suivants ne sont pas considérés comme verrouillés :

- Hono ou Fastify pour le serveur MCP.
- Mécanisme d'authentification MCP final et compatibilité des clients.
- Solution d'authentification de Nuxt.
- Schéma complet des tâches, de la récurrence et des occurrences.
- Gestion détaillée des fuseaux horaires, changements d'heure et dates
  calendaires.
- Politique de retry, de retard et d'escalade des notifications.
- Providers inclus dans la V1.
- Librairies de dates et de validation, en dehors des besoins
  concrets.
- Stratégie de tests au-delà de la base Vitest.
- Licence open source et modalités de publication.

---

**Statut :** document de synthèse des choix initiaux. Il doit évoluer
avec les décisions prises pendant le développement ; les éléments «
envisagés » ou « à décider » ne doivent pas être interprétés comme des
choix définitifs.
