import dbConnect from './db'
import { Exercise } from './models/Exercise'

const exercises = [
  // CHEST - Push
  { name: 'Barbell Bench Press', aliases: ['Bench Press', 'Flat Bench'], equipment: 'barbell', primary_muscles: ['Chest'], secondary_muscles: ['Triceps', 'Front Delts'], category: 'push' },
  { name: 'Incline Barbell Bench Press', aliases: ['Incline Bench'], equipment: 'barbell', primary_muscles: ['Upper Chest'], secondary_muscles: ['Triceps', 'Front Delts'], category: 'push' },
  { name: 'Decline Barbell Bench Press', aliases: ['Decline Bench'], equipment: 'barbell', primary_muscles: ['Lower Chest'], secondary_muscles: ['Triceps'], category: 'push' },
  { name: 'Dumbbell Bench Press', aliases: ['DB Bench Press'], equipment: 'dumbbell', primary_muscles: ['Chest'], secondary_muscles: ['Triceps', 'Front Delts'], category: 'push' },
  { name: 'Incline Dumbbell Press', aliases: ['Incline DB Press'], equipment: 'dumbbell', primary_muscles: ['Upper Chest'], secondary_muscles: ['Triceps', 'Front Delts'], category: 'push' },
  { name: 'Decline Dumbbell Press', aliases: ['Decline DB Press'], equipment: 'dumbbell', primary_muscles: ['Lower Chest'], secondary_muscles: ['Triceps'], category: 'push' },
  { name: 'Dumbbell Flyes', aliases: ['DB Flyes', 'Chest Flyes'], equipment: 'dumbbell', primary_muscles: ['Chest'], secondary_muscles: [], category: 'push' },
  { name: 'Incline Dumbbell Flyes', aliases: ['Incline Flyes'], equipment: 'dumbbell', primary_muscles: ['Upper Chest'], secondary_muscles: [], category: 'push' },
  { name: 'Cable Flyes', aliases: ['Cable Crossover'], equipment: 'cable', primary_muscles: ['Chest'], secondary_muscles: [], category: 'push' },
  { name: 'High Cable Flyes', aliases: ['High to Low Cable Flyes'], equipment: 'cable', primary_muscles: ['Lower Chest'], secondary_muscles: [], category: 'push' },
  { name: 'Low Cable Flyes', aliases: ['Low to High Cable Flyes'], equipment: 'cable', primary_muscles: ['Upper Chest'], secondary_muscles: [], category: 'push' },
  { name: 'Push-Ups', aliases: ['Pushups'], equipment: 'bodyweight', primary_muscles: ['Chest'], secondary_muscles: ['Triceps', 'Front Delts'], category: 'push' },
  { name: 'Decline Push-Ups', aliases: ['Feet Elevated Push-Ups'], equipment: 'bodyweight', primary_muscles: ['Upper Chest'], secondary_muscles: ['Triceps'], category: 'push' },
  { name: 'Diamond Push-Ups', aliases: ['Close Grip Push-Ups'], equipment: 'bodyweight', primary_muscles: ['Triceps'], secondary_muscles: ['Chest'], category: 'push' },
  { name: 'Wide Push-Ups', aliases: ['Wide Grip Push-Ups'], equipment: 'bodyweight', primary_muscles: ['Chest'], secondary_muscles: ['Triceps'], category: 'push' },
  { name: 'Chest Press Machine', aliases: ['Machine Chest Press'], equipment: 'machine', primary_muscles: ['Chest'], secondary_muscles: ['Triceps'], category: 'push' },
  { name: 'Pec Deck', aliases: ['Pec Fly Machine', 'Butterfly Machine'], equipment: 'machine', primary_muscles: ['Chest'], secondary_muscles: [], category: 'push' },
  { name: 'Dips', aliases: ['Chest Dips'], equipment: 'bodyweight', primary_muscles: ['Chest', 'Triceps'], secondary_muscles: [], category: 'push' },
  { name: 'Landmine Press', aliases: ['Landmine Chest Press'], equipment: 'barbell', primary_muscles: ['Chest', 'Front Delts'], secondary_muscles: ['Triceps'], category: 'push' },
  { name: 'Svend Press', aliases: ['Plate Squeeze Press'], equipment: 'barbell', primary_muscles: ['Chest'], secondary_muscles: [], category: 'push' },

  // BACK - Pull
  { name: 'Deadlift', aliases: ['Conventional Deadlift'], equipment: 'barbell', primary_muscles: ['Lower Back', 'Hamstrings', 'Glutes'], secondary_muscles: ['Lats', 'Traps'], category: 'hinge' },
  { name: 'Romanian Deadlift', aliases: ['RDL'], equipment: 'barbell', primary_muscles: ['Hamstrings', 'Lower Back'], secondary_muscles: ['Glutes'], category: 'hinge' },
  { name: 'Sumo Deadlift', aliases: ['Wide Stance Deadlift'], equipment: 'barbell', primary_muscles: ['Glutes', 'Quads', 'Lower Back'], secondary_muscles: ['Hamstrings'], category: 'hinge' },
  { name: 'Pull-Ups', aliases: ['Pullups'], equipment: 'bodyweight', primary_muscles: ['Lats'], secondary_muscles: ['Biceps', 'Mid Back'], category: 'pull' },
  { name: 'Chin-Ups', aliases: ['Chinups'], equipment: 'bodyweight', primary_muscles: ['Lats', 'Biceps'], secondary_muscles: ['Mid Back'], category: 'pull' },
  { name: 'Lat Pulldown', aliases: ['Pulldown'], equipment: 'cable', primary_muscles: ['Lats'], secondary_muscles: ['Biceps', 'Mid Back'], category: 'pull' },
  { name: 'Wide Grip Lat Pulldown', aliases: ['Wide Pulldown'], equipment: 'cable', primary_muscles: ['Lats'], secondary_muscles: ['Upper Back'], category: 'pull' },
  { name: 'Close Grip Lat Pulldown', aliases: ['Close Pulldown'], equipment: 'cable', primary_muscles: ['Lats'], secondary_muscles: ['Biceps'], category: 'pull' },
  { name: 'Barbell Row', aliases: ['Bent Over Row', 'BB Row'], equipment: 'barbell', primary_muscles: ['Mid Back', 'Lats'], secondary_muscles: ['Biceps'], category: 'pull' },
  { name: 'Pendlay Row', aliases: ['Dead Stop Row'], equipment: 'barbell', primary_muscles: ['Mid Back', 'Lats'], secondary_muscles: ['Biceps'], category: 'pull' },
  { name: 'T-Bar Row', aliases: ['Landmine Row'], equipment: 'barbell', primary_muscles: ['Mid Back', 'Lats'], secondary_muscles: ['Biceps'], category: 'pull' },
  { name: 'Dumbbell Row', aliases: ['DB Row', 'One Arm Row'], equipment: 'dumbbell', primary_muscles: ['Lats', 'Mid Back'], secondary_muscles: ['Biceps'], category: 'pull' },
  { name: 'Seated Cable Row', aliases: ['Cable Row'], equipment: 'cable', primary_muscles: ['Mid Back', 'Lats'], secondary_muscles: ['Biceps'], category: 'pull' },
  { name: 'Chest Supported Row', aliases: ['Seal Row'], equipment: 'dumbbell', primary_muscles: ['Mid Back', 'Lats'], secondary_muscles: ['Biceps'], category: 'pull' },
  { name: 'Inverted Row', aliases: ['Bodyweight Row', 'Australian Pull-Up'], equipment: 'bodyweight', primary_muscles: ['Mid Back', 'Lats'], secondary_muscles: ['Biceps'], category: 'pull' },
  { name: 'Face Pulls', aliases: ['Cable Face Pull'], equipment: 'cable', primary_muscles: ['Rear Delts', 'Upper Back'], secondary_muscles: ['Traps'], category: 'pull' },
  { name: 'Shrugs', aliases: ['Barbell Shrugs'], equipment: 'barbell', primary_muscles: ['Traps'], secondary_muscles: [], category: 'pull' },
  { name: 'Dumbbell Shrugs', aliases: ['DB Shrugs'], equipment: 'dumbbell', primary_muscles: ['Traps'], secondary_muscles: [], category: 'pull' },
  { name: 'Farmer Walk', aliases: ['Farmers Carry'], equipment: 'dumbbell', primary_muscles: ['Traps', 'Forearms'], secondary_muscles: ['Core'], category: 'carry' },
  { name: 'Rack Pulls', aliases: ['Partial Deadlift'], equipment: 'barbell', primary_muscles: ['Upper Back', 'Traps'], secondary_muscles: ['Lower Back'], category: 'pull' },
  { name: 'Good Morning', aliases: ['Barbell Good Morning'], equipment: 'barbell', primary_muscles: ['Lower Back', 'Hamstrings'], secondary_muscles: ['Glutes'], category: 'hinge' },

  // SHOULDERS
  { name: 'Overhead Press', aliases: ['Military Press', 'OHP', 'Shoulder Press'], equipment: 'barbell', primary_muscles: ['Front Delts'], secondary_muscles: ['Triceps', 'Upper Chest'], category: 'push' },
  { name: 'Seated Barbell Press', aliases: ['Seated OHP'], equipment: 'barbell', primary_muscles: ['Front Delts'], secondary_muscles: ['Triceps'], category: 'push' },
  { name: 'Dumbbell Shoulder Press', aliases: ['DB Press', 'Arnold Press'], equipment: 'dumbbell', primary_muscles: ['Front Delts'], secondary_muscles: ['Triceps'], category: 'push' },
  { name: 'Seated Dumbbell Press', aliases: ['Seated DB Press'], equipment: 'dumbbell', primary_muscles: ['Front Delts'], secondary_muscles: ['Triceps'], category: 'push' },
  { name: 'Arnold Press', aliases: ['Rotating DB Press'], equipment: 'dumbbell', primary_muscles: ['Front Delts', 'Side Delts'], secondary_muscles: ['Triceps'], category: 'push' },
  { name: 'Lateral Raises', aliases: ['Side Raises', 'Dumbbell Lateral Raise'], equipment: 'dumbbell', primary_muscles: ['Side Delts'], secondary_muscles: [], category: 'push' },
  { name: 'Cable Lateral Raises', aliases: ['Cable Side Raises'], equipment: 'cable', primary_muscles: ['Side Delts'], secondary_muscles: [], category: 'push' },
  { name: 'Front Raises', aliases: ['Front Delt Raise'], equipment: 'dumbbell', primary_muscles: ['Front Delts'], secondary_muscles: [], category: 'push' },
  { name: 'Rear Delt Flyes', aliases: ['Reverse Flyes', 'Bent Over Flyes'], equipment: 'dumbbell', primary_muscles: ['Rear Delts'], secondary_muscles: ['Upper Back'], category: 'pull' },
  { name: 'Cable Rear Delt Flyes', aliases: ['Cable Reverse Flyes'], equipment: 'cable', primary_muscles: ['Rear Delts'], secondary_muscles: [], category: 'pull' },
  { name: 'Upright Row', aliases: ['Barbell Upright Row'], equipment: 'barbell', primary_muscles: ['Side Delts', 'Traps'], secondary_muscles: [], category: 'pull' },
  { name: 'Dumbbell Upright Row', aliases: ['DB Upright Row'], equipment: 'dumbbell', primary_muscles: ['Side Delts', 'Traps'], secondary_muscles: [], category: 'pull' },
  { name: 'Machine Shoulder Press', aliases: ['Shoulder Press Machine'], equipment: 'machine', primary_muscles: ['Front Delts'], secondary_muscles: ['Triceps'], category: 'push' },
  { name: 'Plate Front Raise', aliases: ['Weight Plate Raise'], equipment: 'barbell', primary_muscles: ['Front Delts'], secondary_muscles: [], category: 'push' },
  { name: 'Pike Push-Ups', aliases: ['Shoulder Push-Ups'], equipment: 'bodyweight', primary_muscles: ['Front Delts'], secondary_muscles: ['Triceps'], category: 'push' },
  { name: 'Handstand Push-Ups', aliases: ['HSPU'], equipment: 'bodyweight', primary_muscles: ['Front Delts'], secondary_muscles: ['Triceps'], category: 'push' },

  // ARMS - Biceps
  { name: 'Barbell Curl', aliases: ['BB Curl', 'Bicep Curl'], equipment: 'barbell', primary_muscles: ['Biceps'], secondary_muscles: ['Forearms'], category: 'pull' },
  { name: 'EZ Bar Curl', aliases: ['EZ Curl'], equipment: 'barbell', primary_muscles: ['Biceps'], secondary_muscles: ['Forearms'], category: 'pull' },
  { name: 'Dumbbell Curl', aliases: ['DB Curl', 'Alternating Curl'], equipment: 'dumbbell', primary_muscles: ['Biceps'], secondary_muscles: ['Forearms'], category: 'pull' },
  { name: 'Hammer Curl', aliases: ['Neutral Grip Curl'], equipment: 'dumbbell', primary_muscles: ['Biceps', 'Forearms'], secondary_muscles: [], category: 'pull' },
  { name: 'Incline Dumbbell Curl', aliases: ['Incline Curl'], equipment: 'dumbbell', primary_muscles: ['Biceps'], secondary_muscles: [], category: 'pull' },
  { name: 'Concentration Curl', aliases: ['Single Arm Curl'], equipment: 'dumbbell', primary_muscles: ['Biceps'], secondary_muscles: [], category: 'pull' },
  { name: 'Preacher Curl', aliases: ['Scott Curl'], equipment: 'barbell', primary_muscles: ['Biceps'], secondary_muscles: [], category: 'pull' },
  { name: 'Cable Curl', aliases: ['Cable Bicep Curl'], equipment: 'cable', primary_muscles: ['Biceps'], secondary_muscles: [], category: 'pull' },
  { name: 'Cable Hammer Curl', aliases: ['Rope Curl'], equipment: 'cable', primary_muscles: ['Biceps', 'Forearms'], secondary_muscles: [], category: 'pull' },
  { name: '21s', aliases: ['Barbell 21s'], equipment: 'barbell', primary_muscles: ['Biceps'], secondary_muscles: [], category: 'pull' },
  { name: 'Spider Curl', aliases: ['Prone Curl'], equipment: 'barbell', primary_muscles: ['Biceps'], secondary_muscles: [], category: 'pull' },
  { name: 'Drag Curl', aliases: ['Barbell Drag Curl'], equipment: 'barbell', primary_muscles: ['Biceps'], secondary_muscles: [], category: 'pull' },

  // ARMS - Triceps
  { name: 'Close Grip Bench Press', aliases: ['CGBP'], equipment: 'barbell', primary_muscles: ['Triceps'], secondary_muscles: ['Chest'], category: 'push' },
  { name: 'Tricep Dips', aliases: ['Bench Dips'], equipment: 'bodyweight', primary_muscles: ['Triceps'], secondary_muscles: ['Chest'], category: 'push' },
  { name: 'Skull Crushers', aliases: ['Lying Tricep Extension', 'EZ Bar Skull Crusher'], equipment: 'barbell', primary_muscles: ['Triceps'], secondary_muscles: [], category: 'push' },
  { name: 'Overhead Tricep Extension', aliases: ['French Press'], equipment: 'dumbbell', primary_muscles: ['Triceps'], secondary_muscles: [], category: 'push' },
  { name: 'Cable Pushdown', aliases: ['Tricep Pushdown'], equipment: 'cable', primary_muscles: ['Triceps'], secondary_muscles: [], category: 'push' },
  { name: 'Rope Pushdown', aliases: ['Cable Rope Pushdown'], equipment: 'cable', primary_muscles: ['Triceps'], secondary_muscles: [], category: 'push' },
  { name: 'Dumbbell Kickback', aliases: ['Tricep Kickback'], equipment: 'dumbbell', primary_muscles: ['Triceps'], secondary_muscles: [], category: 'push' },
  { name: 'Overhead Cable Extension', aliases: ['Cable Tricep Extension'], equipment: 'cable', primary_muscles: ['Triceps'], secondary_muscles: [], category: 'push' },
  { name: 'Close Grip Push-Ups', aliases: ['Tricep Push-Ups'], equipment: 'bodyweight', primary_muscles: ['Triceps'], secondary_muscles: ['Chest'], category: 'push' },
  { name: 'Bench Dips', aliases: ['Weighted Bench Dips'], equipment: 'bodyweight', primary_muscles: ['Triceps'], secondary_muscles: [], category: 'push' },

  // LEGS - Quads
  { name: 'Barbell Squat', aliases: ['Back Squat', 'Squat'], equipment: 'barbell', primary_muscles: ['Quads', 'Glutes'], secondary_muscles: ['Hamstrings'], category: 'squat' },
  { name: 'Front Squat', aliases: ['Barbell Front Squat'], equipment: 'barbell', primary_muscles: ['Quads'], secondary_muscles: ['Glutes', 'Core'], category: 'squat' },
  { name: 'Goblet Squat', aliases: ['Dumbbell Squat'], equipment: 'dumbbell', primary_muscles: ['Quads', 'Glutes'], secondary_muscles: [], category: 'squat' },
  { name: 'Bulgarian Split Squat', aliases: ['Split Squat'], equipment: 'dumbbell', primary_muscles: ['Quads', 'Glutes'], secondary_muscles: ['Hamstrings'], category: 'squat' },
  { name: 'Leg Press', aliases: ['Machine Leg Press'], equipment: 'machine', primary_muscles: ['Quads', 'Glutes'], secondary_muscles: ['Hamstrings'], category: 'squat' },
  { name: 'Hack Squat', aliases: ['Machine Hack Squat'], equipment: 'machine', primary_muscles: ['Quads'], secondary_muscles: ['Glutes'], category: 'squat' },
  { name: 'Leg Extension', aliases: ['Machine Leg Extension'], equipment: 'machine', primary_muscles: ['Quads'], secondary_muscles: [], category: 'squat' },
  { name: 'Walking Lunges', aliases: ['Lunges', 'Dumbbell Lunges'], equipment: 'dumbbell', primary_muscles: ['Quads', 'Glutes'], secondary_muscles: ['Hamstrings'], category: 'squat' },
  { name: 'Reverse Lunges', aliases: ['Backward Lunges'], equipment: 'dumbbell', primary_muscles: ['Quads', 'Glutes'], secondary_muscles: [], category: 'squat' },
  { name: 'Step-Ups', aliases: ['Box Step-Ups'], equipment: 'dumbbell', primary_muscles: ['Quads', 'Glutes'], secondary_muscles: [], category: 'squat' },
  { name: 'Sissy Squat', aliases: ['Knee Extension'], equipment: 'bodyweight', primary_muscles: ['Quads'], secondary_muscles: [], category: 'squat' },
  { name: 'Pistol Squat', aliases: ['Single Leg Squat'], equipment: 'bodyweight', primary_muscles: ['Quads', 'Glutes'], secondary_muscles: [], category: 'squat' },

  // LEGS - Hamstrings
  { name: 'Leg Curl', aliases: ['Lying Leg Curl', 'Machine Leg Curl'], equipment: 'machine', primary_muscles: ['Hamstrings'], secondary_muscles: [], category: 'pull' },
  { name: 'Seated Leg Curl', aliases: ['Machine Seated Curl'], equipment: 'machine', primary_muscles: ['Hamstrings'], secondary_muscles: [], category: 'pull' },
  { name: 'Stiff Leg Deadlift', aliases: ['SLDL'], equipment: 'barbell', primary_muscles: ['Hamstrings'], secondary_muscles: ['Lower Back', 'Glutes'], category: 'hinge' },
  { name: 'Dumbbell Romanian Deadlift', aliases: ['DB RDL'], equipment: 'dumbbell', primary_muscles: ['Hamstrings'], secondary_muscles: ['Glutes'], category: 'hinge' },
  { name: 'Single Leg RDL', aliases: ['One Leg Romanian Deadlift'], equipment: 'dumbbell', primary_muscles: ['Hamstrings', 'Glutes'], secondary_muscles: [], category: 'hinge' },
  { name: 'Nordic Curls', aliases: ['Nordic Hamstring Curl'], equipment: 'bodyweight', primary_muscles: ['Hamstrings'], secondary_muscles: [], category: 'pull' },
  { name: 'Glute Ham Raise', aliases: ['GHR'], equipment: 'bodyweight', primary_muscles: ['Hamstrings', 'Glutes'], secondary_muscles: [], category: 'pull' },

  // LEGS - Glutes
  { name: 'Hip Thrust', aliases: ['Barbell Hip Thrust'], equipment: 'barbell', primary_muscles: ['Glutes'], secondary_muscles: ['Hamstrings'], category: 'hinge' },
  { name: 'Glute Bridge', aliases: ['Hip Bridge'], equipment: 'bodyweight', primary_muscles: ['Glutes'], secondary_muscles: ['Hamstrings'], category: 'hinge' },
  { name: 'Cable Pull Through', aliases: ['Cable Hip Extension'], equipment: 'cable', primary_muscles: ['Glutes', 'Hamstrings'], secondary_muscles: [], category: 'hinge' },
  { name: 'Cable Kickback', aliases: ['Glute Kickback'], equipment: 'cable', primary_muscles: ['Glutes'], secondary_muscles: [], category: 'hinge' },
  { name: 'Donkey Kicks', aliases: ['Quadruped Hip Extension'], equipment: 'bodyweight', primary_muscles: ['Glutes'], secondary_muscles: [], category: 'hinge' },
  { name: 'Fire Hydrants', aliases: ['Quadruped Hip Abduction'], equipment: 'bodyweight', primary_muscles: ['Glutes'], secondary_muscles: [], category: 'hinge' },

  // LEGS - Calves
  { name: 'Standing Calf Raise', aliases: ['Calf Raise'], equipment: 'machine', primary_muscles: ['Calves'], secondary_muscles: [], category: 'squat' },
  { name: 'Seated Calf Raise', aliases: ['Machine Seated Calf'], equipment: 'machine', primary_muscles: ['Calves'], secondary_muscles: [], category: 'squat' },
  { name: 'Dumbbell Calf Raise', aliases: ['DB Calf Raise'], equipment: 'dumbbell', primary_muscles: ['Calves'], secondary_muscles: [], category: 'squat' },

  // CORE
  { name: 'Plank', aliases: ['Front Plank'], equipment: 'bodyweight', primary_muscles: ['Abs', 'Core'], secondary_muscles: [], category: 'core' },
  { name: 'Side Plank', aliases: ['Lateral Plank'], equipment: 'bodyweight', primary_muscles: ['Obliques', 'Core'], secondary_muscles: [], category: 'core' },
  { name: 'Crunches', aliases: ['Ab Crunches'], equipment: 'bodyweight', primary_muscles: ['Abs'], secondary_muscles: [], category: 'core' },
  { name: 'Sit-Ups', aliases: ['Situps'], equipment: 'bodyweight', primary_muscles: ['Abs'], secondary_muscles: [], category: 'core' },
  { name: 'Leg Raises', aliases: ['Lying Leg Raise'], equipment: 'bodyweight', primary_muscles: ['Lower Abs'], secondary_muscles: [], category: 'core' },
  { name: 'Hanging Leg Raises', aliases: ['Hanging Knee Raise'], equipment: 'bodyweight', primary_muscles: ['Lower Abs'], secondary_muscles: [], category: 'core' },
  { name: 'Russian Twists', aliases: ['Seated Twist'], equipment: 'bodyweight', primary_muscles: ['Obliques'], secondary_muscles: ['Abs'], category: 'core' },
  { name: 'Bicycle Crunches', aliases: ['Bicycle Kicks'], equipment: 'bodyweight', primary_muscles: ['Abs', 'Obliques'], secondary_muscles: [], category: 'core' },
  { name: 'Mountain Climbers', aliases: ['Running Plank'], equipment: 'bodyweight', primary_muscles: ['Core', 'Abs'], secondary_muscles: [], category: 'core' },
  { name: 'Cable Crunch', aliases: ['Kneeling Cable Crunch'], equipment: 'cable', primary_muscles: ['Abs'], secondary_muscles: [], category: 'core' },
  { name: 'Ab Wheel Rollout', aliases: ['Ab Roller'], equipment: 'bodyweight', primary_muscles: ['Abs', 'Core'], secondary_muscles: [], category: 'core' },
  { name: 'Dead Bug', aliases: ['Dead Bug Exercise'], equipment: 'bodyweight', primary_muscles: ['Core', 'Abs'], secondary_muscles: [], category: 'core' },
  { name: 'Bird Dog', aliases: ['Quadruped Extension'], equipment: 'bodyweight', primary_muscles: ['Core', 'Lower Back'], secondary_muscles: [], category: 'core' },
  { name: 'Hollow Hold', aliases: ['Hollow Body Hold'], equipment: 'bodyweight', primary_muscles: ['Core', 'Abs'], secondary_muscles: [], category: 'core' },
  { name: 'V-Ups', aliases: ['V-Sit'], equipment: 'bodyweight', primary_muscles: ['Abs'], secondary_muscles: [], category: 'core' },
  { name: 'Wood Chop', aliases: ['Cable Wood Chop'], equipment: 'cable', primary_muscles: ['Obliques'], secondary_muscles: ['Core'], category: 'core' },
  { name: 'Pallof Press', aliases: ['Cable Core Press'], equipment: 'cable', primary_muscles: ['Core', 'Obliques'], secondary_muscles: [], category: 'core' },

  // ADDITIONAL COMPOUND MOVEMENTS
  { name: 'Clean and Press', aliases: ['Power Clean and Press'], equipment: 'barbell', primary_muscles: ['Full Body'], secondary_muscles: [], category: 'push' },
  { name: 'Clean', aliases: ['Power Clean'], equipment: 'barbell', primary_muscles: ['Traps', 'Quads', 'Glutes'], secondary_muscles: ['Upper Back'], category: 'pull' },
  { name: 'Snatch', aliases: ['Power Snatch'], equipment: 'barbell', primary_muscles: ['Full Body'], secondary_muscles: [], category: 'pull' },
  { name: 'Thruster', aliases: ['Front Squat to Press'], equipment: 'barbell', primary_muscles: ['Quads', 'Front Delts'], secondary_muscles: ['Glutes'], category: 'push' },
  { name: 'Burpees', aliases: ['Burpee'], equipment: 'bodyweight', primary_muscles: ['Full Body'], secondary_muscles: [], category: 'core' },

  // MACHINE-SPECIFIC
  { name: 'Smith Machine Squat', aliases: ['Smith Squat'], equipment: 'machine', primary_muscles: ['Quads', 'Glutes'], secondary_muscles: [], category: 'squat' },
  { name: 'Smith Machine Bench Press', aliases: ['Smith Bench'], equipment: 'machine', primary_muscles: ['Chest'], secondary_muscles: ['Triceps'], category: 'push' },
  { name: 'Leg Adductor Machine', aliases: ['Hip Adduction'], equipment: 'machine', primary_muscles: ['Adductors'], secondary_muscles: [], category: 'squat' },
  { name: 'Leg Abductor Machine', aliases: ['Hip Abduction'], equipment: 'machine', primary_muscles: ['Abductors'], secondary_muscles: [], category: 'squat' },

  // CABLE-SPECIFIC
  { name: 'Cable Tricep Kickback', aliases: ['Single Arm Cable Kickback'], equipment: 'cable', primary_muscles: ['Triceps'], secondary_muscles: [], category: 'push' },
  { name: 'Cable Bicep Curl', aliases: ['Single Arm Cable Curl'], equipment: 'cable', primary_muscles: ['Biceps'], secondary_muscles: [], category: 'pull' },

  // BAND EXERCISES
  { name: 'Band Pull Apart', aliases: ['Resistance Band Pull Apart'], equipment: 'band', primary_muscles: ['Rear Delts', 'Upper Back'], secondary_muscles: [], category: 'pull' },
  { name: 'Band Face Pull', aliases: ['Resistance Band Face Pull'], equipment: 'band', primary_muscles: ['Rear Delts'], secondary_muscles: [], category: 'pull' },
  { name: 'Band Lateral Raise', aliases: ['Resistance Band Side Raise'], equipment: 'band', primary_muscles: ['Side Delts'], secondary_muscles: [], category: 'push' },
  { name: 'Band Squat', aliases: ['Resistance Band Squat'], equipment: 'band', primary_muscles: ['Quads', 'Glutes'], secondary_muscles: [], category: 'squat' },
  { name: 'Band Row', aliases: ['Resistance Band Row'], equipment: 'band', primary_muscles: ['Mid Back'], secondary_muscles: ['Biceps'], category: 'pull' },
  { name: 'Band Chest Press', aliases: ['Resistance Band Press'], equipment: 'band', primary_muscles: ['Chest'], secondary_muscles: ['Triceps'], category: 'push' },
  { name: 'Band Deadlift', aliases: ['Resistance Band Deadlift'], equipment: 'band', primary_muscles: ['Hamstrings', 'Glutes'], secondary_muscles: [], category: 'hinge' },

  // FOREARM-SPECIFIC
  { name: 'Wrist Curl', aliases: ['Barbell Wrist Curl'], equipment: 'barbell', primary_muscles: ['Forearms'], secondary_muscles: [], category: 'pull' },
  { name: 'Reverse Wrist Curl', aliases: ['Reverse Barbell Wrist Curl'], equipment: 'barbell', primary_muscles: ['Forearms'], secondary_muscles: [], category: 'pull' },
  { name: 'Plate Pinch', aliases: ['Pinch Grip Hold'], equipment: 'barbell', primary_muscles: ['Forearms'], secondary_muscles: [], category: 'carry' },
  { name: 'Dead Hang', aliases: ['Bar Hang'], equipment: 'bodyweight', primary_muscles: ['Forearms'], secondary_muscles: ['Lats'], category: 'pull' },

  // VARIATIONS & SPECIALTY
  { name: 'Pause Squat', aliases: ['Paused Back Squat'], equipment: 'barbell', primary_muscles: ['Quads', 'Glutes'], secondary_muscles: [], category: 'squat' },
  { name: 'Pause Bench Press', aliases: ['Paused Bench'], equipment: 'barbell', primary_muscles: ['Chest'], secondary_muscles: ['Triceps'], category: 'push' },
  { name: 'Box Squat', aliases: ['Barbell Box Squat'], equipment: 'barbell', primary_muscles: ['Quads', 'Glutes'], secondary_muscles: [], category: 'squat' },
  { name: 'Deficit Deadlift', aliases: ['Elevated Deadlift'], equipment: 'barbell', primary_muscles: ['Hamstrings', 'Lower Back'], secondary_muscles: [], category: 'hinge' },
  { name: 'Paused Deadlift', aliases: ['Dead Stop Deadlift'], equipment: 'barbell', primary_muscles: ['Lower Back', 'Hamstrings'], secondary_muscles: [], category: 'hinge' },
  { name: 'Anderson Squat', aliases: ['Dead Stop Squat'], equipment: 'barbell', primary_muscles: ['Quads'], secondary_muscles: [], category: 'squat' },
  { name: 'Tempo Squat', aliases: ['Slow Eccentric Squat'], equipment: 'barbell', primary_muscles: ['Quads', 'Glutes'], secondary_muscles: [], category: 'squat' },
  { name: 'Pin Press', aliases: ['Dead Stop Bench Press'], equipment: 'barbell', primary_muscles: ['Chest', 'Triceps'], secondary_muscles: [], category: 'push' },
  { name: 'Floor Press', aliases: ['Barbell Floor Press'], equipment: 'barbell', primary_muscles: ['Chest', 'Triceps'], secondary_muscles: [], category: 'push' },
  { name: 'Zercher Squat', aliases: ['Elbow Squat'], equipment: 'barbell', primary_muscles: ['Quads', 'Core'], secondary_muscles: [], category: 'squat' },
  { name: 'Safety Bar Squat', aliases: ['SSB Squat'], equipment: 'barbell', primary_muscles: ['Quads', 'Glutes'], secondary_muscles: [], category: 'squat' },

  // OLYMPIC VARIATIONS
  { name: 'Hang Clean', aliases: ['Hang Power Clean'], equipment: 'barbell', primary_muscles: ['Traps', 'Quads'], secondary_muscles: [], category: 'pull' },
  { name: 'Hang Snatch', aliases: ['Hang Power Snatch'], equipment: 'barbell', primary_muscles: ['Traps', 'Quads', 'Front Delts'], secondary_muscles: [], category: 'pull' },
  { name: 'High Pull', aliases: ['Barbell High Pull'], equipment: 'barbell', primary_muscles: ['Traps', 'Upper Back'], secondary_muscles: [], category: 'pull' },
  { name: 'Snatch Grip Deadlift', aliases: ['Wide Grip Deadlift'], equipment: 'barbell', primary_muscles: ['Upper Back', 'Hamstrings'], secondary_muscles: [], category: 'hinge' },

  // UNILATERAL & BALANCE
  { name: 'Single Leg Press', aliases: ['One Leg Press'], equipment: 'machine', primary_muscles: ['Quads', 'Glutes'], secondary_muscles: [], category: 'squat' },
  { name: 'Single Arm Dumbbell Press', aliases: ['One Arm DB Press'], equipment: 'dumbbell', primary_muscles: ['Front Delts', 'Core'], secondary_muscles: [], category: 'push' },
  { name: 'Single Arm Cable Row', aliases: ['One Arm Cable Row'], equipment: 'cable', primary_muscles: ['Lats', 'Mid Back'], secondary_muscles: [], category: 'pull' },

  // STABILITY & FUNCTIONAL
  { name: 'Turkish Get-Up', aliases: ['TGU'], equipment: 'dumbbell', primary_muscles: ['Full Body'], secondary_muscles: [], category: 'core' },
  { name: 'Suitcase Carry', aliases: ['Single Arm Carry'], equipment: 'dumbbell', primary_muscles: ['Core', 'Obliques'], secondary_muscles: ['Forearms'], category: 'carry' },
  { name: 'Overhead Carry', aliases: ['Waiter Walk'], equipment: 'dumbbell', primary_muscles: ['Front Delts', 'Core'], secondary_muscles: [], category: 'carry' },
  { name: 'Sled Push', aliases: ['Prowler Push'], equipment: 'machine', primary_muscles: ['Quads', 'Glutes'], secondary_muscles: ['Chest'], category: 'push' },
  { name: 'Sled Pull', aliases: ['Prowler Pull'], equipment: 'machine', primary_muscles: ['Hamstrings', 'Back'], secondary_muscles: [], category: 'pull' },

  // CARDIO/CONDITIONING
  { name: 'Jumping Jacks', aliases: ['Star Jumps'], equipment: 'bodyweight', primary_muscles: ['Full Body'], secondary_muscles: [], category: 'core' },
  { name: 'High Knees', aliases: ['Running in Place'], equipment: 'bodyweight', primary_muscles: ['Quads'], secondary_muscles: ['Core'], category: 'core' },
  { name: 'Box Jumps', aliases: ['Jump Box'], equipment: 'bodyweight', primary_muscles: ['Quads', 'Glutes'], secondary_muscles: [], category: 'squat' },
  { name: 'Jump Squats', aliases: ['Squat Jumps'], equipment: 'bodyweight', primary_muscles: ['Quads', 'Glutes'], secondary_muscles: [], category: 'squat' },
  { name: 'Tuck Jumps', aliases: ['Knee Tuck Jump'], equipment: 'bodyweight', primary_muscles: ['Quads'], secondary_muscles: [], category: 'squat' },
  { name: 'Skater Hops', aliases: ['Lateral Hops'], equipment: 'bodyweight', primary_muscles: ['Quads', 'Glutes'], secondary_muscles: [], category: 'squat' },
  { name: 'Battle Ropes', aliases: ['Rope Waves'], equipment: 'band', primary_muscles: ['Front Delts', 'Core'], secondary_muscles: [], category: 'core' },
]

export async function seedExercises() {
  try {
    await dbConnect()
    
    const count = await Exercise.countDocuments()
    
    if (count > 0) {
      console.log(`Database already has ${count} exercises. Skipping seed.`)
      return
    }

    console.log('Seeding exercises...')
    await Exercise.insertMany(exercises)
    console.log(`Successfully seeded ${exercises.length} exercises`)
  } catch (error) {
    console.error('Error seeding exercises:', error)
    throw error
  }
}


