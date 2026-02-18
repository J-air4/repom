
export interface Subtask {
  name: string;
  deficits: string[];
}

export interface Phase {
  id: string;
  name: string;
  subtasks: Subtask[];
}

export interface ClinicalActivity {
  id: string;
  label: string;
  cpt: string;
  phases: Phase[];
}

export interface ClinicalData {
  [key: string]: ClinicalActivity;
}

export interface SelectionUnit {
  activity: string; // Tracks the CPT context (e.g., "TherEx", "Self-Care")
  cpt: string; // Explicit CPT for grouping
  phase: string;
  task: string;
  assist: string;
  cues: string[];
  deficits: string[]; // Changed to array for multi-select
  params?: string;
  outcome?: string; // For "Goal-First" logic
}

export interface SessionVitals {
  bp: string;
  hr: string;
  rr: string;
  o2: string;
  pain: string;
}

export type ProgressType = 'Improved' | 'Maintained' | 'Declined';

export type ViewState = 'PHASE' | 'SUBTASK' | 'MATRIX' | 'REVIEW';

export interface GroupedUnit {
  phase: string;
  assist: string;
  tasks: string[];
  cues: string[];
  deficits: string[];
  isOutcome?: boolean;
}
