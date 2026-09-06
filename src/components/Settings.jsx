import React, { useEffect, useState } from 'react';
import { saveProfile } from '../db/db';
import { LIFE_INTERESTS } from '../games/data';

export default function Settings({ profile, onBack }) {
  const [key, setKey] = useState(localStorage.getItem('CARE_GEMINI_KEY') || '');
  const [saved, setSaved] = useState(false);
  const [ai4bharatUrl, setAi4bharatUrl] = useState(localStorage.getItem('CARE_AI4BHARAT_URL') || import.meta.env.VITE_AI4BHARAT_URL || '');
  const [ai4bharatToken, setAi4bharatToken] = useState(localStorage.getItem('CARE_AI4BHARAT_TOKEN') || '');
  const [ai4bharatSaved, setAi4bharatSaved] = useState(false);
  const [comfortMode, setComfortMode] = useState(localStorage.getItem('CARE_COMFORT_MODE') === 'true');
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
  }

  function saveAI4Bharat() {
    if (ai4bharatUrl.trim()) localStorage.setItem('CARE_AI4BHARAT_URL', ai4bharatUrl.trim());
    else localStorage.removeItem('CARE_AI4BHARAT_URL');
    if (ai4bharatToken.trim()) localStorage.setItem('CARE_AI4BHARAT_TOKEN', ai4bharatToken.trim());
    else localStorage.removeItem('CARE_AI4BHARAT_TOKEN');
    setAi4bharatSaved(true);
  }

  function toggleActivity(id) {
    setActivities(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
    setInterestsSaved(false);
  }

  async function saveInterests() {
    await saveProfile({ ...profile, activities });
    setInterestsSaved(true);
  }

  return <div className="min-h-screen bg-slate-50 p-5"><div className="max-w-2xl mx-auto card p-7"><button onClick={onBack} className="text-lg font-bold text-teal-700">← Dashboard</button><h1 className="text-3xl font-black mt-5">Comfort, voice & privacy</h1>
    <section className="mt-6 p-5 rounded-2xl border-2 border-teal-100"><h2 className="text-xl font-black">Comfort display</h2><p className="text-slate-600 mt-1">Uses larger writing, calmer spacing, and two choices at a time during games.</p><button aria-pressed={comfortMode} onClick={() => setComfortMode(value => !value)} className={`btn elder-action mt-4 ${comfortMode ? 'btn-primary' : 'btn-soft'}`}>{comfortMode ? '✓ Comfort display is on' : 'Turn on comfort display'}</button></section>
    <section className="mt-6 p-5 rounded-2xl border-2 border-teal-100"><h2 className="text-xl font-black">Familiar life</h2><p className="text-slate-600 mt-1">Choose interests to make Everyday Skills more familiar. These choices are for everyone.</p><div className="grid gap-3 mt-4">{LIFE_INTERESTS.map(item => <button key={item.id} onClick={() => toggleActivity(item.id)} aria-pressed={activities.includes(item.id)} className={`text-left game-choice ${activities.includes(item.id) ? 'bg-teal-100 border-teal-700' : 'bg-white'}`}>{activities.includes(item.id) ? '✓ ' : ''}{item.label}</button>)}</div><button onClick={saveInterests} className="btn btn-primary elder-action mt-4">Save familiar-life choices</button>{interestsSaved && <span className="ml-3 text-emerald-700 font-bold">Saved</span>}</section>
    <p className="text-slate-600 mt-6">CARE stores completed notes encrypted on this device. Gemini and AI4Bharat are optional and only turn a recording into a draft that the person or caregiver checks before saving.</p>
    <div className="mt-5 p-4 rounded-2xl bg-amber-50 text-amber-950"><b>Voice privacy:</b> cloud transcription sends audio away from this device. Use it only with informed consent and review every transcript before saving.</div>
    <div className="mt-6 p-5 rounded-2xl border-2 border-teal-100"><h2 className="text-xl font-black">AI4Bharat regional language gateway</h2><p className="text-sm text-slate-600 mt-1">Connect a self-hosted AI4Bharat service for Assamese, Manipuri, Bodo, Bengali, or Nepali speech. The gateway should expose <span className="font-bold">/transcribe</span> and return <span className="font-bold">{'{ transcript }'}</span>. Keep it on a trusted network and ask for consent before sending voice.</p><input value={ai4bharatUrl} onChange={event => { setAi4bharatUrl(event.target.value); setAi4bharatSaved(false) }} placeholder="https://your-care-gateway.example/api/ai4bharat" className="elder-input w-full mt-3" inputMode="url" autoComplete="url" /><input type="password" value={ai4bharatToken} onChange={event => { setAi4bharatToken(event.target.value); setAi4bharatSaved(false) }} placeholder="Optional gateway token" className="elder-input w-full mt-3" autoComplete="off" /><button onClick={saveAI4Bharat} className="btn btn-primary elder-action mt-3">Save AI4Bharat connection</button>{ai4bharatSaved && <span className="ml-3 text-emerald-700 font-bold">Saved</span>}</div>
    <div className="mt-6 p-5 rounded-2xl bg-slate-50"><h2 className="text-xl font-black">Gemini API key — prototype only</h2><p className="text-sm text-slate-600 mt-1">Create a restricted key in Google AI Studio and enter it only on this test device. This browser-only MVP stores the key locally; a production app must use a secure backend.</p><input type="password" value={key} onChange={event => { setKey(event.target.value); setSaved(false) }} placeholder="Paste your Gemini API key" className="elder-input w-full mt-3" autoComplete="off" /><button onClick={save} className="btn btn-primary elder-action mt-3">Save Gemini key</button>{saved && <span className="ml-3 text-emerald-700 font-bold">Saved</span>}</div>
    <div className="mt-6 p-5 rounded-2xl border-2 border-teal-100"><h2 className="text-xl font-black">If cloud AI is unavailable</h2><p className="text-slate-600 mt-2">CARE falls back to the browser’s speech feature when available. Its processing location depends on the browser and device.</p></div>
  </div></div>;
}