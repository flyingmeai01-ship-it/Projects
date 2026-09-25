import React, { useState, useEffect } from 'react';
import { GAME_DATA, REGION_VISUALS } from '../games/data';
import { getPersonalizedRecommendation } from '../services/analytics';
import { getStats, logEvent } from '../db/db';
import { speakText } from '../services/speech';

const REGIONAL_GREETINGS = {
  Assam: { native: 'নমস্কাৰ', roman: 'Nomoskar', tone: 'Tea gardens & peaceful rivers' },
  Manipur: { native: 'খুরুমজারি', roman: 'Khurumjari', tone: 'Gentle lakes & morning hills' },
  Meghalaya: { native: 'Khublei', roman: 'Khublei', tone: 'Cloud hills & living forests' },
  Nagaland: { native: 'Hello', roman: 'Warm Greetings', tone: 'Green ridges & community warmth' },
  Mizoram: { native: 'Chibai', roman: 'Chibai', tone: 'Misty hills & bamboo breeze' },
  Tripura: { native: 'খুলুমখা', roman: 'Khulumkha', tone: 'Fresh orchards & peaceful valleys' },
  'Arunachal Pradesh': { native: 'Tashi Delek', roman: 'Tashi Delek', tone: 'Sunlit mountains & quiet streams' },
  Sikkim: { native: 'नमस्ते', roman: 'Namaste', tone: 'Mountain flowers & clean air' }
};

