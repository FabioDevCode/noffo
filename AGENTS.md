# Instructions — noffo

## 1. Contexte du projet

noffo est une application de tâches et de rappels, particulièrement adaptée aux actions rares ou à très long intervalle : un, trois ou cinq ans, par exemple.

La promesse centrale est la fiabilité des rappels dans le temps. Les tâches et les notifications doivent être conservées et traitées indépendamment de l'activité d'un assistant IA.

Consulter `docs/architecture.md` pour comprendre l'architecture globale et les responsabilités des applications.

## 2. Architecture

Le dépôt est un workspace pnpm comprenant trois applications indépendantes :

- `apps/web` : interface web Nuxt et routes API Nitro internes.
- `apps/mcp` : serveur MCP destiné aux assistants IA.
- `apps/worker` : traitement asynchrone des notifications.

PostgreSQL est la source de vérité. Drizzle ORM est l'ORM retenu.

Les règles métier doivent rester cohérentes entre les interfaces. Ne pas dupliquer la logique métier dans Nuxt, MCP et le worker.

Ne pas créer de service API séparé sans décision explicite.

## 3. Technologies

Pour l'application web :

- Nuxt 4
- Vue 3
- TypeScript
- Tailwind CSS
- Nuxt UI
- Drizzle ORM
- Better Auth, dont l'intégration reste à finaliser

Le workspace utilise pnpm 10.

Ne pas introduire React, Next.js, Turborepo ou Nx.

## 4. Principes de développement

- Écrire du TypeScript simple, explicite et lisible.
- Éviter les abstractions prématurées et les génériques complexes.
- Ne pas ajouter de dépendance sans besoin concret.
- Réutiliser les conventions et les dépendances déjà présentes.
- Expliquer brièvement les choix techniques qui ne sont pas évidents.
- Privilégier des changements petits et vérifiables.
- Ne pas modifier des fichiers sans rapport avec la tâche demandée.

## 5. Base de données et migrations

- PostgreSQL est la source de vérité.
- Les schémas Drizzle et les migrations SQL doivent être versionnés dans Git.
- Ne jamais modifier la base à l'insu du développeur.
- Ne jamais supprimer ou recréer une table existante sans validation explicite.
- Avant une migration, expliquer son effet et signaler les risques de perte de données.
- Préserver les données et les migrations déjà appliquées.
- Éviter de définir plusieurs fois la même table dans différents fichiers de schéma.

## 6. Sécurité

- Ne jamais afficher, committer ou transmettre des secrets présents dans les fichiers `.env`.
- Ne jamais stocker les mots de passe en clair.
- Vérifier l'authentification et l'autorisation sur les routes privées.
- Un utilisateur ne doit pouvoir accéder qu'à ses propres données.
- Les clés d'accès MCP devront être révocables et stockées sous forme de hash.
- Ne pas implémenter soi-même de mécanismes cryptographiques sans nécessité.

## 7. Méthode de travail

Avant toute modification :

1. Examiner les fichiers concernés et les conventions existantes.
2. Vérifier les décisions documentées et l'état actuel du projet.
3. Identifier les changements nécessaires, sans élargir inutilement le périmètre.

Pendant le travail :

- Procéder par étapes courtes.
- Ne pas enchaîner des modifications majeures sans validation.
- Ne pas considérer une fonctionnalité comme terminée sans vérification.

Après le travail :

- Exécuter les vérifications pertinentes : typecheck, lint ou tests, selon les scripts disponibles.
- Résumer les fichiers modifiés, les commandes exécutées et les éventuels problèmes restants.
- Mettre à jour la documentation si une décision ou l'état du projet change.

## 8. Gestion des décisions

Ne pas transformer une hypothèse en décision définitive.

Si une décision structurante manque, proposer une option avec ses avantages et ses inconvénients, puis attendre une validation avant de mettre en œuvre un changement difficile à inverser.
