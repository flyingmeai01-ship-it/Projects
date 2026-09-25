import { wasmAdaptGameState, wasmRecommendActivity } from './crypto';

const INTEREST_GAMES = { family: 'family-match', food: 'market-memory', music: 'sound-memory', craft: 'everyday-skills', farm: 'everyday-skills', work: 'everyday-skills' };
const REASONS = { 'familiar-interest': 'It connects with familiar interests chosen for this profile.', 'first-activity': 'It is a familiar activity that has not been tried yet.', variety: 'It balances familiar activities with a little variety.' };

export function recommendNext(stats) { const list = Object.entries(stats.games || {}).map(([game, value]) => ({ game, ...value, avg: value.totalScore / Math.max(1, value.plays) })); list.sort((a, b) => a.plays - b.plays || a.avg - b.avg); return list[0]?.game || 'family-match' }
export function difficultyFor(gameStats) { const avg = gameStats?.avg ?? 0; return avg < 40 ? 'easy' : avg < 75 ? 'medium' : 'hard' }
export function getGameDifficulty(profile, gameId) { return profile?.adaptation?.[gameId]?.level || 'gentle' }
export function choicesForDifficulty(profile, gameId, comfortMode = false) { if (comfortMode || getGameDifficulty(profile, gameId) === 'gentle') return 2; return getGameDifficulty(profile, gameId) === 'stretch' ? 4 : 3 }

function fallbackAdaptation(previous, attempts, average, feeling, hintsUsed) { let level = previous.level || 'gentle'; if (feeling === 'hard' || hintsUsed >= 2 || (attempts >= 3 && average < .5)) level = 'gentle'; else if (attempts >= 3 && feeling === 'enjoyed' && average >= .8) level = 'stretch'; else if (attempts >= 2 && average >= .6) level = 'steady'; return level }
export function nextAdaptation(previous = {}, { correct, rounds, feeling, hintsUsed = 0 }) {
  const attempts = (previous.attempts || 0) + 1; const accuracy = rounds ? correct / rounds : 0; const prior = previous.recentAccuracy || []; const recent = [...prior, accuracy].slice(-5); const average = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  let level = fallbackAdaptation(previous, attempts, average, feeling, hintsUsed);
  try { const priorAverage = prior.length ? prior.reduce((sum, value) => sum + value, 0) / prior.length : 0; const result = wasmAdaptGameState(previous.level === 'stretch' ? 2 : previous.level === 'steady' ? 1 : 0, previous.attempts || 0, priorAverage, correct, rounds, feeling === 'hard' ? 0 : feeling === 'enjoyed' ? 2 : 1, hintsUsed); if (result) level = JSON.parse(result).level || level } catch (error) { console.warn('WASM adaptation decision failed; using local fallback.', error) }
  return { level, attempts, recentAccuracy: recent, lastFeeling: feeling, updatedAt: Date.now() };
}

export function getPersonalizedRecommendation(profile, stats) {
  const played = new Set(Object.keys(stats.games || {})); const preferred = (profile?.activities || []).map(id => INTEREST_GAMES[id]).filter(Boolean); const fallbackGame = preferred.find(game => !played.has(game)) || preferred[0] || recommendNext(stats); const fallbackReason = preferred.length ? REASONS['familiar-interest'] : !played.has(fallbackGame) ? REASONS['first-activity'] : REASONS.variety;
  try { const packedStats = Object.entries(stats.games || {}).map(([game, value]) => `${game}:${value.plays || 0}:${value.totalScore / Math.max(1, value.plays || 0)}`).join(';'); const packedLevels = Object.entries(profile?.adaptation || {}).map(([game, value]) => `${game}:${value.level || 'gentle'}`).join(';'); const result = wasmRecommendActivity(packedStats, (profile?.activities || []).join(','), packedLevels); if (result) { const decision = JSON.parse(result); return { game: decision.game || fallbackGame, level: decision.level || getGameDifficulty(profile, fallbackGame), reason: REASONS[decision.reasonCode] || fallbackReason } } } catch (error) { console.warn('WASM recommendation decision failed; using local fallback.', error) }
  return { game: fallbackGame, level: getGameDifficulty(profile, fallbackGame), reason: fallbackReason };
}

export function getSupportPlan(assessment) {
  if (!assessment?.enoughData) return { band: 'not-enough-data', title: 'Keep building a gentle routine', reason: 'CARE needs at least four shared activities before it can describe a pattern. This is not a memory or dementia assessment.', nextStep: 'Try one familiar activity with a caregiver and check in again later.', carePath: 'CARE daily support' };
  const hard = assessment.feelings?.hard || 0; const enjoyed = assessment.feelings?.enjoyed || 0;
  if (hard > enjoyed) return { band: 'gentler-support', title: 'Try a gentler shared session', reason: 'Recent activities were more often described as difficult than enjoyable.', nextStep: 'Choose a familiar game, use two choices, add hints, or invite a trusted caregiver to join.', carePath: 'CARE caregiver-supported plan' };
  if ((assessment.averageMinutes || 0) >= 25) return { band: 'rest-breaks', title: 'Add comfortable rest breaks', reason: `Recent sessions averaged about ${assessment.averageMinutes} minutes. Longer sessions can be tiring, so time is used here only to shape a gentler routine.`, nextStep: 'Try 10–20 minute sessions with a drink, conversation, or rest between activities.', carePath: 'CARE paced activity plan' };
  if (assessment.activeDays < 2) return { band: 'caregiver-follow-up', title: 'Invite a caring check-in', reason: 'There have been fewer active days recently, so a little companionship may help the routine feel easier.', nextStep: 'Ask a trusted person to share a short memory moment or conversation this week.', carePath: 'CARE connection plan' };
  return { band: 'steady-support', title: 'Continue the familiar routine', reason: 'Recent activities were mostly comfortable or positive, with a continuing local routine.', nextStep: 'Keep choosing familiar activities and stop whenever the person feels tired.', carePath: 'CARE everyday support' };
}
