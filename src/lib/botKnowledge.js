// Base de connaissances FAQ — pas de matching libre, juste des Q/R organisées par catégorie

export const BOT_KNOWLEDGE = [
  // ===== TECHNIQUE =====
  {
    id: 'tech-amrap',
    category: 'technique',
    question: "C'est quoi un AMRAP ?",
    answer: `AMRAP = "As Many Rounds/Reps As Possible". Tu fais le maximum de rounds dans le temps imparti.

Exemple : "AMRAP 12 min : 10 burpees, 15 KB swings, 20 air squats" → tu fais ce circuit en boucle pendant 12 minutes et tu comptes tes rounds.`
  },
  {
    id: 'tech-emom',
    category: 'technique',
    question: "C'est quoi un EMOM ?",
    answer: `EMOM = "Every Minute On the Minute". Au début de chaque minute, tu fais une série. Le temps qui reste = repos.

Exemple : "EMOM 10 min : 8 thrusters" → au top de chaque minute tu fais 8 thrusters, le reste tu récupères.`
  },
  {
    id: 'tech-fortime',
    category: 'technique',
    question: "C'est quoi un WOD For Time ?",
    answer: `Tu enchaînes le workout le plus vite possible, le chrono monte.

Exemple : "Cindy : 5 pull ups, 10 push ups, 15 squats × 20 rounds For Time" → tu fais les 20 rounds aussi vite que possible.`
  },
  {
    id: 'tech-tabata',
    category: 'technique',
    question: "C'est quoi Tabata ?",
    answer: `Format HIIT classique : 20s effort à fond / 10s repos × 8 rounds = 4 minutes total par exercice.

Hyper intense, conçu pour la VO2 max.`
  },
  {
    id: 'tech-rpe',
    category: 'technique',
    question: "C'est quoi le RPE ?",
    answer: `RPE = "Rate of Perceived Exertion". Échelle de 1 à 10 où tu notes la difficulté ressentie.

- RPE 7 = il te reste 3 reps en réserve
- RPE 10 = échec total

Permet d'ajuster les charges sans toujours travailler à 100%.`
  },
  {
    id: 'tech-repos-series',
    category: 'technique',
    question: "Combien de temps de repos entre les séries ?",
    answer: `Ça dépend de l'objectif :

• Force pure (1-5 reps) : 3-5 min
• Hypertrophie (8-12 reps) : 60-90 s
• Endurance / WOD : 30-60 s ou pas du tout
• Métabolique : minimum, c'est le but`
  },
  {
    id: 'tech-superset',
    category: 'technique',
    question: "C'est quoi une superset ?",
    answer: `Tu enchaînes 2 exercices sans repos entre eux, puis tu récupères seulement après le bloc.

Exemple : 10 squats + 10 pompes, repos 60s, on recommence.

Gain de temps + sollicitation cardio.`
  },
  {
    id: 'tech-progresser-bench',
    category: 'technique',
    question: "Comment progresser au bench press ?",
    answer: `Quelques principes :

• Augmente progressivement (linéaire ou par cycles)
• Travaille en 4-6 reps pour la force pure
• 8-12 reps pour le volume musculaire
• Renforce le triceps et le rear delt en accessoires
• Repos suffisant (3+ min entre les séries lourdes)`
  },
  {
    id: 'tech-hyrox',
    category: 'technique',
    question: "Comment améliorer mon temps Hyrox ?",
    answer: `Les leviers principaux :

• Course : développer le rythme de course soutenu
• Stations transitions : limiter les arrêts
• Sled push/pull : technique + force jambes
• Wall ball et burpees : économie d'effort
• Faire des simulations partielles régulièrement`
  },
  {
    id: 'tech-squat-profondeur',
    category: 'technique',
    question: "Squat parallèle ou complet ?",
    answer: `Le squat complet (cuisse sous parallèle, ATG = ass to grass) sollicite plus les fessiers et améliore la mobilité. Le squat parallèle permet souvent plus de charge.

Les deux sont valables, varie selon l'objectif. Important : descendre le plus bas que la mobilité permet.`
  },

  // ===== PROGRAMME =====
  {
    id: 'prog-frequence',
    category: 'programme',
    question: "Combien de séances par semaine ?",
    answer: `Niveau débutant : 2-3 séances. Intermédiaire : 3-4. Avancé : 4-6.

Plus important que la fréquence : la régularité dans le temps.`
  },
  {
    id: 'prog-cardio-muscu',
    category: 'programme',
    question: "Faut-il faire du cardio les jours de muscu ?",
    answer: `Pas obligatoire. Si tu en fais, garde le cardio léger (30-40 min zone 2) ou place-le après la muscu, pas avant.

Pour le HIIT, sépare des jours de muscu lourde.`
  },
  {
    id: 'prog-semaine-type',
    category: 'programme',
    question: "Comment structurer une semaine type Renfo + Hyrox ?",
    answer: `Exemple :

• Lun : Renfo poussée (bench, OHP, dips)
• Mar : Hyrox simulation partielle
• Mer : Repos ou mobilité
• Jeu : Renfo tirage (deadlift, rowing, tractions)
• Ven : Cardio long zone 2
• Sam : Renfo jambes + HIIT court
• Dim : Repos`
  },
  {
    id: 'prog-courbatures',
    category: 'programme',
    question: "Mes courbatures durent 3 jours, est-ce normal ?",
    answer: `Oui, surtout après une nouvelle stim ou une charge inhabituelle.

Au-delà de 4-5 jours, repos forcé ou consultation. Pour récupérer plus vite : sommeil, hydratation, mobilité légère, protéines.`
  },
  {
    id: 'prog-deload',
    category: 'programme',
    question: "Faut-il faire un deload ?",
    answer: `Oui, toutes les 4-8 semaines selon l'intensité.

Une semaine de deload = -30% volume ou -20% charge. Permet d'éviter la stagnation et le surentraînement.`
  },
  {
    id: 'prog-resultats',
    category: 'programme',
    question: "Combien de temps avant de voir des résultats ?",
    answer: `• Force : 2-4 semaines (gains neuro)
• Hypertrophie visible : 6-12 semaines
• Composition corporelle : 3-6 mois pour des changements nets

Tu progresses tous les jours, mais le visible vient avec le temps.`
  },
  {
    id: 'prog-progression',
    category: 'programme',
    question: "C'est quoi une bonne progression ?",
    answer: `Pour la force : +1.25 à +2.5 kg / semaine sur les gros mouvements au début, puis ralentit.

Pour l'hypertrophie : ajoute des reps, puis du poids.

Progression linéaire devient bloc/ondulée à un moment.`
  },
  {
    id: 'prog-echauffement',
    category: 'programme',
    question: "Faut-il s'échauffer ?",
    answer: `Oui, toujours :

• 5-10 min général : cardio léger + mobilité
• Spécifique : montée progressive en charge sur le 1er exo

Diminue le risque de blessure et améliore les perfs.`
  },

  // ===== NUTRITION =====
  {
    id: 'nut-proteines',
    category: 'nutrition',
    question: "Combien de protéines par jour ?",
    answer: `Pour la prise/maintien de muscle : 1.6 à 2.2 g/kg de poids de corps.

Exemple à 75 kg : 120-165 g/j. Source : viande, poisson, œufs, laitages, légumineuses, whey.

⚠️ Je ne suis pas nutritionniste, ces chiffres sont des moyennes générales basées sur la littérature scientifique.`
  },
  {
    id: 'nut-whey',
    category: 'nutrition',
    question: "Faut-il une whey protéine ?",
    answer: `Pas obligatoire si ton apport alimentaire est suffisant.

Pratique pour atteindre les quotas si tu manges peu de protéines, ou en post-séance. Ne fait pas de "magie" en soi.`
  },
  {
    id: 'nut-timing',
    category: 'nutrition',
    question: "Avant ou après la séance ?",
    answer: `Avant : repas léger 1-2h avant (glucides + protéines, ex : flocons + œuf).

Après : protéines + glucides dans les 1-2h post-séance pour la récupération.

Le timing exact compte moins que l'apport total quotidien.`
  },
  {
    id: 'nut-perdre-gras',
    category: 'nutrition',
    question: "Je veux perdre du gras, comment faire ?",
    answer: `Déficit calorique modéré (-300 à -500 kcal/jour vs maintenance).

• Conserve les protéines hautes pour préserver le muscle
• Continue la muscu lourde
• Cardio modéré pour amplifier le déficit
• Sommeil + gestion du stress essentiels

⚠️ Je ne suis pas nutritionniste.`
  },
  {
    id: 'nut-glucides',
    category: 'nutrition',
    question: "Faut-il manger des glucides ?",
    answer: `Oui, surtout autour des séances.

Les glucides rechargent le glycogène musculaire et permettent l'intensité. La proportion dépend de tes objectifs : plus pour la perf, moins pour la sèche.`
  },
  {
    id: 'nut-creatine',
    category: 'nutrition',
    question: "Créatine, intéressante ou pas ?",
    answer: `Oui, l'un des suppléments les mieux étudiés.

Améliore la force et l'endurance courte. 3-5 g/jour, monohydrate de créatine, pas besoin de phase de charge. Aucun effet secondaire prouvé chez sujet sain.`
  },
  {
    id: 'nut-competition',
    category: 'nutrition',
    question: "Quoi manger le matin d'une compétition ?",
    answer: `Repas habituel + 2-3h avant.

• Glucides complexes (flocons, pain)
• Protéines modérées (œufs, yaourt)
• Peu de gras et fibres pour éviter les troubles digestifs
• Banane 30 min avant si besoin`
  },
  {
    id: 'nut-hydratation',
    category: 'nutrition',
    question: "Hydratation, combien d'eau ?",
    answer: `Base : 30-40 ml/kg/jour.

Avec sport : +500 ml à 1L par heure d'effort. Boire avant d'avoir soif. Un peu de sel/électrolytes si gros volume ou chaleur.`
  },

  // ===== SANTÉ =====
  {
    id: 'sante-mal-dos-squat',
    category: 'sante',
    question: "J'ai mal au dos pendant le squat, que faire ?",
    answer: `Plusieurs causes possibles : mauvaise position du dos (lordose excessive ou cyphose), charge trop lourde, mobilité limitée des chevilles ou hanches.

Conseils :
• Réduis la charge
• Filme-toi pour vérifier la technique
• Échauffe bien le bas du dos
• Si la douleur persiste, consulte un kiné ou un médecin

⚠️ Je ne remplace pas un avis médical.`
  },
  {
    id: 'sante-mal-genoux',
    category: 'sante',
    question: "J'ai mal aux genoux pendant les squats",
    answer: `Vérifie : alignement genou-orteil, descente contrôlée (pas de rebond), profondeur (un squat trop court peut surcharger).

Renforce les fessiers et ischios pour équilibrer. Mobilité cheville. Si persistance, consulte.

⚠️ Je ne remplace pas un avis médical.`
  },
  {
    id: 'sante-craquement-epaule',
    category: 'sante',
    question: "J'ai entendu un \"crack\" dans mon épaule, c'est grave ?",
    answer: `Sans douleur ni perte de mobilité : souvent bénin (gaz articulaire, friction tendineuse).

Avec douleur, gonflement ou perte de force : arrête, consulte.

La règle : pas de douleur prolongée = OK, douleur prolongée = avis médical.

⚠️ Je ne remplace pas un avis médical.`
  },
  {
    id: 'sante-malade',
    category: 'sante',
    question: "Je peux m'entraîner si je suis malade ?",
    answer: `Règle du cou :

• Symptômes au-dessus du cou (rhume léger) → entraînement modéré possible
• Au-dessous (fièvre, toux profonde, courbatures généralisées) → repos

Reprendre progressivement.`
  },
  {
    id: 'sante-pas-dormi',
    category: 'sante',
    question: "Je n'ai pas dormi, je dois m'entraîner ?",
    answer: `Si vraiment fatigué : remplace par session légère (mobilité, marche, technique).

Le sommeil prime sur la séance. Tu progresses pendant le repos, pas pendant l'effort.`
  },

  // ===== EXERCICES =====
  {
    id: 'ex-deadlift',
    category: 'exercices',
    question: "Comment bien exécuter un deadlift ?",
    answer: `Pieds largeur hanches, barre au-dessus des lacets.

• Pousse les hanches en arrière, dos neutre (ni rond ni cambré)
• Épaules au-dessus ou légèrement en avant de la barre
• Pousse le sol avec les jambes
• Étends hanches et genoux ensemble
• Verrouille en haut, pas d'extension lombaire excessive`
  },
  {
    id: 'ex-squat',
    category: 'exercices',
    question: "Comment bien faire un squat ?",
    answer: `Barre haut ou bas du dos selon préférence. Pieds largeur épaules, légèrement ouverts.

• Inspire, gaine
• Descends en poussant les hanches en arrière
• Genoux dans l'axe des pieds
• Profondeur : cuisse parallèle ou plus bas
• Remonte en poussant le sol`
  },
  {
    id: 'ex-tractions',
    category: 'exercices',
    question: "Comment progresser aux tractions ?",
    answer: `Étapes :

1. Tractions négatives (descendre lentement depuis le haut)
2. Tractions assistées (élastique ou machine)
3. Tractions complètes en singles
4. Volume progressif`
  },
  {
    id: 'ex-muscle-up',
    category: 'exercices',
    question: "Comment apprendre le muscle up ?",
    answer: `Prérequis : 10+ tractions strictes + 10+ dips strictes.

Étapes :
• False grip strict pull up
• Transition assistée à l'élastique
• Kipping puis strict

Patience, c'est un mouvement technique.`
  },
  {
    id: 'ex-thruster',
    category: 'exercices',
    question: "C'est quoi un thruster ?",
    answer: `Front squat + push press en un mouvement fluide.

Tu descends en squat, et en remontant tu utilises l'élan pour pousser la barre au-dessus de la tête.

Mouvement signature CrossFit.`
  },
  {
    id: 'ex-bench-prise',
    category: 'exercices',
    question: "Quelle largeur de prise pour le bench press ?",
    answer: `Repère : avant-bras verticaux quand la barre touche la poitrine.

• Trop large = stress aux épaules
• Trop serrée = solliciter plus le triceps que le pec

Variations possibles selon objectif.`
  },
  {
    id: 'ex-pull-vs-chin',
    category: 'exercices',
    question: "Pull up vs chin up ?",
    answer: `• Pull up = pronation (paumes vers l'avant) → plus de dos, surtout grand dorsal
• Chin up = supination (paumes vers soi) → plus de biceps, légèrement plus facile

Variétés utiles dans un programme.`
  },
  {
    id: 'ex-poignets-pompes',
    category: 'exercices',
    question: "Comment éviter le mal de poignet aux pompes ?",
    answer: `• Vérifie l'alignement (poignets sous les épaules)
• Garde les doigts écartés et bien plantés
• Renforce les avant-bras
• Variantes : pompes sur poings, sur poignées (push-up bars)
• Si chronique, étire les fléchisseurs/extenseurs régulièrement`
  },

  // ===== APP =====
  {
    id: 'app-creer-seance',
    category: 'app',
    question: "Comment créer une séance ?",
    answer: `Onglet "Séances" en bas → bouton "+ Nouveau".

Tu nommes ta séance, choisis une catégorie, ajoutes des exercices dans l'échauffement, exercices principaux, et WOD optionnel.`
  },
  {
    id: 'app-timer',
    category: 'app',
    question: "Comment fonctionne le timer WOD ?",
    answer: `Onglet "Timer" en bas. Choisis un mode (AMRAP, EMOM, For Time, Tabata, Intervalles), configure les paramètres avec les molettes, démarre.

Plein écran pendant le timer.`
  },
  {
    id: 'app-records',
    category: 'app',
    question: "Comment voir mes records ?",
    answer: `Profil → Statistiques détaillées.

Tu y vois tes PR par exercice avec leur graphique d'évolution.`
  },
  {
    id: 'app-dupliquer',
    category: 'app',
    question: "Comment dupliquer une séance ?",
    answer: `Sur l'écran "Séances", chaque séance a un bouton 📋 à droite.

Tape dessus, ça crée une copie modifiable.`
  },
  {
    id: 'app-securite',
    category: 'app',
    question: "Mes données sont-elles sécurisées ?",
    answer: `Oui, hébergées sur Supabase avec authentification.

Seul toi peut accéder à tes séances. Aucun partage public.`
  },
  {
    id: 'app-offline',
    category: 'app',
    question: "Puis-je utiliser l'app hors-ligne ?",
    answer: `Pas encore complètement.

La séance en cours est sauvegardée localement (si tu fermes l'app, tu peux reprendre), mais le démarrage et la sauvegarde finale nécessitent le réseau.`
  },
  {
    id: 'app-exo-perso',
    category: 'app',
    question: "Comment ajouter un exo personnalisé ?",
    answer: `Profil → Bibliothèque d'exercices → "+ Créer un exercice personnalisé".

Tu remplis les infos et il sera dispo pour tes futures séances.`
  },
  {
    id: 'app-installer',
    category: 'app',
    question: "Comment installer l'app ?",
    answer: `Sur Android Chrome : ouvre workout.ac-dupriez.fr, menu (⋮) → "Ajouter à l'écran d'accueil" → l'app s'installe comme une vraie app native.`
  },
  {
    id: 'app-sections',
    category: 'app',
    question: "C'est quoi les sections échauffement / exos / WOD ?",
    answer: `Chaque séance peut avoir 3 sections distinctes :

• Échauffement (préparation)
• Exercices principaux (force/hypertrophie classique)
• WOD (chronométré façon CrossFit)

Tu les remplis selon tes besoins.`
  },
]

export const BOT_CATEGORIES = {
  technique:  { label: 'Technique WOD',     icon: '🏋️', color: '#378ADD' },
  programme:  { label: 'Programme',         icon: '📅', color: '#7F77DD' },
  nutrition:  { label: 'Nutrition',         icon: '🥗', color: '#639922' },
  sante:      { label: 'Santé',             icon: '🩺', color: '#E24B4A' },
  exercices:  { label: 'Exercices',         icon: '💪', color: '#EF9F27' },
  app:        { label: 'L\'app',            icon: '📲', color: '#888780' },
}
