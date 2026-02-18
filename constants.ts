
import { ClinicalData } from './types';

// --- HIERARCHICAL CLINICAL DATA (CPT -> Phase -> Subtask -> Deficits) ---
export const CLINICAL_DATA: ClinicalData = {
  SELF_CARE: {
    id: 'SELF_CARE',
    label: "Self-Care (97535)",
    cpt: "97535",
    phases: [
      {
        id: 'hygiene',
        name: "Grooming & Hygiene",
        subtasks: [
            { name: "Oral hygiene", deficits: ["fine motor coordination", "hand-to-mouth coordination", "sequencing", "decreased activity tolerance"] },
            { name: "Upper body bathing", deficits: ["crossing midline", "shoulder ROM", "tactile discrimination", "decreased upper extremity strength"] },
            { name: "Shaving/Makeup", deficits: ["visual-motor integration", "fine motor coordination", "decreased activity tolerance"] }
        ]
      },
      {
        id: 'feeding',
        name: "Feeding/Eating",
        subtasks: [
            { name: "Utensil manipulation", deficits: ["tripod grasp", "forearm supination", "hand-to-mouth coordination", "decreased upper extremity strength"] },
            { name: "Cup/Glass management", deficits: ["grading force", "depth perception", "wrist stability"] }
        ]
      },
      {
        id: 'toileting',
        name: "Toileting Activity",
        subtasks: [
            { name: "Perineal hygiene", deficits: ["trunk rotation", "dynamic standing balance", "proprioception", "decreased activity tolerance"] },
            { name: "Clothing management", deficits: ["fine motor coordination", "standing tolerance", "motor planning"] }
        ]
      },
      {
        id: 'retrieval',
        name: "Retrieval & Setup",
        subtasks: [
          { name: "Retrieving clothing", deficits: ["dynamic balance", "functional reach", "standing endurance"] },
          { name: "Distinguishing orientation", deficits: ["visual-spatial processing", "sequencing"] }
        ]
      },
      {
        id: 'donning',
        name: "Dressing (Donning)",
        subtasks: [
          { name: "Threading RLE/LLE", deficits: ["hip flexion ROM", "static postural stability", "bilateral coordination", "decreased activity tolerance"] },
          { name: "Pulling to hips", deficits: ["core stability", "upper body strength", "dynamic sitting balance"] },
          { name: "Managing footwear", deficits: ["fine motor coordination", "hip flexion ROM", "tactile discrimination"] }
        ]
      },
      {
        id: 'transfers',
        name: "ADL Transfers",
        subtasks: [
          { name: "Toilet transfer", deficits: ["safety awareness", "motor planning", "lower body strength", "decreased activity tolerance"] },
          { name: "Tub/Shower transfer", deficits: ["dynamic balance", "safety awareness", "environmental sequencing"] }
        ]
      }
    ]
  },
  THER_ACT: {
    id: 'THER_ACT',
    label: "Therapeutic Activity (97530)",
    cpt: "97530",
    phases: [
      {
        id: 'manipulation',
        name: "Object Manipulation",
        subtasks: [
            { name: "Fine motor prehension", deficits: ["pincer grasp", "finger isolation", "in-hand manipulation"] },
            { name: "Gross motor reaching", deficits: ["dynamic standing balance", "scapular endurance", "visual scanning"] }
        ]
      },
      {
        id: 'functional_mvmt',
        name: "Functional Movement",
        subtasks: [
          { name: "Sit-to-stand mechanics", deficits: ["eccentric control", "motor planning", "gluteal activation", "decreased activity tolerance"] },
          { name: "Bending to floor", deficits: ["dynamic balance", "righting reactions", "safety awareness"] }
        ]
      },
      {
        id: 'carrying',
        name: "Load Management",
        subtasks: [
          { name: "Lifting/Carrying", deficits: ["core stability", "grip strength", "safety awareness", "load management"] },
          { name: "Stair negotiation", deficits: ["reciprocal patterning", "concentric control", "dynamic balance"] }
        ]
      }
    ]
  },
  THER_EX: {
    id: 'THER_EX',
    label: "Therapeutic Exercise (97110)",
    cpt: "97110",
    phases: [
      {
        id: 'activation',
        name: "Strength & Activation",
        subtasks: [
          { name: "Isometric holds", deficits: ["motor unit recruitment", "muscle guarding", "decreased upper extremity strength"] },
          { name: "Concentric/Eccentric reps", deficits: ["eccentric control", "length-tension relationship", "muscular endurance"] }
        ]
      },
      {
        id: 'rom',
        name: "Mobility & ROM",
        subtasks: [
          { name: "Active/Passive ROM", deficits: ["capsular restriction", "soft tissue extensibility", "contracture risk"] },
          { name: "Joint Mobilization", deficits: ["joint arthrokinematics", "pain modulation"] }
        ]
      }
    ]
  },
  NEURO_REED: {
    id: 'NEURO_REED',
    label: "Neuro Re-Ed (97112)",
    cpt: "97112",
    phases: [
        {
            id: 'balance',
            name: "Postural Control",
            subtasks: [
                { name: "Perturbation training", deficits: ["reactive postural control", "vestibular processing"]},
                { name: "Single-leg stance", deficits: ["proprioception", "ankle stability"]}
            ]
        },
        {
            id: 'coordination',
            name: "Coordination",
            subtasks: [
                { name: "Crossing midline", deficits: ["motor planning", "bilateral integration"] },
                { name: "Proprioceptive PNF", deficits: ["kinesthetic awareness", "movement fluidity"] }
            ]
        }
    ]
  },
  // --- NEW CATEGORY 1: BALANCE & VESTIBULAR ---
  BALANCE: {
    id: 'BALANCE',
    label: "Balance/Vestibular (97112)",
    cpt: "97112",
    phases: [
      {
        id: 'static_dyn',
        name: "Static/Dynamic Control",
        subtasks: [
          { name: "Romberg/Tandem stance", deficits: ["somatosensory integration", "base of support management"] },
          { name: "Limits of Stability (LOS)", deficits: ["center of gravity control", "ankle strategies"] }
        ]
      },
      {
        id: 'vestibular',
        name: "Vestibular Function",
        subtasks: [
          { name: "VOR x1 / x2 exercises", deficits: ["gaze stabilization", "oscillopsia"] },
          { name: "Head movement w/ tracking", deficits: ["visual-vestibular mismatch", "dizziness handicap"] }
        ]
      }
    ]
  },
  // --- NEW CATEGORY 2: IADL ---
  IADL: {
    id: 'IADL',
    label: "IADL Mgmt (97535)",
    cpt: "97535",
    phases: [
      {
        id: 'home_mgmt',
        name: "Home Management",
        subtasks: [
          { name: "Meal Preparation", deficits: ["safety awareness", "task sequencing", "functional endurance"] },
          { name: "Laundry/Cleaning", deficits: ["dynamic balance", "load management", "problem solving"] }
        ]
      },
      {
        id: 'community',
        name: "Community Reinteg",
        subtasks: [
          { name: "Money Management", deficits: ["higher-level calculation", "executive function"] },
          { name: "Medication Box Setup", deficits: ["fine motor coordination", "cognitive retention"] }
        ]
      }
    ]
  },
  // --- NEW CATEGORY 3: VISION ---
  VISION: {
    id: 'VISION',
    label: "Vision/Perception (97530)",
    cpt: "97530",
    phases: [
      {
        id: 'oculomotor',
        name: "Oculomotor Skills",
        subtasks: [
          { name: "Saccades/Pursuits", deficits: ["visual tracking", "oculomotor fatigue"] },
          { name: "Convergence/Divergence", deficits: ["diplopia", "visual fusion"] }
        ]
      },
      {
        id: 'perception',
        name: "Visual Perception",
        subtasks: [
          { name: "Figure-Ground tasks", deficits: ["visual discrimination", "visual clutter processing", "atmospheric/environmental barriers"] },
          { name: "Visual Scanning", deficits: ["unilateral neglect", "visual field cut", "atmospheric/environmental barriers"] }
        ]
      }
    ]
  },
  MANUAL: {
    id: 'MANUAL',
    label: "Manual Therapy (97140)",
    cpt: "97140",
    phases: [
        {
            id: 'soft_tissue',
            name: "Soft Tissue Mob",
            subtasks: [
                { name: "Myofascial release", deficits: ["tissue extensibility", "muscle guarding", "fascial restriction"] },
                { name: "Trigger point release", deficits: ["pain modulation", "muscle guarding"] },
                { name: "Retrograde massage", deficits: ["edema management", "lymphatic flow"] }
            ]
        },
        {
            id: 'joint',
            name: "Joint Mobilization",
            subtasks: [
                { name: "Glenohumeral distraction", deficits: ["capsular restriction", "pain modulation"] },
                { name: "Scapular mobilization", deficits: ["scapulohumeral rhythm", "soft tissue extensibility"] }
            ]
        }
    ]
  },
  COGNITIVE: {
    id: 'COGNITIVE',
    label: "Cognitive Skills (97127)",
    cpt: "97127",
    phases: [
        {
            id: 'attention',
            name: "Attention & Focus",
            subtasks: [
                { name: "Dual-task training", deficits: ["divided attention", "cognitive endurance"] },
                { name: "Sustained attention task", deficits: ["attentional capacity", "task persistence"] }
            ]
        },
        {
            id: 'executive',
            name: "Executive Function",
            subtasks: [
                { name: "Medication management", deficits: ["complex sequencing", "safety awareness", "problem solving"] },
                { name: "Schedule planning", deficits: ["abstract reasoning", "time management"] },
                { name: "Financial balancing", deficits: ["higher-level calculation", "problem solving"] }
            ]
        }
    ]
  },
  WHEELCHAIR: {
    id: 'WHEELCHAIR',
    label: "Wheelchair Mgmt (97542)",
    cpt: "97542",
    phases: [
        {
            id: 'propulsion',
            name: "Propulsion Training",
            subtasks: [
                { name: "Level terrain propulsion", deficits: ["muscular endurance", "scapular stability"] },
                { name: "Ramp negotiation", deficits: ["safety awareness", "trunk control"] },
                { name: "Doorway management", deficits: ["visual-spatial processing", "maneuverability"] }
            ]
        },
        {
            id: 'positioning',
            name: "Positioning & Fit",
            subtasks: [
                { name: "Pressure relief techniques", deficits: ["skin integrity risk", "motor planning"] },
                { name: "Cushion adjustment", deficits: ["postural alignment", "sitting balance"] },
                { name: "Rigging management", deficits: ["fine motor coordination", "sequencing"] }
            ]
        }
    ]
  },
  GAIT: {
    id: 'GAIT',
    label: "Gait Training (97116)",
    cpt: "97116",
    phases: [
      {
        id: 'mechanics',
        name: "Gait Mechanics",
        subtasks: [
          { name: "Weight acceptance training", deficits: ["antalgic pattern", "decreased stance time"] },
          { name: "Swing phase initiation", deficits: ["hip flexor weakness", "foot clearance deficit"] }
        ]
      },
      {
        id: 'functional_amb',
        name: "Functional Ambulation",
        subtasks: [
          { name: "Multi-directional turns", deficits: ["dynamic instability", "vestibular dysfunction"] },
          { name: "Uneven surface negotiation", deficits: ["proprioceptive deficit", "balance confidence"] }
        ]
      }
    ]
  },
  ORTHOTICS: {
    id: 'ORTHOTICS',
    label: "Orthotics (97760)",
    cpt: "97760",
    phases: [
      {
        id: 'assessment',
        name: "Assessment & Fit",
        subtasks: [
          { name: "Skin integrity inspection", deficits: ["risk of breakdown", "sensation impairment"] },
          { name: "Joint alignment check", deficits: ["contracture risk", "joint deformity"] }
        ]
      },
      {
        id: 'training',
        name: "Usage Training",
        subtasks: [
          { name: "Donning/Doffing technique", deficits: ["fine motor deficit", "sequencing"] },
          { name: "Wear schedule education", deficits: ["cognitive retention", "insight into condition"] }
        ]
      }
    ]
  },
  SENSORY: {
    id: 'SENSORY',
    label: "Sensory Integ. (97533)",
    cpt: "97533",
    phases: [
      {
        id: 'desensitization',
        name: "Desensitization",
        subtasks: [
          { name: "Graded texture exposure", deficits: ["hypersensitivity", "allodynia", "atmospheric/environmental barriers"] },
          { name: "Vibration/Percussion", deficits: ["neuroma pain", "sensory organization"] }
        ]
      },
      {
        id: 'discrimination',
        name: "Discrimination",
        subtasks: [
          { name: "Stereognosis tasks", deficits: ["cortical sensory loss", "tactile agnosia"] },
          { name: "Localization training", deficits: ["peripheral neuropathy", "sensory mapping deficit"] }
        ]
      }
    ]
  }
};

