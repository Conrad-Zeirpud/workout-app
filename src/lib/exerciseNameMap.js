// Traduction des noms d'exercices français → anglais pour free-exercise-db
// La source utilise des noms anglais standard (ex: "Barbell Bench Press", "Pullups")

export const EXERCISE_NAME_MAP = {
  // Pectoraux
  'Développé couché': 'barbell bench press',
  'Développé couché incliné': 'incline bench press',
  'Développé couché décliné': 'decline barbell bench press',
  'Développé haltères': 'dumbbell bench press',
  'Développé haltères incliné': 'incline dumbbell bench press',
  'Développé haltères décliné': 'decline dumbbell bench press',
  'Écarté haltères': 'dumbbell flyes',
  'Écarté à la poulie': 'cable crossover',
  'Écarté machine (Pec deck)': 'butterfly machine',
  'Pec deck': 'butterfly machine',

  // Dos
  'Tractions': 'pullups',
  'Tractions supination': 'chin up',
  'Tractions neutres': 'close grip chin up',
  'Tirage poitrine': 'wide grip lat pulldown',
  'Tirage horizontal': 'seated cable rows',
  'Tirage haltère': 'one arm dumbbell row',
  'Rowing barre': 'bent over barbell row',
  'Rowing T-bar': 't bar row',
  'Rowing haltère': 'one arm dumbbell row',
  'Soulevé de terre': 'barbell deadlift',
  'Soulevé de terre roumain': 'romanian deadlift',
  'Soulevé de terre sumo': 'sumo deadlift',
  'Hyperextension': 'hyperextensions',
  'Shrugs': 'barbell shrug',

  // Épaules
  'Développé militaire': 'standing military press',
  'Développé épaules haltères': 'seated dumbbell press',
  'Développé Arnold': 'arnold dumbbell press',
  'Élévations latérales': 'side lateral raise',
  'Élévations frontales': 'front dumbbell raise',
  'Oiseau': 'bent over dumbbell rear delt raise',
  'Face pull': 'face pull',

  // Biceps
  'Curl barre': 'barbell curl',
  'Curl haltères': 'dumbbell bicep curl',
  'Curl marteau': 'hammer curls',
  'Curl pupitre': 'preacher curl',
  'Curl incliné': 'incline dumbbell curl',
  'Curl concentration': 'concentration curls',
  'Curl à la poulie': 'cable curl',

  // Triceps
  'Extension nuque haltère': 'seated triceps press',
  'Barre au front': 'lying triceps press',
  'Skull crusher': 'lying triceps press',
  'Extensions poulie': 'triceps pushdown',
  'Dips': 'dips',
  'Dips banc': 'bench dips',
  'Bench dips': 'bench dips',
  'Parallel bar dips': 'dips',
  'Chest dips': 'dips chest version',
  'Diamond push up': 'pushups close triceps position',
  'Pompes serrées': 'pushups close triceps position',

  // Jambes
  'Squat': 'barbell squat',
  'Back squat': 'barbell squat',
  'Front squat': 'barbell front squat',
  'Squat haltères': 'dumbbell squat',
  'Goblet squat': 'goblet squat',
  'Hack squat': 'hack squat',
  'Bulgarian split squat': 'bulgarian split squat',
  'Air squat': 'bodyweight squat',
  'Pistol squat': 'one leg squat',
  'Sissy squat': 'sissy squat',
  'Leg press': 'leg press',
  'Presse à cuisses': 'leg press',
  'Leg extension': 'leg extensions',
  'Leg curl': 'lying leg curls',
  'Mollets debout': 'standing calf raises',
  'Mollets assis': 'seated calf raise',
  'Fentes': 'dumbbell lunges',
  'Walking lunges': 'dumbbell lunges',
  'Reverse lunges': 'reverse lunges',
  'Lateral lunges': 'side lunge',
  'Barbell lunges': 'barbell walking lunge',
  'Step up': 'dumbbell step ups',
  'Step up box': 'dumbbell step ups',
  'Box jump': 'box jump',

  // Fessiers
  'Hip thrust': 'barbell hip thrust',
  'Glute bridge': 'glute bridge',
  'Bodyweight kickback': 'bodyweight squat',  // approximation
  'Cable kickback': 'cable hip adduction',

  // Abdominaux
  'Crunches': 'crunches',
  'Reverse crunches': 'reverse crunch',
  'Russian twist': 'russian twist',
  'Plank': 'plank',
  'Side plank': 'side bridge',
  'Hollow hold': 'plank',
  'Leg raises': 'lying leg raises',
  'Toes to bar': 'pullups',  // approximation
  'Knee raise': 'hanging leg raise',
  'Mountain climbers': 'mountain climber',

  // Cardio / Full body
  'Burpee': 'burpee',
  'Push up': 'pushups',
  'Pompes': 'pushups',
  'Incline push up': 'incline pushup',
  'Decline push up': 'decline pushups',
  'Pike push up': 'handstand pushups',
  'Handstand push up': 'handstand pushups',
  'Bear crawl': 'bear crawl',
  'Inchworm': 'inchworm',
  'Jumping jack': 'jumping jacks',
  'Wall ball': 'wall ball',
  'Slam ball': 'medicine ball slam',
  'Jump rope': 'rope jumping',

  // Kettlebell
  'Kettlebell swing': 'kettlebell swing',
  'Russian KB swing': 'kettlebell swing',
  'American KB swing': 'kettlebell swing',
  'KB clean': 'kettlebell clean and press',
  'KB snatch': 'kettlebell snatch',
  'KB goblet squat': 'goblet squat',
  'Turkish get up': 'turkish get up',

  // Olympic / CrossFit
  'Clean': 'clean',
  'Power clean': 'power clean',
  'Snatch': 'power snatch',
  'Thruster': 'thruster',
  'Renegade row': 'pushup with renegade row',

  // Mobilité / warmup (souvent absents du dataset, on tente quand même)
  'Bird dog': 'bird dog',
  'Cat-cow': 'kneeling lat stretch',
  'Cat camel': 'kneeling lat stretch',
  'Downward dog': 'downward facing dog',
  'Cobra pose': 'cobra stretch',
  'Pigeon pose': 'pigeon',
  'Glute bridge': 'glute bridge',
  'Wall slides': 'wall slide',
  'Scapular pull up': 'pullups',  // approximation

  // Suspension
  'Dead hang': 'dead hang',

  // Cardio machines
  'Assault bike': 'air bike',
  'Row (rameur)': 'rowing seated',
  'SkiErg': 'rope climb',  // pas dans dataset, fallback
  'Bike (stationnaire)': 'bicycling stationary',

  // Anneaux
  'Muscle up': 'muscle up',
  'Ring dip': 'ring dips',
  'Ring row': 'inverted row',

  // Misc
  'Farmer\'s walk': 'farmers walk',
}

export function exerciseNameToQuery(name) {
  if (!name) return null
  if (EXERCISE_NAME_MAP[name]) return EXERCISE_NAME_MAP[name]
  return name.toLowerCase()
}

// Exos qu'on ne cherche pas (peu trouvables)
export const SKIP_EXERCISES = new Set([
  'Run 100m', 'Run 200m', 'Run 400m', 'Run 800m',
  'Run 1km', 'Run 1500m', 'Run 2km', 'Run 5km',
  'Run libre', 'Easy run', 'Tempo run', 'Hill sprint', 'Sprint',
  'Shuttle run',
  'World\'s greatest stretch',
  'Couch stretch',
  'Thoracic bridge',
  'Lunge avec rotation',
  'Lunge avec sandbag',
  'PVC pass through',
  'Arm circles', 'Leg swings', 'Hip openers',
  'Butt kicks', 'High knees',
  'Devil press', 'Man maker',
  'Burpee broad jump', 'Burpee box jump over',
  'Box jump over',
  'Sled push', 'Sled pull', 'Sandbag carry', 'Yoke walk', 'Bear hug carry',
  'Double under',
])
