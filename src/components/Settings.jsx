import React, { useEffect, useState } from 'react';
import { saveProfile } from '../db/db';
import { LIFE_INTERESTS } from '../games/data';

export default function Settings({ profile, onBack, onProfileUpdated }) {
  const [key, setKey] = useState(localStorage.getItem('CARE_GEMINI_KEY') || '');
  const [saved, setSaved] = useState(false);
  const [ai4bharatUrl, setAi4bharatUrl] = useState(
    localStorage.getItem('CARE_AI4BHARAT_URL') || import.meta.env.VITE_AI4BHARAT_URL || ''
  );
  const [ai4bharatToken, setAi4bharatToken] = useState(
    localStorage.getItem('CARE_AI4BHARAT_TOKEN') || ''
  );
  const [ai4bharatSaved, setAi4bharatSaved] = useState(false);
  const [comfortMode, setComfortMode] = useState(
    localStorage.getItem('CARE_COMFORT_MODE') !== 'false'
  );
  const [activities, setActivities] = useState(profile.activities || []);
  const [interestsSaved, setInterestsSaved] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('comfort-mode', comfortMode);
    localStorage.setItem('CARE_COMFORT_MODE', String(comfortMode));
  }, [comfortMode]);

  function save() {
    if (key.trim()) localStorage.setItem('CARE_GEMINI_KEY', key.trim());
    else localStorage.removeItem('CARE_GEMINI_KEY');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function saveAI4Bharat() {
    if (ai4bharatUrl.trim()) localStorage.setItem('CARE_AI4BHARAT_URL', ai4bharatUrl.trim());
    else localStorage.removeItem('CARE_AI4BHARAT_URL');
    if (ai4bharatToken.trim()) localStorage.setItem('CARE_AI4BHARAT_TOKEN', ai4bharatToken.trim());
    else localStorage.removeItem('CARE_AI4BHARAT_TOKEN');
    setAi4bharatSaved(true);
    setTimeout(() => setAi4bharatSaved(false), 2500);
  }

  function toggleActivity(id) {
    setActivities((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
    setInterestsSaved(false);
  }

  async function saveInterests() {
    const updated = { ...profile, activities };
    await saveProfile(updated);
    onProfileUpdated?.(updated);
    setInterestsSaved(true);
    setTimeout(() => setInterestsSaved(false), 2500);
  }

  return (
    <div className="card p-6 sm:p-8 bg-[#fffdfa] border-3 border-[#c8beaa] space-y-6">
      <div className="flex items-center justify-between border-b-2 border-[#e2d9c8] pb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#14231a]">
            Caregiver Settings & AI Gateways
          </h2>
          <p className="text-base text-[#4a584e] mt-1">
            Configure comfort mode, regional AI endpoints, and familiar activities.
          </p>
        </div>
      </div>

      {/* Comfort Mode Setting */}
      <section className="p-5 rounded-2xl bg-[#f4ede0] border-2 border-[#ded1be] space-y-3">
        <h3 className="text-xl font-black text-[#14231a]">
          Elderly Comfort Display
        </h3>
        <p className="text-base text-[#4a584e]">
          Enforces 20px+ body typography, chunky tap targets, and limits games to 2 choices at a time to reduce cognitive strain.
        </p>
        <button
          aria-pressed={comfortMode}
          onClick={() => setComfortMode((value) => !value)}
          className={`btn min-h-[60px] text-lg font-black ${
            comfortMode ? 'btn-primary' : 'btn-soft'
          }`}
        >
          {comfortMode ? '✓ Comfort Display is Active' : 'Enable Comfort Display'}
        </button>
      </section>

      {/* Familiar Life Activities */}
      <section className="p-5 rounded-2xl bg-[#f4ede0] border-2 border-[#ded1be] space-y-3">
        <h3 className="text-xl font-black text-[#14231a]">
          Familiar Life & Interests
        </h3>
        <p className="text-base text-[#4a584e]">
          Customize everyday skills and memory topics to match {profile.name}'s life.
        </p>
        <div className="space-y-2 pt-2">
          {LIFE_INTERESTS.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleActivity(item.id)}
              aria-pressed={activities.includes(item.id)}
              className={`game-choice w-full min-h-[66px] text-lg font-bold ${
                activities.includes(item.id)
                  ? 'bg-[#d1fae5] border-[#059669] text-[#064e3b]'
                  : 'bg-white'
              }`}
            >
              {activities.includes(item.id) ? '✓ ' : ''}
              {item.label}
            </button>
          ))}
        </div>
        <div className="pt-2 flex items-center gap-3">
          <button onClick={saveInterests} className="btn btn-primary min-h-[58px] text-lg font-bold">
            Save Familiar Life Choices
          </button>
          {interestsSaved && (
            <span className="text-emerald-700 font-bold text-lg">✓ Saved</span>
          )}
        </div>
      </section>

      {/* AI4Bharat Regional Voice Gateway */}
      <section className="p-5 rounded-2xl bg-[#f4ede0] border-2 border-[#ded1be] space-y-3">
        <h3 className="text-xl font-black text-[#14231a]">
          AI4Bharat Regional Language Voice Gateway
        </h3>
        <p className="text-base text-[#4a584e]">
          Connect a self-hosted AI4Bharat gateway for Assamese, Manipuri, Bodo, Bengali, or Nepali speech recognition.
        </p>
        <input
          value={ai4bharatUrl}
          onChange={(event) => {
            setAi4bharatUrl(event.target.value);
            setAi4bharatSaved(false);
          }}
          placeholder="https://your-care-gateway.example/api/ai4bharat"
          className="elder-input w-full text-lg"
          inputMode="url"
          autoComplete="url"
        />
        <input
          type="password"
          value={ai4bharatToken}
          onChange={(event) => {
            setAi4bharatToken(event.target.value);
            setAi4bharatSaved(false);
          }}
          placeholder="Optional Gateway Token / API Key"
          className="elder-input w-full text-lg"
          autoComplete="off"
        />
        <div className="pt-2 flex items-center gap-3">
          <button onClick={saveAI4Bharat} className="btn btn-primary min-h-[58px] text-lg font-bold">
            Save AI4Bharat Gateway
          </button>
          {ai4bharatSaved && (
            <span className="text-emerald-700 font-bold text-lg">✓ Saved</span>
          )}
        </div>
      </section>

      {/* Gemini API Key */}
      <section className="p-5 rounded-2xl bg-[#f4ede0] border-2 border-[#ded1be] space-y-3">
        <h3 className="text-xl font-black text-[#14231a]">
          Google Gemini Voice Key (Prototype STT)
        </h3>
        <p className="text-base text-[#4a584e]">
          Audio is sent to Gemini only to transcribe voice memories. The final note is encrypted locally.
        </p>
        <input
          type="password"
          value={key}
          onChange={(event) => {
            setKey(event.target.value);
            setSaved(false);
          }}
          placeholder="Paste Gemini API Key"
          className="elder-input w-full text-lg"
          autoComplete="off"
        />
        <div className="pt-2 flex items-center gap-3">
          <button onClick={save} className="btn btn-primary min-h-[58px] text-lg font-bold">
            Save Gemini Key
          </button>
          {saved && (
            <span className="text-emerald-700 font-bold text-lg">✓ Saved</span>
          )}
        </div>
      </section>
    </div>
  );
}
