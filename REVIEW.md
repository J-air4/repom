# Clinical Slate OT — Code Review

## Overview

Clinical Slate OT is a single-screen occupational therapy documentation engine with a context-swapping interface and automated clinical narrative generator. It supports 13 CPT-coded activity categories, hierarchical phase/subtask selection, multi-select deficits, a cue builder, undo/redo, session history, vitals tracking, and auto-generated clinical narratives.

**Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind CSS (CDN)
**Testing:** None
**CI:** None

---

## Architecture Assessment

### Strengths

- **Rich clinical data model:** 13 CPT categories with hierarchical phases and subtasks, each with pre-mapped deficits. The `SKILLED_MAP` provides audit-proof deficit phrasing (100+ entries).
- **Undo/redo system:** Manual history stack implementation (`history[]`, `future[]`) provides reliable undo/redo for selection changes.
- **View state machine:** Clear `PHASE → SUBTASK → MATRIX → REVIEW` flow with explicit `ViewState` type.
- **Cue builder:** Composable cue construction (Level × Type × Focus) with deduplication.
- **Narrative engine:** CPT-grouped paragraphs with 3 sentence structure variations, assist-level-aware assessment generation, and pain/tolerance integration.
- **Audit warning:** Real-time warning when "Mod I" (Modified Independence) is paired with cues — a genuine billing compliance concern.

### File Structure

```
App.tsx          — Entire application: UI, state, handlers, narrative engine (737 lines)
constants.ts     — Clinical data, SKILLED_MAP, NARRATIVE_VOCAB, CUE_CONTEXT_MAP (23.7 KB)
types.ts         — TypeScript interfaces (56 lines)
index.html       — HTML entry with Tailwind CDN and import map
index.tsx        — React entry point
vite.config.ts   — Vite config with API key injection
```

---

## Issues Found

### CRITICAL

#### 1. Import map conflicts with Vite module resolution

`index.html:16-24` defines an import map pointing React/ReactDOM to `esm.sh` CDN. Meanwhile, Vite resolves these from `node_modules`. This creates a dual-module scenario:
- **Dev mode:** Vite's HMR resolves from `node_modules`, but the browser import map may intercept bare specifiers.
- **Production build:** Vite bundles from `node_modules`, but the import map persists in the output HTML, potentially causing double-loading or version mismatches.

**Fix:** Remove the entire `<script type="importmap">` block. Vite handles module resolution.

#### 2. Tailwind CSS loaded via CDN

