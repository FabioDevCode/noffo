# État du projet noffo

Dernière mise à jour : 10 octobre 2026

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
- [x] Adaptateur Better Auth configuré avec Drizzle et PostgreSQL
- [x] Tables d'authentification présentes dans les migrations et la base locale
- [x] Inscription, connexion et déconnexion par e-mail et mot de passe
- [x] Session récupérée côté serveur et côté client
- [x] Routes `/`, `/login`, `/register` et `/dashboard` avec redirections et gardes
- [x] Route privée `/api/me` protégée côté serveur
- [x] Vérification TypeScript Nuxt

### Points non terminés

- [ ] Définir la relation entre les tâches et leur propriétaire
- [ ] Construire le layout complet du tableau de bord
- [ ] Ajouter ensuite la double authentification TOTP
- [ ] Concevoir et implémenter la gestion des clés MCP
- [ ] Ajouter des tests automatisés du parcours d'authentification

La suite de tests automatisés n'est pas encore configurée. Le typecheck Nuxt, le
build de production et le démarrage du serveur de développement réussissent avec
Nuxt DevTools actif. Un patch pnpm
remplace son import par défaut de `simple-git` par l'export nommé `simpleGit`,
compatible avec la version 4 imposée par les overrides de sécurité.

## Prochaine étape

Tester manuellement l'inscription, la connexion, la déconnexion et le refus de
`/api/me` sans session. Concevoir ensuite la relation entre les tâches et leur
propriétaire sans modifier les migrations déjà appliquées à l'aveugle.

## Règles

Cette liste décrit l'état connu du projet à la date indiquée. Vérifier les
fichiers et l'état réel du dépôt avant de considérer une tâche comme terminée.