// --- CUE CONTEXT MAP ---
// Defines the "Reasoning" for specific cues based on the type of deficit
export const CUE_CONTEXT_MAP: Record<string, string> = {
    "Verbal": "auditory commands to sequence tasks and improve safety awareness",
    "Tactile": "manual facilitation to correct postural alignment and muscle activation",
    "Visual": "visual markers to enhance orientation and attention",
    "Demonstration": "modeling to facilitate motor learning and praxic skills",
    "Proprioceptive": "approximation and input to modulate sensory processing"
};

// --- SKILLED DESCRIPTOR MAP ---
// Maps short keys to full audit-proof clinical phrases
export const SKILLED_MAP: Record<string, string> = {
  // Original
  "dynamic balance": "impaired dynamic balance during multi-directional movement",
  "functional reach": "decreased functional reach outside base of support",
  "visual-spatial processing": "deficits in visual-spatial processing",
  "hip flexion ROM": "restricted hip flexion ROM limiting lower extremity access",
  "static postural stability": "decreased static postural stability requiring external support",
  "bilateral coordination": "impaired bilateral upper extremity coordination",
  "safety awareness": "inconsistent safety awareness regarding fall risks",
  "motor planning": "impaired motor planning (praxis) for sequencing movements",
  "eccentric control": "poor eccentric control during antigravity descent",
  "core stability": "insufficient core stability to maintain midline",
  "motor unit recruitment": "inefficient motor unit recruitment in target musculature",
  "length-tension relationship": "suboptimal length-tension relationships",
  "capsular restriction": "capsular restriction limiting physiological range",
  "proprioception": "impaired proprioceptive feedback for joint positioning",
  "reactive postural control": "delayed reactive postural control strategies",
  "standing endurance": "decreased standing endurance affecting activity tolerance",
  "sequencing": "deficits in cognitive sequencing of multi-step tasks",
  "dynamic sitting balance": "impaired dynamic sitting balance",
  "fine motor coordination": "decreased fine motor coordination/dexterity",
  "tactile discrimination": "impaired tactile discrimination",
  "environmental sequencing": "difficulty sequencing environmental barriers",
  "gluteal activation": "delayed gluteal activation",
  "righting reactions": "delayed righting reactions",
  "grip strength": "decreased grip strength",
  "reciprocal patterning": "loss of reciprocal gait patterning",
  "concentric control": "decreased concentric control against gravity",
  "muscle guarding": "protective muscle guarding limiting active motion",
  "muscular endurance": "decreased local muscular endurance",
  "soft tissue extensibility": "restricted soft tissue extensibility",
  "joint arthrokinematics": "altered joint arthrokinematics",
  "pain modulation": "need for pain modulation techniques",
  "vestibular processing": "impaired vestibular processing",
  "ankle stability": "decreased ankle stability strategies",
  "bilateral integration": "difficulty crossing midline and bilateral integration",
  "kinesthetic awareness": "decreased kinesthetic awareness of limb position",
  "movement fluidity": "segmented movement patterns lacking fluidity",

  // New & Enhanced
  "decreased activity tolerance": "notable decrease in activity tolerance evidenced by increased respiratory rate and fatigue",
  "decreased upper extremity strength": "decreased upper extremity strength limiting functional participation",
  "atmospheric/environmental barriers": "environmental/atmospheric barriers affecting sensory processing",
  "contracture risk": "risk of soft tissue contracture requires skilled positioning",
  "load management": "unsafe mechanics during load management",

  // Manual Therapy
  "fascial restriction": "myofascial restrictions limiting tissue mobility",
  "edema management": "distal edema limiting range of motion",
  "lymphatic flow": "impaired lymphatic return",
  "scapulohumeral rhythm": "altered scapulohumeral rhythm",

  // Cognitive
  "divided attention": "impaired divided attention during safety monitoring",
  "cognitive endurance": "decreased cognitive endurance for sustained tasks",
  "attentional capacity": "decreased attentional capacity affecting task persistence",
  "task persistence": "inability to persist in goal-directed activity",
  "complex sequencing": "deficits in complex sequencing of IADLs",
  "abstract reasoning": "impaired abstract reasoning for problem solving",
  "time management": "deficits in time management and estimation",
  "higher-level calculation": "acalculia affecting financial management",

  // Wheelchair
  "scapular stability": "decreased scapular stability for propulsion efficiency",
  "trunk control": "impaired trunk control during dynamic weight shifts",
  "maneuverability": "difficulty maneuvering device in tight spaces",
  "skin integrity risk": "high risk for skin breakdown requiring pressure relief training",
  "postural alignment": "asymmetrical postural alignment requiring correction",
  "sitting balance": "impaired static sitting balance in wheelchair",

  // Gait
  "antalgic pattern": "antalgic gait pattern secondary to pain",
  "decreased stance time": "decreased stance time on affected limb",
  "hip flexor weakness": "hip flexor weakness impacting swing phase initiation",
  "foot clearance deficit": "impaired foot clearance increasing trip risk",
  "dynamic instability": "dynamic instability during turns",
  "vestibular dysfunction": "vestibular dysfunction affecting gaze stabilization",
  "balance confidence": "reduced balance confidence on uneven surfaces",

  // Orthotics
  "risk of breakdown": "high risk for skin breakdown at pressure points",
  "sensation impairment": "impaired protective sensation",
  
  "joint deformity": "progressing joint deformity requiring support",
  "fine motor deficit": "fine motor deficits limiting independent doffing",
  "cognitive retention": "deficits in cognitive retention of wear schedule",
  "insight into condition": "limited insight into need for device usage",

  // Sensory
  "hypersensitivity": "tactile hypersensitivity limiting functional use",
  "allodynia": "allodynia affecting ADL participation",
  "neuroma pain": "neuroma-related pain requiring desensitization",
  "sensory organization": "disordered sensory organization",
  "cortical sensory loss": "cortical sensory loss affecting object recognition",
  "tactile agnosia": "tactile agnosia (astereognosis)",
  "peripheral neuropathy": "distal peripheral neuropathy",
  "sensory mapping deficit": "impaired somatosensory mapping",
  
  // New Categories (Balance, IADL, Vision)
  "somatosensory integration": "poor somatosensory integration for balance",
  "base of support management": "inability to maintain balance within narrowed base of support",
  "center of gravity control": "loss of center of gravity control at limits of stability",
  "ankle strategies": "absence of effective ankle strategies for balance recovery",
  "gaze stabilization": "impaired gaze stabilization (VOR) during head movement",
  "oscillopsia": "reports of oscillopsia interfering with function",
  "visual-vestibular mismatch": "visual-vestibular mismatch causing dizziness",
  "dizziness handicap": "significant functional limitations due to dizziness",
  "task sequencing": "inability to sequence multi-step meal preparation",
  "functional endurance": "decreased functional endurance for home management tasks",
  
  "problem solving": "deficits in problem solving during novel tasks",
  "visual tracking": "impaired smooth pursuits and visual tracking",
  "oculomotor fatigue": "rapid onset of oculomotor fatigue",
  "diplopia": "diplopia affecting depth perception",
  "visual fusion": "impaired visual fusion and binocular integration",
  "visual discrimination": "difficulty with visual discrimination of objects",
  "visual clutter processing": "inability to process information in visual clutter",
  "unilateral neglect": "unilateral spatial neglect affecting safety",
  "visual field cut": "compensatory deficits related to visual field cut",

  // NEW ADL & THER ACT DEFS
  "hand-to-mouth coordination": "deficient hand-to-mouth coordination for self-feeding",
  "crossing midline": "inability to cross midline during ADLs",
  "shoulder ROM": "limited shoulder range of motion affecting reach",
  "visual-motor integration": "impaired visual-motor integration",
  "tripod grasp": "immature or weak tripod grasp",
  "forearm supination": "limited forearm supination for utensil use",
  "grading force": "difficulty grading force modulation",
  "wrist stability": "decreased wrist stability during load",
  "trunk rotation": "limited trunk rotation limiting reach",
  "standing tolerance": "decreased standing tolerance during ADL tasks",
  "pincer grasp": "impaired pincer grasp for small items",
  "finger isolation": "poor finger isolation",
  "in-hand manipulation": "difficulty with in-hand manipulation (translation/rotation)",
  "scapular endurance": "decreased scapular endurance during sustained reach",
  "visual scanning": "impaired visual scanning of environment"
};

