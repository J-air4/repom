import React, { useState, useEffect } from 'react';
import { CLINICAL_DATA, SKILLED_MAP, NARRATIVE_VOCAB, CUE_CONTEXT_MAP } from './constants';
import { ClinicalActivity, Phase, Subtask, SelectionUnit, ViewState, GroupedUnit, SessionVitals, ProgressType } from './types';

// --- TYPES ---
interface SavedSession {
  id: string;
  timestamp: string;
  preview: string;
  text: string;
}

const CUE_FOCUS_OPTIONS = [
    "Safety", "Sequencing", "Technique", "Balance", "Insight", 
    "Attention", "Initiation", "Motor Planning", "Problem Solving", "Quality of Mvmt"
];

// --- CONCISE NARRATIVE ENGINE ---

const generateNarrative = (selections: SelectionUnit[], vitals: SessionVitals, cptMinutes: Record<string, string>, progress: ProgressType): string => {
  if (selections.length === 0) return "No data entered.";

  // 1. Physiological Vitals (Start)
  const physParts = [];
  if (vitals.bp) physParts.push(`BP ${vitals.bp}`);
  if (vitals.hr) physParts.push(`HR ${vitals.hr}`);
  if (vitals.rr) physParts.push(`RR ${vitals.rr}`);
  if (vitals.o2) physParts.push(`O2 ${vitals.o2}%`);
  
  const physVitals = physParts.length > 0 ? `Baseline vitals: ${physParts.join(", ")}.` : "";

  // 2. CPT Grouping Logic
  const cptGroups: Record<string, SelectionUnit[]> = {};
  selections.forEach(s => {
      if (!cptGroups[s.cpt]) cptGroups[s.cpt] = [];
      cptGroups[s.cpt].push(s);
  });

  const bodyParagraphs = Object.entries(cptGroups).map(([cpt, units]) => {
      const minutes = cptMinutes[cpt] ? `(${cptMinutes[cpt]} mins)` : '';
      const activityLabel = units[0].activity.split(" (")[0]; // Clean label
      
      // Internal grouping by phase/assist within CPT
      const groups: Record<string, GroupedUnit> = units.reduce((acc, unit) => {
        // Use params in key so different params don't get merged weirdly
        const key = `${unit.phase}-${unit.assist}-${unit.deficits.join('|')}-${unit.params || ''}`;
        if (!acc[key]) {
          acc[key] = {
            phase: unit.phase,
            assist: unit.assist,
            tasks: [],
            cues: [],
            deficits: [],
            isOutcome: !!unit.outcome
          };
        }
        const taskDisplay = unit.params ? `${unit.task} (${unit.params})` : unit.task;
        if (!acc[key].tasks.includes(taskDisplay)) acc[key].tasks.push(taskDisplay);
        unit.cues.forEach(c => { if (!acc[key].cues.includes(c)) acc[key].cues.push(c); });
        unit.deficits.forEach(d => { if (!acc[key].deficits.includes(d)) acc[key].deficits.push(d); });
        return acc;
      }, {} as Record<string, GroupedUnit>);

      const sentences = Object.values(groups).map((group, i) => {
        const taskList = group.tasks.join(", ");
        const assist = group.assist;
        
        // Map deficits
        const deficitList = group.deficits.map(d => SKILLED_MAP[d] || d);
        let deficitString = "";
        if (deficitList.length === 0) {
            deficitString = "functional deficits";
        } else if (deficitList.length === 1) {
            deficitString = deficitList[0];
        } else if (deficitList.length === 2) {
             deficitString = `${deficitList[0]} and ${deficitList[1]}`;
        } else {
             deficitString = `${deficitList.slice(0, -1).join(", ")}, and ${deficitList.slice(-1)}`;
        }

        // Add descriptor occasionally
        const descriptor = NARRATIVE_VOCAB.descriptors[i % NARRATIVE_VOCAB.descriptors.length];
        const qualifiedDeficit = (i % 2 === 0) ? `${descriptor} ${deficitString}` : deficitString;

        // Connectors
        const cause = NARRATIVE_VOCAB.connectors.cause[i % NARRATIVE_VOCAB.connectors.cause.length];
        const effect = NARRATIVE_VOCAB.connectors.effect[i % NARRATIVE_VOCAB.connectors.effect.length];
        const goal = NARRATIVE_VOCAB.connectors.goal[i % NARRATIVE_VOCAB.connectors.goal.length];

        // Process Cues
        let cueSegment = "";
        if (group.cues.length > 0) {
            const cuePhrases = group.cues.map(c => {
                if (c.includes("(")) {
                    const parts = c.split(" (");
                    const main = parts[0]; 
                    const rawFocus = parts[1].replace(")", ""); 
                    const focusArray = rawFocus.split(", ");
                    let focusText = "";
                    if (focusArray.length === 1) {
                        focusText = focusArray[0].toLowerCase();
                    } else if (focusArray.length === 2) {
                        focusText = `${focusArray[0].toLowerCase()} and ${focusArray[1].toLowerCase()}`;
                    } else {
                        const last = focusArray.pop();
                        focusText = `${focusArray.join(", ").toLowerCase()}, and ${last?.toLowerCase()}`;
                    }
                    return `${main} cues for ${focusText}`;
                }
                return `${c} cues`;
            });
            cueSegment = cuePhrases.join("; ");
        }

        // Varied Sentence Generators
        const pVerb = NARRATIVE_VOCAB.patient_verbs[i % NARRATIVE_VOCAB.patient_verbs.length];
        const tVerb = NARRATIVE_VOCAB.therapist_verbs[i % NARRATIVE_VOCAB.therapist_verbs.length];
        
        // Helper to attach cues naturally
        const attachCues = (base: string, style: 'comma' | 'separate' | 'necessitating') => {
            if (!cueSegment) return base + ".";
            if (style === 'comma') return `${base}, requiring ${cueSegment}.`;
            if (style === 'necessitating') return `${base}, necessitating ${cueSegment}.`;
            return `${base}. Required ${cueSegment}.`;
        };

        // 6 Different Sentence Structures for Flow
        switch (i % 6) {
            case 0:
                // Standard: Patient [Verb] [Task] [Assist] [Cause] [Deficit]
                return attachCues(`Patient ${pVerb} ${taskList} with ${assist} ${cause} ${qualifiedDeficit}`, 'comma');
            
            case 1:
                // Therapist-First: [Therapist Verb] [Task] [Goal] [Deficit]
                return attachCues(`${tVerb} ${taskList} ${goal} ${deficitString}; patient demonstrated ${assist} performance`, 'separate');
            
            case 2:
                // Inverted Deficit: [Deficit] [Effect] [Assist]
                return attachCues(`${qualifiedDeficit} ${effect} ${assist} during ${taskList}`, 'separate');
            
            case 3:
                // Action-Result: [Task] completed with [Assist] due to [Deficit]
                return attachCues(`${taskList} completed with ${assist} ${cause} ${qualifiedDeficit}`, 'necessitating');
            
            case 4:
                // Intervention Focus: Intervention targeted [Deficit] via [Task]
                return attachCues(`Intervention targeted ${deficitString} via ${taskList}, where patient required ${assist}`, 'comma');
            
            case 5:
                // Navigation/Execution: Patient executed [Task]
                return attachCues(`Patient executed ${taskList} with ${assist}, as ${qualifiedDeficit} limited independence`, 'separate');
            
            default:
                return attachCues(`Patient performed ${taskList} with ${assist}`, 'comma');
        }
      });

      return `\n\n${cpt} ${activityLabel} ${minutes}: ${sentences.join(" ")}`;
  });

  // 3. Clinical Assessment (The "So What?" Factor)
  
  // Calculate Statistics
  const allAssist = selections.map(s => s.assist);
  const assistCounts: Record<string, number> = {};
  allAssist.forEach(l => { assistCounts[l] = (assistCounts[l] || 0) + 1; });
  const modeAssist = Object.keys(assistCounts).length ? Object.keys(assistCounts).reduce((a, b) => assistCounts[a] > assistCounts[b] ? a : b) : "N/A";

  const allDeficits = selections.flatMap(s => s.deficits);
  const deficitCounts: Record<string, number> = {};
  allDeficits.forEach(d => { deficitCounts[d] = (deficitCounts[d] || 0) + 1; });
  const topDeficitKey = Object.keys(deficitCounts).length ? Object.keys(deficitCounts).reduce((a, b) => deficitCounts[a] > deficitCounts[b] ? a : b) : null;
  
  const cleanDeficit = topDeficitKey ? (SKILLED_MAP[topDeficitKey] || topDeficitKey) : "functional deficits";
  
  const activityCounts: Record<string, number> = {};
  selections.forEach(s => { activityCounts[s.activity] = (activityCounts[s.activity] || 0) + 1; });
  const topActivityKey = Object.keys(activityCounts).length ? Object.keys(activityCounts).reduce((a, b) => activityCounts[a] > activityCounts[b] ? a : b) : "functional tasks";
  const cleanActivity = topActivityKey.split(" (")[0];

  let assessment = "";
  
  // Logic Branch: Trend -> Assist Level -> Clinical Justification
  if (progress === 'Declined') {
      assessment = `Assessment: Patient demonstrated a decline in ${cleanActivity} performance versus baseline, primarily exacerbated by ${cleanDeficit}. Session required pivot to safety instruction and compensatory strategies, with patient requiring ${modeAssist} to maintain safety.`;
  } else if (progress === 'Maintained') {
      if (['Dep', 'Max A', 'Mod A'].includes(modeAssist)) {
          assessment = `Assessment: Functional status maintained during ${cleanActivity}. Patient continues to require ${modeAssist} secondary to ${cleanDeficit}, necessitating skilled intervention to prevent complications and ensure positioning.`;
      } else if (['Min A', 'CGA', 'SBA'].includes(modeAssist)) {
          assessment = `Assessment: Patient maintained baseline during ${cleanActivity}. ${cleanDeficit} remains the primary limiting factor, requiring skilled cues to ensure carryover of techniques and prevent regression.`;
      } else {
          assessment = `Assessment: Patient maintained baseline functional status in ${cleanActivity}. Focus remains on consistency and building endurance to mitigate ${cleanDeficit}.`;
      }
  } else { // Improved
      if (['Min A', 'CGA', 'SBA'].includes(modeAssist)) {
          assessment = `Assessment: Patient displayed improved functional tolerance during ${cleanActivity}. Reduced impact of ${cleanDeficit} allowed for greater independence, though ${modeAssist} remains indicated to ensure safety.`;
      } else if (modeAssist === 'Mod I' || modeAssist === 'Indep') {
           assessment = `Assessment: Patient improved from baseline in ${cleanActivity}, demonstrating increased efficiency. Focus remains on refining mechanics and generalizing skills to novel environments to fully address ${cleanDeficit}.`;
      } else {
           assessment = `Assessment: Patient improved participation in ${cleanActivity}. While ${modeAssist} is still required, patient demonstrated improved motor planning and effort, specifically regarding ${cleanDeficit}.`;
      }
  }

  // 4. Tolerance & Pain (Dynamic Integration)
  let tolerance = "Patient tolerated session well.";
  if (vitals.pain) {
      const p = parseInt(vitals.pain);
      if (p > 3) {
           tolerance = `Patient tolerated session with fair endurance; pain reported at ${p}/10 requiring frequent rest breaks.`;
      } else {
           tolerance = `Patient tolerated session well with pain controlled at ${p}/10.`;
      }
  }

  // Combine Sections
  return [physVitals, ...bodyParagraphs, assessment, tolerance]
    .filter(s => s.trim().length > 0)
    .join(" ");
};