`index.html:7` loads Tailwind from `https://cdn.tailwindcss.com`. This is [explicitly not recommended for production](https://tailwindcss.com/docs/installation):
- Loads the entire Tailwind runtime (~300KB).
- Generates styles at runtime in the browser (slower page load).
- Requires an active internet connection.
- No tree-shaking — every Tailwind class is available.

**Fix:** Install `@tailwindcss/vite` and configure build-time Tailwind, matching the approach used in the praxis repo.

#### 3. API key exposed to frontend bundle

`vite.config.ts:14-15` injects `GEMINI_API_KEY` into the client bundle via `define`:
```ts
'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
```
Any API key set in `.env.local` will be embedded in the production JavaScript bundle and visible to anyone inspecting the page source.

The key is currently a placeholder (`PLACEHOLDER_API_KEY` in `.env.local`) and no code references it at runtime. However, if a real key is ever set, it will be leaked.

**Fix:** Remove the `define` block from `vite.config.ts`. If AI features are needed, implement a backend proxy.

### HIGH

#### 4. Monolithic 737-line component

The entire application — UI rendering, state management, event handlers, narrative generation, and helper styles — lives in a single `App()` function in `App.tsx`. This causes:
- Every state change re-renders the entire component tree.
- No memoization (`React.memo`, `useMemo`, `useCallback` are all absent).
- Difficult to test individual views or logic in isolation.
- Merge conflicts when multiple developers work on different views.

**Recommended decomposition:**
- Extract `generateNarrative()` to `utils/generateNarrative.ts`
- Extract views: `PhaseView.tsx`, `SubtaskView.tsx`, `MatrixView.tsx`, `ReviewView.tsx`
- Extract modals: `VitalsModal.tsx`, `HistoryModal.tsx`
- Extract header: `Header.tsx`

#### 5. No data persistence

All session data (selections, vitals, saved sessions, undo history) exists only in React state and is lost on page refresh. For a clinical documentation tool, losing a partially-completed note to an accidental refresh is a significant usability issue.

**Fix:** Persist `selections`, `vitals`, and `savedSessions` to `localStorage` with a `useEffect` sync, or use `sessionStorage` for the current session.

#### 6. Session history lost on page refresh

`savedSessions` state (`App.tsx:162`) is never persisted. The "Session History" modal and "Start New Patient (Auto-Saves)" button give users the impression that sessions are saved, but they're only held in memory.

#### 7. `copyToClipboard` has no error handling

`App.tsx:290-294`:
```ts
navigator.clipboard.writeText(text).then(() => { ... });
```
No `.catch()` handler. If the clipboard API is unavailable (e.g., non-HTTPS context, browser permissions denied, page not focused), the promise rejects silently. Same issue at `App.tsx:347` in the history modal.

**Fix:** Add `.catch()` with user feedback, and implement a `document.execCommand("copy")` fallback.

#### 8. No input validation on CPT minutes

`App.tsx:670-676`: The CPT minutes input accepts any string (`type="text"`). Users can enter non-numeric values like "abc" which will appear verbatim in the narrative as "(abc mins)".

**Fix:** Use `type="number"` with `min="0"`, or validate/parse the input before including it in the narrative.

### MEDIUM

#### 9. `useEffect` overwrites manual narrative edits

`App.tsx:304-309`:
```ts
useEffect(() => {
  if (view === 'REVIEW') {
    const draft = generateNarrative(selections, vitals, cptMinutes, progress);
    setNoteText(draft);
  }
}, [cptMinutes, progress]);
```
When the user manually edits the narrative textarea and then changes CPT minutes or progress, the `useEffect` regenerates the narrative and overwrites all manual edits. This is surprising behavior — the user may have spent significant time customizing the text.

**Fix:** Track whether the user has manually edited the text. If so, warn before overwriting, or only regenerate the sections that changed.

#### 10. Narrative sentence structure is deterministic but appears random

`App.tsx:84`: `const mode = i % 3` cycles through 3 sentence patterns based on array index. This means reordering selections changes the sentence structure of unrelated items. While the output is technically deterministic, it creates an illusion of randomness that could confuse users who expect consistent formatting.

#### 11. `NARRATIVE_VOCAB` and `CUE_CONTEXT_MAP` imported but unused

`App.tsx:2` imports `NARRATIVE_VOCAB` and `CUE_CONTEXT_MAP` from constants, but neither is referenced anywhere in the component or narrative engine. Dead imports.

#### 12. Audit warning is advisory only

`App.tsx:562-566`: The "Mod I = No Cues" audit warning displays when Mod I is selected with cues, but doesn't prevent the user from confirming the unit. In a clinical billing context, this combination is invalid and could trigger audit flags.

**Fix:** Either disable the CONFIRM button when Mod I + cues is detected, or require explicit acknowledgment.

#### 13. `Date.now()` used for session IDs

`App.tsx:214`: `id: Date.now().toString()` for saved session IDs risks collision if two sessions are saved within the same millisecond. Use `crypto.randomUUID()` instead.

### LOW

#### 14. Inline style strings recreated every render

`App.tsx:317-322`: `commonTileStyle`, `activeTileStyle`, `btnBase`, `btnActive` are string variables defined inside the render function, so they're recreated on every render. Move them outside the component or to a constants file.

#### 15. `HIDDEN_CPTS` array inside render

`App.tsx:325`: The `HIDDEN_CPTS` array is defined inside the component body. Since it never changes, it should be a module-level constant.

#### 16. `overflow: hidden` on body prevents scrolling

`index.html:13`: `overflow: hidden` is set as a "Zero-scroll policy." This means if the content ever exceeds viewport height (e.g., many logged cues in Matrix view, or small mobile screen), users cannot scroll to see it.

#### 17. Missing `<link rel="stylesheet" href="/index.css">`

`index.html:25` references `/index.css` but no `index.css` file exists in the repository. This results in a 404 request on page load.

#### 18. No TypeScript strict null checks leveraged

While `tsconfig.json` enables `strict: true`, the code rarely uses null guards. For example, `activeSubtask.deficits` is accessed without checking if `activeSubtask` is null in several JSX conditionals (`view === 'MATRIX' && activeSubtask &&` guards the top level, but this pattern requires discipline to maintain).

---

## Security

**Risk: Medium.**

- **API key in frontend build** (Issue #3): The `define` block in `vite.config.ts` would embed any real API key into the client bundle.
- **No input sanitization on custom deficits**: `App.tsx:539` accepts arbitrary text that flows into the narrative. If the narrative is later pasted into a medical record system that doesn't sanitize input, this could be a vector.
- **Clipboard API without HTTPS**: The app uses `navigator.clipboard.writeText()` which requires a secure context (HTTPS) in most browsers. Deployment on HTTP will silently fail.

---

## Performance

**Concerns identified:**

1. **No memoization:** The component uses no `useMemo`, `useCallback`, or `React.memo`. Every state change (including typing in an input field) triggers a full re-render of the 737-line component including all JSX branches.
2. **`generateNarrative` called in `useEffect`:** The narrative is regenerated on `cptMinutes` and `progress` changes, plus on initial review entry. This is acceptable for the current data size but will scale poorly with many selections.
3. **Tailwind CDN runtime compilation:** Styles are compiled in the browser on every page load rather than at build time.
4. **`.filter()` and `.map()` in render:** Header activity buttons (`App.tsx:406-420`) run filter/map on every render. For a small list (13 activities) this is negligible, but the pattern should be avoided for larger datasets.

---

## Test Coverage

**None.** There are no test files, no test framework configured, and no test scripts in `package.json`.

The narrative generation logic (`generateNarrative`) is the most critical function in the app and would benefit significantly from unit tests covering:
- CPT grouping logic
- Sentence template variations
- Assessment generation based on progress type and assist levels
- Edge cases: empty selections, missing vitals, no cues
- Pain tolerance thresholds

---

## Comparison with Praxis Repo

Both repositories are OT documentation tools with narrative generators. Key differences:

| Aspect | Praxis (praxisnote-v3) | Repom (clinical-slate-ot) |
|--------|----------------------|--------------------------|
| **Architecture** | Decomposed (15+ files) | Monolithic (1 file) |
| **Narrative engine** | 386 lines, 10 rules, tested | 128 lines, 3 rules, untested |
| **Tailwind** | Build-time (@tailwindcss/vite) | CDN (runtime) |
| **Tests** | 30+ Vitest cases | None |
| **CI** | GitHub Actions pipeline | None |
| **Linting** | ESLint + Prettier configured | None |
| **Memoization** | useMemo, useCallback throughout | None |
| **Clinical scope** | 11 ADL activities | 13 CPT categories |
| **Unique features** | Equipment attribution, 3 templates | Undo/redo, session history, vitals, CPT billing |
| **Data persistence** | None | None |
| **Error handling** | Clipboard fallback with feedback | No error handling |

The praxis repo represents a more mature codebase in terms of engineering practices. The repom repo has broader clinical scope (CPT billing, vitals, cue builder) but needs architectural improvements to match production standards.

---

## Summary

| Priority | Issue | Location |
|----------|-------|----------|
| **Critical** | Import map conflicts with Vite | `index.html:16-24` |
| **Critical** | Tailwind loaded via CDN | `index.html:7` |
| **Critical** | API key exposed to frontend | `vite.config.ts:14-15` |
| **High** | Monolithic 737-line component | `App.tsx` |
| **High** | No data persistence — sessions lost on refresh | `App.tsx:162` |
| **High** | Clipboard copy has no error handling | `App.tsx:290-294` |
| **High** | No input validation on CPT minutes | `App.tsx:670-676` |
| **Medium** | `useEffect` overwrites manual narrative edits | `App.tsx:304-309` |
| **Medium** | NARRATIVE_VOCAB and CUE_CONTEXT_MAP imported but unused | `App.tsx:2` |
| **Medium** | Audit warning is advisory only — doesn't prevent invalid state | `App.tsx:562-566` |
| **Medium** | `Date.now()` session ID collision risk | `App.tsx:214` |
| **Low** | Inline style strings recreated every render | `App.tsx:317-322` |
| **Low** | Missing `index.css` referenced in HTML | `index.html:25` |
| **Low** | `overflow: hidden` prevents scrolling | `index.html:13` |
| **Low** | No test coverage | — |

The application has strong clinical domain coverage with a well-designed data model and useful features (undo/redo, cue builder, audit warnings). The primary areas for improvement are build configuration (Tailwind CDN, import map, API key exposure), code organization (decompose the monolith), data persistence, and testing.