// --- SOPHISTICATED NARRATIVE VOCABULARY ---
export const NARRATIVE_VOCAB = {
    // Verbs describing patient action
    patient_verbs: [
        "engaged in", 
        "navigated", 
        "executed", 
        "completed", 
        "participated in",
        "demonstrated",
        "performed"
    ],
    // Verbs describing therapist action
    therapist_verbs: [
        "facilitated",
        "guided",
        "instructed",
        "corrected",
        "modulated",
        "intervened with"
    ],
    // Transitions / Justifications
    connectors: {
        cause: ["secondary to", "stemming from", "exacerbated by", "related to", "in the context of"],
        effect: ["necessitating", "warranting", "requiring", "indicating need for"],
        goal: ["to ameliorate", "to optimize", "to restore", "to enhance", "to mitigate", "to remediate"]
    },
    // Adjectives/Adverbs
    descriptors: [
        "significant",
        "persistent",
        "notable",
        "variable",
        "demonstrable"
    ]
};

// Legacy support
export const CONNECTORS = {
  physical: ["to facilitate", "to promote", "to assist with", "to enable"],
  cognitive: ["to address", "due to", "to correct", "to mitigate"],
  safety: ["to ensure safety during", "to mitigate risk of", "given high risk for"],
  deduplication: ["secondary to", "resulting from", "limited by", "complicated by", "in the context of"]
};