// --- APP COMPONENT ---

export default function App() {
  // State Machine
  const [view, setView] = useState<ViewState>('PHASE');
  const [currentActivity, setCurrentActivity] = useState<ClinicalActivity>(CLINICAL_DATA.SELF_CARE);
  
  // Clinical Data State
  const [selections, setSelections] = useState<SelectionUnit[]>([]);
  const [vitals, setVitals] = useState<SessionVitals>({ bp: '', hr: '', rr: '', o2: '', pain: '' });
  const [cptMinutes, setCptMinutes] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<ProgressType>('Maintained');
  
  const [history, setHistory] = useState<SelectionUnit[][]>([]);
  const [future, setFuture] = useState<SelectionUnit[][]>([]);
  
  // Session History
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // UI State
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [activePhase, setActivePhase] = useState<Phase | null>(null);
  const [activeSubtask, setActiveSubtask] = useState<Subtask | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string>("COPY TO CLIPBOARD");

  // Matrix State (Inputs)
  const [tempAssist, setTempAssist] = useState<string>('');
  const [tempDeficits, setTempDeficits] = useState<string[]>([]); // Multi-select
  const [customDeficit, setCustomDeficit] = useState<string>(''); 
  const [tempParams, setTempParams] = useState<string>(''); 
  
  // Matrix State (Cues)
  const [cueType, setCueType] = useState<string>('Verbal');
  const [cueLevel, setCueLevel] = useState<string>('Min');
  const [cueFocuses, setCueFocuses] = useState<string[]>(['Safety']); // Multi-select for Focus
  const [addedCues, setAddedCues] = useState<string[]>([]);
  
  // Review State
  const [noteText, setNoteText] = useState<string>('');

  // --- Handlers ---

  const updateSelections = (newSelections: SelectionUnit[]) => {
    setHistory(prev => [...prev, selections]);
    setSelections(newSelections);
    setFuture([]); 
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setFuture(prev => [selections, ...prev]);
    setSelections(previous);
    setHistory(prev => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory(prev => [...prev, selections]);
    setSelections(next);
    setFuture(prev => prev.slice(1));
  };

  const handleNewSession = () => {
      if (view === 'REVIEW' && noteText) {
          const summary = selections.slice(0, 3).map(s => s.task).join(", ") + (selections.length > 3 ? "..." : "");
          const newSession: SavedSession = {
              id: Date.now().toString(),
              timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              preview: summary || "Unnamed Session",
              text: noteText
          };
          setSavedSessions(prev => [newSession, ...prev]);
      } else if (selections.length > 0) {
          if (!window.confirm("Discard current session data?")) return;
      }

      setSelections([]);
      setVitals({ bp: '', hr: '', rr: '', o2: '', pain: '' });
      setCptMinutes({});
      setProgress('Maintained');
      setHistory([]);
      setFuture([]);
      setNoteText('');
      setTempAssist('');
      setTempDeficits([]);
      setCustomDeficit('');
      setTempParams('');
      setAddedCues([]);
      setCueFocuses(['Safety']);
      setView('PHASE');
      setCopyFeedback("COPY TO CLIPBOARD");
      setActivePhase(null);
      setActiveSubtask(null);
      setCurrentActivity(CLINICAL_DATA.SELF_CARE); 
  };

  const toggleCueFocus = (focus: string) => {
      setCueFocuses(prev => {
          if (prev.includes(focus)) return prev.filter(f => f !== focus);
          return [...prev, focus];
      });
  };

  const handleAddCue = () => {
      // Create string: "Min Verbal (Safety, Sequencing)"
      const focusString = cueFocuses.join(", ");
      const cueString = `${cueLevel} ${cueType} (${focusString})`;
      if (!addedCues.includes(cueString)) {
          setAddedCues(prev => [...prev, cueString]);
      }
      // Reset focus slightly for workflow? No, keep stickiness for speed.
  };

  const removeCue = (cue: string) => {
      setAddedCues(prev => prev.filter(c => c !== cue));
  };

  const toggleDeficit = (def: string) => {
      setTempDeficits(prev => {
          if (prev.includes(def)) return prev.filter(d => d !== def);
          return [...prev, def];
      });
  };

  const handleConfirmMatrix = () => {
    if (!activePhase || !activeSubtask) return;

    // Merge custom deficit if present
    const finalDeficits = [...tempDeficits];
    if (customDeficit) finalDeficits.push(customDeficit);

    const unit: SelectionUnit = {
      activity: currentActivity.label,
      cpt: currentActivity.cpt,
      phase: activePhase.name,
      task: activeSubtask.name,
      assist: tempAssist,
      cues: addedCues, 
      deficits: finalDeficits,
      params: tempParams || undefined
    };

    updateSelections([...selections, unit]);
    
    // Reset Matrix
    setTempAssist('');
    setTempDeficits([]);
    setCustomDeficit('');
    setTempParams('');
    setAddedCues([]);
    setCueFocuses(['Safety']);
    setView('SUBTASK');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
        setCopyFeedback("COPIED!");
        setTimeout(() => setCopyFeedback("COPY TO CLIPBOARD"), 3000);
    });
  };

  const handleEnterReview = () => {
    const draft = generateNarrative(selections, vitals, cptMinutes, progress);
    setNoteText(draft);
    setView('REVIEW');
  };

  // Auto-update note when meta-fields change in review view
  useEffect(() => {
    if (view === 'REVIEW') {
         const draft = generateNarrative(selections, vitals, cptMinutes, progress);
         setNoteText(draft);
    }
  }, [cptMinutes, progress]);

  const handleVitalsChange = (field: keyof SessionVitals, value: string) => {
    setVitals(prev => ({ ...prev, [field]: value }));
  };

  // --- Render Helpers ---
  
  const commonTileStyle = "bg-white border border-[#D1D5DB] rounded flex items-center justify-center text-center cursor-pointer hover:border-[#F9D71C] transition-colors shadow-sm text-[#1A1A1A] font-medium leading-tight";
  
  // Compact Button Styles
  const btnBase = "py-2 px-1 text-xs border rounded transition-all truncate hover:bg-gray-50";
  const btnActive = "bg-[#FFFBEB] border-[#F9D71C] font-bold shadow-sm text-black";

  // CPT Categories to Hide
  const HIDDEN_CPTS = ['COGNITIVE', 'VISION', 'IADL', 'BALANCE', 'SENSORY', 'GAIT'];

  return (
    <div className="h-screen flex flex-col bg-[#F5F5F5] text-[#1A1A1A] overflow-hidden relative font-inter">
      
      {/* HISTORY MODAL */}
      {showHistoryModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded shadow-2xl w-full max-w-xl h-[70vh] flex flex-col animate-in zoom-in-95 duration-150">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-bold">Session History</h3>
                    <button onClick={() => setShowHistoryModal(false)} className="text-gray-500 hover:text-black">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {savedSessions.length === 0 ? (
                        <div className="text-center text-gray-500 text-sm mt-10">No saved sessions yet.</div>
                    ) : (
                        savedSessions.map(session => (
                            <div key={session.id} className="border rounded p-3 bg-gray-50 hover:bg-white transition-all">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">{session.timestamp}</span>
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(session.text)}
                                        className="text-[10px] font-bold border border-black px-2 py-0.5 rounded hover:bg-black hover:text-white"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-3 font-mono">{session.text}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}

      {/* VITALS MODAL */}
      {showVitalsModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-start justify-center pt-10">
            <div className="bg-white rounded shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-150">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Session Vitals</h3>
                    <button onClick={() => setShowVitalsModal(false)} className="text-gray-500 hover:text-black">✕</button>
                </div>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        {['bp', 'hr', 'o2', 'rr'].map(f => (
                            <div key={f}>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{f.toUpperCase()}</label>
                                <input 
                                    className="w-full border p-2 rounded text-sm outline-none focus:border-[#F9D71C]"
                                    value={vitals[f as keyof SessionVitals]} 
                                    onChange={e => handleVitalsChange(f as keyof SessionVitals, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Pain (0-10)</label>
                        <div className="flex gap-1">
                             {[0, 2, 4, 6, 8, 10].map(p => (
                                 <button
                                    key={p}
                                    onClick={() => handleVitalsChange('pain', p.toString())}
                                    className={`flex-1 py-1 rounded text-xs border ${vitals.pain === p.toString() ? 'bg-red-100 border-red-500 font-bold text-red-700' : 'bg-gray-50 hover:bg-gray-100'}`}
                                 >
                                    {p}
                                 </button>
                             ))}
                        </div>
                    </div>
                </div>
                <button onClick={() => setShowVitalsModal(false)} className="w-full mt-4 bg-black text-white py-2 rounded font-bold text-sm">DONE</button>
            </div>
        </div>
      )}

      {/* HEADER */}
      <header className="h-14 bg-white border-b border-[#D1D5DB] flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex gap-2 overflow-x-auto no-scrollbar items-center">
          {Object.values(CLINICAL_DATA)
            .filter(activity => !HIDDEN_CPTS.includes(activity.id))
            .map((activity) => (
            <button
              key={activity.id}
              onClick={() => { setCurrentActivity(activity); setView('PHASE'); }}
              className={`px-3 py-1.5 rounded text-xs whitespace-nowrap transition-all ${
                currentActivity.id === activity.id 
                  ? "bg-[#F9D71C] border border-black font-bold shadow-sm" 
                  : "bg-white border border-[#D1D5DB] text-gray-600 hover:bg-gray-50"
              }`}
            >
              {activity.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3 shrink-0 ml-4">
            <button onClick={() => setShowHistoryModal(true)} className="flex items-center gap-1 text-gray-600 hover:text-black">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
            </button>
            <button 
                onClick={() => setShowVitalsModal(true)}
                className={`text-xs font-bold px-2 py-1 rounded border ${vitals.bp || vitals.pain ? "bg-red-50 border-red-200 text-red-700" : "bg-white border-gray-200 text-gray-600"}`}
            >
               {vitals.bp ? "Vitals ✓" : "Vitals +"}
            </button>
            <div className="flex items-center bg-gray-100 rounded border border-gray-200">
                <button onClick={handleUndo} disabled={history.length === 0} className="p-1.5 text-gray-600 hover:bg-white rounded disabled:opacity-30">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                </button>
                <div className="w-px h-3 bg-gray-300"></div>
                <button onClick={handleRedo} disabled={future.length === 0} className="p-1.5 text-gray-600 hover:bg-white rounded disabled:opacity-30">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>
                </button>
            </div>
            <div className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold">
                {selections.length}
            </div>
        </div>
      </header>

      {/* MAIN STAGE */}
      <main className="flex-1 flex flex-col justify-center items-center p-4 w-full max-w-6xl mx-auto">
        
        {/* PHASE SELECT */}
        {view === 'PHASE' && (
          <div className="grid grid-cols-2 gap-4 w-full max-w-2xl animate-in fade-in duration-200">
            {currentActivity.phases.map(phase => (
              <button
                key={phase.id}
                onClick={() => { setActivePhase(phase); setView('SUBTASK'); }}
                className={`${commonTileStyle} h-24 text-lg`}
              >
                {phase.name}
              </button>
            ))}
          </div>
        )}

        {/* SUBTASK SELECT */}
        {view === 'SUBTASK' && activePhase && (
          <div className="w-full max-w-4xl flex flex-col h-full">
            <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">{activePhase.name}</h2>
                <button onClick={() => setView('PHASE')} className="text-xs text-gray-500 hover:text-black underline">Back</button>
            </div>
            <div className="grid grid-cols-3 gap-3 auto-rows-[80px] overflow-y-auto pb-10">
              {activePhase.subtasks.map(subtask => {
                const isLogged = selections.some(s => s.task === subtask.name && s.activity === currentActivity.label);
                return (
                  <button
                    key={subtask.name}
                    onClick={() => { setActiveSubtask(subtask); setView('MATRIX'); }}
                    className={`${commonTileStyle} relative text-sm p-2 ${isLogged ? 'border-green-500 bg-green-50' : ''}`}
                  >
                    {subtask.name}
                    {isLogged && <span className="absolute top-1 right-1 text-green-600 text-[10px]">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* COMPACT MATRIX (UPDATED) */}
        {view === 'MATRIX' && activeSubtask && (
          <div className="w-full max-w-4xl bg-white border border-[#F9D71C] rounded shadow-xl flex flex-col animate-in zoom-in-95 duration-150 overflow-hidden">
            
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-base font-bold text-gray-900">{activeSubtask.name.toUpperCase()}</h3>
                <button onClick={() => setView('SUBTASK')} className="text-gray-400 hover:text-red-500 font-bold text-sm">✕</button>
            </div>

            <div className="flex-1 grid grid-cols-2 divide-x divide-gray-100">
                
                {/* LEFT: PHYSICAL PERFORMANCE */}
                <div className="p-4 space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Physical Performance</h4>
                    
                    {/* Assist Level */}
                    <div>
                        <label className="text-[10px] text-gray-500 font-semibold mb-1 block">ASSIST LEVEL</label>
                        <div className="grid grid-cols-4 gap-1">
                            {["Mod I", "CGA", "SBA", "Min A", "Mod A", "Max A", "Dep"].map(level => (
                                <button
                                    key={level}
                                    onClick={() => setTempAssist(level)}
                                    className={`${btnBase} ${tempAssist === level ? btnActive : "bg-white border-gray-200"}`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Limiting Factor (Deficit) - MULTI SELECT */}
                    <div>
                        <label className="text-[10px] text-gray-500 font-semibold mb-1 block">LIMITING FACTOR (Multi)</label>
                        <div className="grid grid-cols-2 gap-1 mb-2">
                            {activeSubtask.deficits.map(def => (
                                <button
                                    key={def}
                                    onClick={() => toggleDeficit(def)}
                                    className={`${btnBase} ${tempDeficits.includes(def) ? btnActive : "bg-white border-gray-200"}`}
                                >
                                    {def}
                                </button>
                            ))}
                        </div>
                        <input 
                            type="text" placeholder="Custom Factor..." 
                            value={customDeficit}
                            onChange={(e) => setCustomDeficit(e.target.value)}
                            className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#F9D71C] bg-gray-50"
                        />
                    </div>

                    {/* Params (Conditional) */}
                    {currentActivity.cpt === '97110' && (
                        <div>
                            <label className="text-[10px] text-gray-500 font-semibold mb-1 block">PARAMETERS</label>
                            <input 
                                type="text" placeholder="e.g. 2x10 Reps" 
                                value={tempParams} onChange={e => setTempParams(e.target.value)}
                                className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#F9D71C]"
                            />
                        </div>
                    )}
                </div>

                {/* RIGHT: SKILLED INPUT */}
                <div className="p-4 space-y-4 bg-gray-50/30">
                    <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Skilled Instruction</h4>
                        {/* AUDIT WARNING */}
                        {tempAssist === 'Mod I' && addedCues.length > 0 && (
                            <span className="text-[10px] text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded border border-red-200">
                                ⚠ AUDIT WARNING: Mod I = No Cues
                            </span>
                        )}
                    </div>
                    
                    {/* Cue Builder */}
                    <div className="space-y-3 p-3 bg-white border border-gray-200 rounded">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] text-gray-500 block mb-1">LEVEL</label>
                                <select className="w-full text-xs border rounded p-1" value={cueLevel} onChange={e => setCueLevel(e.target.value)}>
                                    <option>Min</option><option>Mod</option><option>Max</option><option>Tactile</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 block mb-1">TYPE</label>
                                <select className="w-full text-xs border rounded p-1" value={cueType} onChange={e => setCueType(e.target.value)}>
                                    <option>Verbal</option><option>Visual</option><option>Tactile</option><option>Demo</option>
                                </select>
                            </div>
                        </div>
                        
                        {/* MULTI-SELECT FOCUS */}
                        <div>
                            <label className="text-[10px] text-gray-500 block mb-1">FOCUS (Select all that apply)</label>
                            <div className="grid grid-cols-3 gap-1">
                                {CUE_FOCUS_OPTIONS.map(f => (
                                    <button
                                        key={f}
                                        onClick={() => toggleCueFocus(f)}
                                        className={`text-[10px] px-1 py-1.5 rounded border ${cueFocuses.includes(f) ? 'bg-black text-white border-black font-bold' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleAddCue}
                            className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-bold rounded border border-gray-300 transition-colors mt-2"
                        >
                            ADD CUE +
                        </button>
                    </div>

                    {/* Added Cues List */}
                    <div className="min-h-[60px]">
                        <label className="text-[10px] text-gray-500 font-semibold mb-1 block">LOGGED CUES</label>
                        <div className="flex flex-wrap gap-2">
                            {addedCues.length === 0 && <span className="text-xs text-gray-400 italic">No cues selected.</span>}
                            {addedCues.map((c, i) => (
                                <span key={i} className="bg-white border border-gray-200 text-xs px-2 py-1 rounded flex items-center gap-2 shadow-sm">
                                    {c}
                                    <button onClick={() => removeCue(c)} className="text-red-400 hover:text-red-600 font-bold">×</button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
                <button 
                    onClick={() => setView('SUBTASK')}
                    className="px-6 py-2 bg-white border border-gray-300 text-gray-600 font-bold rounded text-sm hover:bg-gray-100"
                >
                    CANCEL
                </button>
                <button 
                    onClick={handleConfirmMatrix}
                    disabled={!tempAssist || (tempDeficits.length === 0 && !customDeficit)}
                    className={`flex-1 py-2 rounded font-bold text-sm shadow-sm transition-all ${
                        !tempAssist || (tempDeficits.length === 0 && !customDeficit) 
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                        : "bg-[#1A1A1A] text-white hover:bg-black"
                    }`}
                >
                    CONFIRM UNIT
                </button>
            </div>
          </div>
        )}

        {/* REVIEW VIEW */}
        {view === 'REVIEW' && (
            <div className="w-full max-w-4xl bg-white border border-[#D1D5DB] rounded p-6 shadow-sm h-full max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">Session Narrative</h2>
                    <div className="flex gap-2">
                         <button onClick={() => setView('PHASE')} className="text-xs font-bold underline">Edit</button>
                         <button 
                             onClick={handleNewSession}
                             className="text-xs text-red-600 font-bold hover:bg-red-50 border border-red-200 px-2 py-1 rounded"
                         >
                            Reset
                         </button>
                    </div>
                </div>

                {/* Action Plan Inputs */}
                <div className="bg-gray-50 p-3 rounded mb-4 border border-gray-200 space-y-3">
                    {/* Time Tracking */}
                    <div className="flex gap-4 overflow-x-auto">
                        {Array.from(new Set(selections.map(s => s.cpt))).map((cpt: string) => (
                            <div key={cpt} className="flex items-center gap-2 bg-white p-1 pr-2 rounded border border-gray-300">
                                <span className="text-[10px] font-bold bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">{cpt}</span>
                                <input 
                                    type="text" 
                                    placeholder="Min"
                                    className="w-10 text-xs text-center border-b border-gray-300 focus:border-black outline-none"
                                    value={cptMinutes[cpt] || ''}
                                    onChange={(e) => setCptMinutes(prev => ({...prev, [cpt]: e.target.value}))}
                                />
                                <span className="text-[10px] text-gray-400">mins</span>
                            </div>
                        ))}
                    </div>
                    
                    {/* Progress Toggle */}
                    <div className="flex items-center gap-2">
                         <span className="text-xs font-bold text-gray-500 uppercase">Change from Baseline:</span>
                         <div className="flex bg-white rounded border border-gray-300 p-0.5">
                             {(['Improved', 'Maintained', 'Declined'] as ProgressType[]).map(p => (
                                 <button
                                    key={p}
                                    onClick={() => setProgress(p)}
                                    className={`px-3 py-1 text-xs rounded transition-all ${progress === p ? 'bg-black text-white font-bold' : 'text-gray-600 hover:bg-gray-100'}`}
                                 >
                                    {p}
                                 </button>
                             ))}
                         </div>
                    </div>
                </div>
                
                <textarea 
                    className="flex-1 w-full p-4 bg-gray-50 border border-gray-200 rounded font-mono text-sm leading-relaxed resize-none focus:outline-none focus:border-[#F9D71C]"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                />

                <div className="mt-4 flex justify-between items-center gap-3">
                    <button
                        onClick={handleNewSession}
                        className="text-xs font-bold text-gray-500 hover:text-black"
                    >
                        Start New Patient (Auto-Saves)
                    </button>
                    <button 
                        onClick={() => copyToClipboard(noteText)}
                        className={`${copyFeedback === "COPIED!" ? "bg-green-600" : "bg-[#1A1A1A] hover:bg-black"} text-white px-6 py-2 rounded font-bold text-sm transition-all shadow-sm`}
                    >
                        {copyFeedback}
                    </button>
                </div>
            </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="h-14 bg-white border-t border-[#D1D5DB] flex items-center justify-center shrink-0 z-10">
        {view !== 'REVIEW' && (
            <button 
                onClick={handleEnterReview}
                className="bg-[#1A1A1A] text-white px-8 py-2 rounded font-bold text-sm hover:bg-black transition-transform active:scale-95 shadow"
            >
                GENERATE NOTE
            </button>
        )}
      </footer>
    </div>
  );
}