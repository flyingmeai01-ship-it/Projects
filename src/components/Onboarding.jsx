import React, { useState } from 'react';
import { saveProfile, logEvent } from '../db/db';
import { LIFE_INTERESTS } from '../games/data';
import { LANGUAGE_OPTIONS } from '../services/speech';

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    language: 'as-IN',
    region: 'Assam',
    caregiver: '',
    favoritePerson: '',
    activities: []
  });

  function update(values) {
    setProfile((current) => ({ ...current, ...values }));
  }

  function toggleActivity(id) {
    update({
      activities: profile.activities.includes(id)
        ? profile.activities.filter((value) => value !== id)
        : [...profile.activities, id]
    });
  }

  async function finish() {
    const saved = {
      ...profile,
      id: crypto.randomUUID(),
      age: Number(profile.age) || null,
      preferences: { comfortMode: true, caregiverMode: false, preferredSessionMinutes: 10 },
      adaptation: {},
      createdAt: Date.now()
    };
    if (localStorage.getItem('CARE_COMFORT_MODE') === null) {
      localStorage.setItem('CARE_COMFORT_MODE', 'true');
      document.documentElement.classList.add('comfort-mode');
    }
    await saveProfile(saved);
    await logEvent(saved.id, 'profile_created', {
      region: saved.region,
      language: saved.language,
      activities: saved.activities
    });
    onComplete(saved);
  }

  return (
    <div className="min-h-screen bg-[#fbf8f2] flex items-center justify-center p-4 sm:p-6">
      <div className="card elder-card w-full max-w-xl p-6 sm:p-10 bg-[#fffdf9] border-4 border-[#14532d] shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="text-6xl mb-1" aria-hidden="true">🌱</div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#14532d]">
            Welcome to CARE
          </h1>
          <p className="text-xl text-[#374151] leading-relaxed">
            A gentle, private space for memory, culture, and family connection in the North East.
          </p>
          <div className="inline-block bg-[#ecfdf5] border-2 border-[#10b981] text-[#065f46] text-base font-black px-4 py-1 rounded-full mt-2">
            Step {step} of 3
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-5 pt-2">
            <label className="block text-xl font-black text-[#14231a]">
              What is your name?
              <input
                className="elder-input w-full mt-2 text-xl"
                value={profile.name}
                onChange={(event) => update({ name: event.target.value })}
                placeholder="Enter your name or nickname"
                autoComplete="name"
              />
            </label>

            <label className="block text-xl font-black text-[#14231a]">
              Age <span className="font-normal text-base text-[#64748b]">(optional)</span>
              <input
                type="number"
                className="elder-input w-full mt-2 text-xl"
                value={profile.age}
                onChange={(event) => update({ age: event.target.value })}
                placeholder="e.g. 72"
              />
            </label>

            <button
              disabled={!profile.name.trim()}
              onClick={() => setStep(2)}
              className="btn btn-primary w-full min-h-[68px] text-2xl mt-4 disabled:opacity-40"
            >
              Continue ➡️
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 pt-2">
            <label className="block text-xl font-black text-[#14231a]">
              Your Home Region in the North East
              <select
                className="elder-input w-full mt-2 text-xl font-bold bg-white"
                value={profile.region}
                onChange={(event) => update({ region: event.target.value })}
              >
                {[
                  'Assam',
                  'Manipur',
                  'Meghalaya',
                  'Nagaland',
                  'Mizoram',
                  'Tripura',
                  'Arunachal Pradesh',
                  'Sikkim'
                ].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>

            <label className="block text-xl font-black text-[#14231a]">
              Preferred Language for Voice & Audio
              <select
                className="elder-input w-full mt-2 text-xl font-bold bg-white"
                value={profile.language}
                onChange={(event) => update({ language: event.target.value })}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xl font-black text-[#14231a]">
              A Special Person or Family Member to Remember{' '}
              <span className="font-normal text-base text-[#64748b]">(optional)</span>
              <input
                className="elder-input w-full mt-2 text-xl"
                value={profile.favoritePerson}
                onChange={(event) => update({ favoritePerson: event.target.value })}
                placeholder="e.g. Grandma, Rina, Brother"
              />
            </label>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => setStep(1)}
                className="btn btn-soft min-h-[64px] text-xl font-black"
              >
                ⬅️ Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="btn btn-primary min-h-[64px] text-xl font-black"
              >
                Continue ➡️
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 pt-2">
            <h2 className="text-2xl font-black text-[#14231a]">
              Familiar Everyday Activities
            </h2>
            <p className="text-lg text-[#4a584e]">
              Choose anything you enjoy or find familiar. You can select more than one.
            </p>

            <div className="space-y-3 pt-2">
              {LIFE_INTERESTS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleActivity(item.id)}
                  aria-pressed={profile.activities.includes(item.id)}
                  className={`game-choice w-full min-h-[72px] text-xl font-bold ${
                    profile.activities.includes(item.id)
                      ? 'bg-[#d1fae5] border-[#059669] text-[#064e3b]'
                      : 'bg-white'
                  }`}
                >
                  {profile.activities.includes(item.id) ? '✓ ' : ''}
                  {item.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <button
                onClick={() => setStep(2)}
                className="btn btn-soft min-h-[64px] text-xl font-black"
              >
                ⬅️ Back
              </button>
              <button
                onClick={finish}
                className="btn btn-primary min-h-[64px] text-xl font-black"
              >
                Enter CARE 🌱
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-sm font-bold text-[#64748b] pt-2">
          🔒 Stored safely on this device only. No external clouds without consent.
        </p>
      </div>
    </div>
  );
}
