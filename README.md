# 💪 WorkoutApp

Application mobile PWA complète pour construire, lancer et analyser tes séances de sport.

## Stack
- **Vue 3** + Vite + Vue Router + Pinia
- **Supabase** (Auth email, PostgreSQL, Row-Level Security)
- **Tailwind CSS**
- **vite-plugin-pwa** (installable sur iOS/Android)

## Fonctionnalités

| Écran | Contenu |
|-------|--------|
| Dashboard | Stats semaine, calendrier des séances, raccourcis programmes, derniers PR |
| Séances | Liste des programmes, lancement rapide, édition, suppression |
| Constructeur | Créer/modifier : nom, exercices, séries × reps, poids cible, temps de repos, réordonnancement |
| Session live | Chrono global, onglets par exercice, saisie reps/poids/RPE, overlay timer de repos (son + vibration), indicateur "dernière fois" |
| Résumé | Durée, volume total, séries, PR détectés automatiquement, notes de séance |
| Historique | Sessions récentes, graphique de progression par exercice, liste des PR |
| Exercices | Bibliothèque filtrée par groupe musculaire, ajout d'exercices personnalisés |
| Profil | Stats globales, activité hebdo (barres), top muscles, préférences (son, vibration, unité kg/lbs) |

## Installation

### 1. Installer les dépendances
```bash
cd workout-app
npm install
```

### 2. Créer un projet Supabase
1. [supabase.com](https://supabase.com) → **New project**
2. SQL Editor → colle et exécute `supabase_migration.sql` (crée tables, RLS et 23 exercices par défaut)
3. Settings > API → copie **URL** et clé **anon**

### 3. Configurer l'environnement
```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### 4. Lancer
```bash
npm run dev
# → http://localhost:5173
```

Pour tester sur ton téléphone : ouvre `http://<IP-locale>:5173` sur le même Wi-Fi.

### 5. Build
```bash
npm run build
```

Déploie `dist/` sur Vercel, Netlify ou Firebase Hosting.

## Installer comme app mobile

Après déploiement :
- **iOS Safari** : Partager → "Sur l'écran d'accueil"
- **Android Chrome** : Menu ⋮ → "Ajouter à l'écran d'accueil"

## Structure

```
src/
├── assets/main.css
├── components/
│   ├── session/       RestTimerOverlay, SetRow
│   ├── stats/         ProgressChart, WeeklyBarChart
│   ├── ui/            BottomNav, CalendarGrid, TimerRing, PRBadge, Toast, etc.
│   └── workout/       WorkoutCard
├── composables/       useSettings, useTimer, useToast, useWorkoutUtils
├── lib/supabase.js
├── router/index.js
├── stores/            auth, workouts, session, stats
└── views/             Auth, Dashboard, Workouts, WorkoutBuilder,
                        Session, SessionSummary, History, Exercises, Profile
```

## Schéma base de données

| Table | Rôle |
|-------|------|
| `exercises` | Bibliothèque (23 défauts + personnalisés) |
| `workouts` | Programmes / modèles |
| `workout_items` | Exercices d'un programme |
| `sessions` | Séances réalisées |
| `session_sets` | Séries (poids, reps, RPE, PR) |

Toutes les tables sont protégées par **Row-Level Security** — chaque utilisateur n'accède qu'à ses propres données.
