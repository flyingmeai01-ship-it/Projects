---
name: care-dementia-assessment
description: 'Improve the CARE SIH 26003 dementia-support PWA with a privacy-first AI-assisted cognitive check-in, explainable support recommendations, caregiver guidance, and safe referral language. Use when adding or reviewing dementia assessment, screening support, risk communication, AI recommendations, caregiver workflows, Gemini integration, IndexedDB persistence, or related React/Vite features.'
argument-hint: 'Describe the assessment or caregiver-support improvement to implement'
user-invocable: true
disable-model-invocation: false
---

# CARE Dementia Assessment

Use this skill to extend the CARE PWA without turning engagement data or an AI model into a dementia diagnosis. The product is a cognitive-stimulation and caregiver-support prototype for SIH 26003. Its existing local assessment summarizes activity, difficulty, feelings, and voice-note counts; its existing recommendation engine chooses the next memory game.

## Non-negotiable safety boundary

- Never diagnose dementia, mild cognitive impairment, or any other medical condition from gameplay, voice notes, facial data, free-text responses, or an AI-generated score.
- Use language such as `support signal`, `check-in result`, or `consider discussing with a clinician`; do not use `dementia probability`, `patient score`, or `diagnosis` unless a qualified clinical owner has supplied an approved instrument and wording.
- Do not invent clinical thresholds. If a validated questionnaire is requested, ask which instrument, license, population, language, scoring rules, and approval process apply. Preserve the instrument's official wording and scoring rather than paraphrasing it.
- Show uncertainty, missing answers, and the limits of the result. A recommendation must never be the only call to action for urgent symptoms.
- For sudden confusion, immediate danger, self-harm, abuse, stroke-like symptoms, or other urgent concerns, show a clear instruction to contact local emergency or clinical services. Do not let AI triage replace emergency care.
- Obtain consent before collecting or sending health-related responses. Keep assessment data local by default and explain exactly what leaves the device if an external model is enabled.

## Workflow

1. **Inspect the owning surface**
   - Start at `src/components/Dashboard.jsx`, `src/services/analytics.js`, and `src/db/db.js`.
   - Reuse the existing React/Vite, Dexie, encryption, event logging, and Tailwind patterns.
   - Keep the current engagement assessment separate from any clinical questionnaire. Do not silently reinterpret existing game scores.

2. **Define the support question**
   - State who answers: the person, a caregiver, or both.
   - State the time window, language, accessibility needs, and whether the goal is daily support, caregiver observation, or clinician discussion.
   - Define the output as one of: `support normally`, `try a gentler activity`, `caregiver follow-up`, or `discuss with a clinician`.
   - Add a `not enough information` state whenever required answers are missing or consent is declined.

3. **Choose the assessment source**
   - Prefer a clinician-approved, validated instrument or a non-clinical caregiver check-in supplied by the product owner.
   - If no approved instrument exists, build a clearly labelled observational check-in rather than a diagnostic test. Keep questions about recent function and support needs, not claims about disease.
   - Record the instrument version and consent state with every completed assessment so results remain explainable and auditable.

4. **Design the data contract**
   - Store the minimum necessary fields: respondent role, answers or derived categories, instrument/version, timestamp, consent, language, and recommendation reason.
   - Encrypt sensitive assessment content using the existing vault path. Avoid putting raw health answers into analytics events or URLs.
   - Version schema changes and provide a delete/export path consistent with the existing local-vault reset behavior.
   - Make AI optional. The app must remain usable offline with deterministic fallback recommendations.

5. **Implement explainable recommendations**
   - Put deterministic safety and recommendation rules in a small service module, not inside JSX.
   - Order rules so urgent safety messaging and insufficient data are handled before ordinary recommendations.
   - Return structured output such as `{ band, title, reason, nextSteps, needsClinicianDiscussion }`; never return an unexplained number alone.
   - Use activity signals only to personalize support, for example shorter sessions, hints, familiar games, caregiver participation, or a break. Never use them as evidence that a person has dementia.
   - If Gemini or another model is used, send only consented minimum data, request JSON matching a schema, validate the response, and fall back locally on timeout, refusal, malformed output, or network failure. Do not expose API keys in client code in production.

6. **Build the user flow**
   - Add a calm entry point from the dashboard with explicit consent and respondent selection.
   - Use one accessible question per step or a similarly low-load layout, with large controls, keyboard support, readable focus states, progress, back, pause, and resume.
   - Before completion, show the answers or summary for confirmation. After completion, show the support result, reasons, next steps, and a clinician discussion option without alarming certainty.
   - Keep caregiver and participant language respectful, culturally adaptable, and free of blame. Provide a way to correct an answer.

7. **Test the safety contract**
   - Test consent declined, incomplete answers, offline mode, corrupted/deleted local data, repeat assessments, and model failure.
   - Test that no UI string claims diagnosis and that recommendations include an explanation and next action.
   - Test keyboard navigation, screen-reader labels, large text/comfort mode, mobile layout, and localization-sensitive text.
   - Add unit tests for every recommendation branch, especially urgent concerns and insufficient data. Add a focused component test for the completion flow if the repository gains a test runner.
   - Run `npm run build` after implementation. If a browser flow is available, verify the assessment at desktop and mobile widths and confirm that data remains usable after reload.

## Decision rules

- **No consent** -> do not save answers or call AI; offer the non-assessment CARE activities.
- **Urgent concern** -> show emergency/clinical guidance immediately; do not produce a routine risk band.
- **Missing or contradictory answers** -> return `not enough information`, explain what is missing, and allow correction.
- **Support difficulty without urgent concern** -> recommend a gentler activity, caregiver participation, or a break; do not label a condition.
- **Repeated functional concerns or approved instrument threshold** -> recommend discussing the result with a clinician, with the instrument and date visible; do not call it a diagnosis.
- **AI unavailable or uncertain** -> use the deterministic local result and say that AI was not used or could not provide a reliable summary.

## Completion checklist

- [ ] The feature states its non-diagnostic purpose at entry and result.
- [ ] Consent, respondent role, instrument/version, and timestamp are handled.
- [ ] Sensitive data is local/encrypted by default and deletion is available.
- [ ] AI is optional, schema-validated, privacy-limited, and has a local fallback.
- [ ] Every outcome has a reason and an actionable next step.
- [ ] Urgent concerns bypass routine recommendations.
- [ ] Existing engagement analytics remain non-clinical.
- [ ] Accessibility, offline, error, repeat-use, and mobile states are covered.
- [ ] `npm run build` passes and focused tests cover all branches.

## Example prompts

- `Use the CARE dementia assessment skill to add a consented caregiver check-in with local deterministic recommendations. Do not diagnose or invent a clinical score.`
- `Review the current CARE AI recommendation flow for privacy, medical-safety, offline fallback, and accessibility issues.`
- `Add an approved questionnaire to CARE. First identify the instrument, licensing, scoring, and clinical wording gaps before editing code.`