export default function PatientView({
  profile,
  onStartGame,
  onOpenVoiceMemory,
  onOpenCaregiver,
  stats
}) {
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const [showAlternativeSelector, setShowAlternativeSelector] = useState(false);
  const [companionMode, setCompanionMode] = useState(false);
  const [showCaregiverConfirm, setShowCaregiverConfirm] = useState(false);
  const [speakingStatus, setSpeakingStatus] = useState('');

  const gameKeys = Object.keys(GAME_DATA);
  const recommendation = getPersonalizedRecommendation(profile, stats || { games: {}, totalPlays: 0 });
  const recommendedGameId = recommendation.game || 'memory-pairs';
  const primaryGame = GAME_DATA[recommendedGameId] || GAME_DATA['memory-pairs'];

  const greetingInfo = REGIONAL_GREETINGS[profile.region] || REGIONAL_GREETINGS.Assam;
  const currentAlternativeId = gameKeys[selectedGameIndex];
  const currentAlternative = GAME_DATA[currentAlternativeId];

  // Welcome greeting speech
  const greetingSentence = `${greetingInfo.native}. Welcome, ${profile.name}. We are glad you are here today.`;

  function handleSpeakGreeting() {
    speakText(greetingSentence, profile.language, setSpeakingStatus);
  }

  function handleStartRecommended() {
    logEvent(profile.id, 'patient_start_primary_game', { gameId: recommendedGameId });
    onStartGame(recommendedGameId);
  }

  function handleStartAlternative() {
    logEvent(profile.id, 'patient_start_alternative_game', { gameId: currentAlternativeId });
    onStartGame(currentAlternativeId);
  }

  return (
    <div className="min-h-screen bg-[#fbf8f2] text-[#14231a] pb-16">
      {/* Top Accessible Navigation Bar */}
      <header className="bg-[#fffdf9] border-b-4 border-[#e2d9c8] sticky top-0 z-20 px-4 py-3 sm:py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl sm:text-4xl" aria-hidden="true">🌱</div>
            <div>
              <div className="text-xs sm:text-sm font-black tracking-widest text-[#14532d] uppercase">
                CARE • North East
              </div>
              <div className="text-xl sm:text-2xl font-black leading-tight text-[#14231a]">
                Hello, {profile.name}
              </div>
            </div>
          </div>

          {/* Caregiver Portal Switcher Button with explicit label */}
          <button
            onClick={() => setShowCaregiverConfirm(true)}
            className="btn btn-soft flex flex-col items-center justify-center py-2 px-4 min-h-[58px]"
            aria-label="Caregiver Dashboard and Settings"
          >
            <span className="text-xl" aria-hidden="true">🛡️</span>
            <span className="text-xs sm:text-sm font-bold mt-0.5">Caregiver View</span>
          </button>
        </div>
      </header>

      {/* Main Single-Focus Content Area */}
      <main className="max-w-3xl mx-auto px-4 pt-6 sm:pt-8 space-y-6">
        {/* Cultural Welcome Banner */}
        <section className="ner-tea-card p-6 sm:p-8 ner-weave-accent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-block bg-[#14532d] text-white text-sm font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                {profile.region} Memories
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-[#0f3d21]">
                {greetingInfo.native}
                <span className="text-xl sm:text-2xl font-bold ml-2 text-[#2d6a4f]">
                  ({greetingInfo.roman})
                </span>
              </h1>
              <p className="text-xl sm:text-2xl font-bold text-[#1a442e] mt-2">
                Welcome, {profile.name}
              </p>
              <p className="text-lg text-[#234e35] mt-1">
                {greetingInfo.tone} • Take your time.
              </p>
            </div>

            {/* Read Aloud Button with Literal Label */}
            <button
              onClick={handleSpeakGreeting}
              className="btn btn-soft flex flex-col items-center justify-center min-h-[72px] px-6 self-start sm:self-center"
              aria-label="Listen to greeting read aloud"
            >
              <span className="text-3xl" aria-hidden="true">🔊</span>
              <span className="text-sm font-black mt-1">Read Aloud</span>
            </button>
          </div>

          {/* Regional Visual Symbols */}
          <div className="mt-5 pt-4 border-t-2 border-[#c2d9c8] flex items-center justify-between">
            <div className="text-2xl sm:text-3xl tracking-widest" aria-hidden="true">
              {REGION_VISUALS[profile.region] || '🌾 🍵 🛶 🪈'}
            </div>
            <div className="text-sm sm:text-base font-bold text-[#1e5837]">
              Familiar & Peaceful
            </div>
          </div>
        </section>

        {speakingStatus && (
          <div className="voice-status" role="status">
            {speakingStatus}
          </div>
        )}

        {/* PRIMARY FOCUS: ONE Main Recommended Activity */}
        {!showAlternativeSelector ? (
          <section className="ner-bamboo-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <span className="bg-[#b37418] text-white text-sm font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                Recommended For Today
              </span>
              <span className="text-base font-bold text-[#7a4c07]">
                {recommendation.level === 'gentle' ? 'Gentle Pace' : 'Comfortable Pace'}
              </span>
            </div>

            <div className="text-center py-4 space-y-3">
              <div className="text-6xl sm:text-7xl mb-2" aria-hidden="true">
                {primaryGame.icon}
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#3a2202]">
                {primaryGame.title}
              </h2>
              <p className="text-xl sm:text-2xl text-[#523305] max-w-xl mx-auto leading-relaxed">
                {primaryGame.desc}
              </p>
            </div>

            {/* Giant Chunky Tap Target for the Single Primary Action */}
            <button
              onClick={handleStartRecommended}
              className="btn btn-primary w-full text-2xl py-5 min-h-[80px] shadow-lg flex items-center justify-center gap-3"
            >
              <span className="text-3xl" aria-hidden="true">▶️</span>
              <span>Start Today's Activity</span>
            </button>

            {/* Secondary Action: Browse Other Activities calmly */}
            <div className="pt-2 text-center">
              <button
                onClick={() => setShowAlternativeSelector(true)}
                className="btn btn-soft w-full min-h-[64px] text-lg font-black flex items-center justify-center gap-2"
              >
                <span className="text-2xl" aria-hidden="true">🔄</span>
                <span>Choose a Different Activity</span>
              </button>
            </div>
          </section>
        ) : (
          /* SINGLE-ACTIVITY BROWSER: Shows ONLY ONE alternative at a time (No overwhelming 12-item grid) */
          <section className="ner-bamboo-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowAlternativeSelector(false)}
                className="btn btn-soft min-h-[54px] px-4 text-base font-bold"
              >
                ← Back to Recommended
              </button>
              <span className="text-sm font-black text-[#7a4c07]">
                Activity {selectedGameIndex + 1} of {gameKeys.length}
              </span>
            </div>

            <div className="text-center py-4 space-y-3 bg-[#fffdf9] border-2 border-[#dfd2ba] rounded-2xl p-6">
              <div className="text-6xl sm:text-7xl mb-2" aria-hidden="true">
                {currentAlternative.icon}
              </div>
              <h2 className="text-3xl font-black text-[#3a2202]">
                {currentAlternative.title}
              </h2>
              <p className="text-xl text-[#523305] leading-relaxed">
                {currentAlternative.desc}
              </p>

              {/* Start this specific chosen activity */}
              <button
                onClick={handleStartAlternative}
                className="btn btn-primary w-full text-2xl py-4 min-h-[76px] mt-4 flex items-center justify-center gap-3"
              >
                <span className="text-3xl" aria-hidden="true">▶️</span>
                <span>Play This Activity</span>
              </button>
            </div>

            {/* Step-through Previous / Next controls with literal labels */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() =>
                  setSelectedGameIndex((prev) => (prev > 0 ? prev - 1 : gameKeys.length - 1))
                }
                className="btn btn-soft min-h-[68px] flex flex-col items-center justify-center"
              >
                <span className="text-2xl" aria-hidden="true">⬅️</span>
                <span className="text-base font-bold mt-1">Previous Activity</span>
              </button>

              <button
                onClick={() =>
                  setSelectedGameIndex((prev) => (prev + 1) % gameKeys.length)
                }
                className="btn btn-soft min-h-[68px] flex flex-col items-center justify-center"
              >
                <span className="text-2xl" aria-hidden="true">➡️</span>
                <span className="text-base font-bold mt-1">Next Activity</span>
              </button>
            </div>
          </section>
        )}

        {/* PRIMARY FOCUS 2: Dedicated Calm Voice Memory Action */}
        <section className="ner-mist-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">🎙️</span>
            <div>
              <h3 className="text-2xl font-black text-[#122c3b]">
                Tell a Story or Memory
              </h3>
              <p className="text-lg text-[#254659]">
                Speak softly into the device. Share a recipe, a loved one’s name, or a village memory.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenVoiceMemory}
            className="btn btn-voice w-full text-2xl py-5 min-h-[76px] flex items-center justify-center gap-3"
          >
            <span className="text-3xl" aria-hidden="true">🎤</span>
            <span>Tell a Story or Memory</span>
          </button>
        </section>

        {/* Family Companion Mode Toggle (Optional assistance) */}
        <section className="card p-5 bg-[#fffdfa] border-2 border-[#dfd7c6] rounded-2xl">
          <button
            onClick={() => setCompanionMode(!companionMode)}
            className="w-full flex items-center justify-between text-left"
            aria-expanded={companionMode}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl" aria-hidden="true">👥</span>
              <div>
                <div className="text-xl font-black">
                  {companionMode ? 'Playing with Family Member (Active)' : 'Playing with Family or Companion?'}
                </div>
                <div className="text-base text-[#4a584e]">
                  Tap here for gentle companionship tips.
                </div>
              </div>
            </div>
            <span className="text-2xl font-black ml-2">
              {companionMode ? '▲' : '▼'}
            </span>
          </button>

          {companionMode && (
            <div className="companion-note mt-4">
              <p className="font-bold text-lg">💡 Tips for Family Caregivers:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-base">
                <li>Read prompts aloud slowly and warmly.</li>
                <li>There are no wrong answers; celebrate shared smiles.</li>
                <li>Take breaks whenever needed. 5 to 10 minutes is plenty.</li>
              </ul>
            </div>
          )}
        </section>
      </main>

      {/* Confirmation Modal to enter Caregiver View (Prevents accidental navigation by dementia patient) */}
      {showCaregiverConfirm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="caregiver-dialog-title"
        >
          <div className="card max-w-lg w-full p-6 sm:p-8 bg-[#fffdf9] border-4 border-[#14532d] space-y-5">
            <div className="flex items-center gap-3 text-[#14532d]">
              <span className="text-4xl" aria-hidden="true">🛡️</span>
              <h2 id="caregiver-dialog-title" className="text-2xl font-black">
                Caregiver & Family Portal
              </h2>
            </div>
            <p className="text-xl text-[#374151] leading-relaxed">
              This section contains activity history, offline sync details, and settings. Are you a family member or caregiver?
            </p>
            <div className="space-y-3 pt-2">
              <button
                onClick={() => {
                  setShowCaregiverConfirm(false);
                  onOpenCaregiver();
                }}
                className="btn btn-primary w-full text-xl min-h-[66px] flex items-center justify-center gap-2"
              >
                <span>Yes, Open Caregiver Portal</span>
              </button>
              <button
                onClick={() => setShowCaregiverConfirm(false)}
                className="btn btn-soft w-full text-xl min-h-[66px]"
              >
                <span>No, Stay on Patient View</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

