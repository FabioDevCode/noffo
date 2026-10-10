# État du projet noffo

## État actuel

### Environnement et workspace

- [x] Dépôt Git local initialisé
- [x] Workspace pnpm configuré
- [x] Applications `apps/web`, `apps/mcp` et `apps/worker` créées
- [x] PostgreSQL 17 exécuté dans un conteneur Docker indépendant
- [x] Connexion PostgreSQL vérifiée avec DBeaver

### Application web

- [x] Nuxt 4 et Vue 3 installés
- [x] Nuxt UI et Tailwind CSS installés
- [x] Drizzle ORM et Drizzle Kit installés
- [x] Configuration Drizzle créée
- [x] Table `tasks` définie et migration appliquée
- [x] Better Auth installé
- [x] Schéma Better Auth généré dans `app/db/auth-schema.ts`

### Points non terminés

- [ ] Configurer l'adaptateur Drizzle dans Better Auth
- [ ] Vérifier et intégrer les schémas Drizzle
- [ ] Générer et appliquer les migrations d'authentification
- [ ] Définir la relation entre les tâches et leur propriétaire
- [ ] Implémenter l'inscription, la connexion et les sessions
- [ ] Construire les premières pages Nuxt
- [ ] Ajouter ensuite la double authentification TOTP
- [ ] Concevoir et implémenter la gestion des clés MCP

## Prochaine étape

Finaliser l'intégration Better Auth + Drizzle sans perturber la table `tasks` existante.

Vérifier les migrations avant de les appliquer, puis tester la connexion entre Nuxt et PostgreSQL.

## Règles

Cette liste décrit l'état connu du projet à la date de sa rédaction. Vérifier les fichiers et l'état réel du dépôt avant de considérer une tâche comme terminée.
