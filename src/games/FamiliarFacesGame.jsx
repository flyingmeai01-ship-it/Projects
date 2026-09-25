import React, { useState, useEffect } from 'react';
import { logEvent, saveSession, getMemories, saveMemory } from '../db/db';
import { speakText } from '../services/speech';

// Pre-seeded high-contrast North Eastern portraits & landmarks for immediate out-of-the-box play
const DEFAULT_ITEMS = [
  {
    id: 'default-priya',
    name: 'Priya',
    label: 'Your daughter, Priya',
    prompt: 'Can you find Priya?',
    category: 'person',
    // SVG data URIs so there are no broken external images
    image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23fef3c7"/><circle cx="150" cy="115" r="55" fill="%23d97706"/><circle cx="150" cy="110" r="48" fill="%23fde68a"/><circle cx="135" cy="105" r="6" fill="%2378350f"/><circle cx="165" cy="105" r="6" fill="%2378350f"/><path d="M135 125 Q150 140 165 125" stroke="%2378350f" stroke-width="4" fill="none"/><path d="M95 240 C95 190 205 190 205 240 Z" fill="%23b45309"/><circle cx="150" cy="92" r="3" fill="%23b91c1c"/><text x="150" y="275" font-family="sans-serif" font-size="20" font-weight="bold" fill="%2378350f" text-anchor="middle">Priya (Daughter)</text></svg>`,
    distractors: [
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23ecfdf5"/><circle cx="150" cy="115" r="55" fill="%23059669"/><circle cx="150" cy="110" r="48" fill="%23a7f3d0"/><circle cx="135" cy="105" r="6" fill="%23064e3b"/><circle cx="165" cy="105" r="6" fill="%23064e3b"/><path d="M135 125 Q150 135 165 125" stroke="%23064e3b" stroke-width="4" fill="none"/><path d="M95 240 C95 190 205 190 205 240 Z" fill="%23047857"/><text x="150" y="275" font-family="sans-serif" font-size="18" font-weight="bold" fill="%23064e3b" text-anchor="middle">AI Face Variant A</text></svg>`,
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23eff6ff"/><circle cx="150" cy="115" r="55" fill="%232563eb"/><circle cx="150" cy="110" r="48" fill="%23bfdbfe"/><circle cx="135" cy="105" r="6" fill="%231e3a8a"/><circle cx="165" cy="105" r="6" fill="%231e3a8a"/><path d="M135 128 Q150 138 165 128" stroke="%231e3a8a" stroke-width="4" fill="none"/><path d="M95 240 C95 190 205 190 205 240 Z" fill="%231d4ed8"/><text x="150" y="275" font-family="sans-serif" font-size="18" font-weight="bold" fill="%231e3a8a" text-anchor="middle">AI Face Variant B</text></svg>`,
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23fdf4ff"/><circle cx="150" cy="115" r="55" fill="%23c026d3"/><circle cx="150" cy="110" r="48" fill="%23f5d0fe"/><circle cx="135" cy="105" r="6" fill="%23701a75"/><circle cx="165" cy="105" r="6" fill="%23701a75"/><path d="M135 125 Q150 135 165 125" stroke="%23701a75" stroke-width="4" fill="none"/><path d="M95 240 C95 190 205 190 205 240 Z" fill="%23a21caf"/><text x="150" y="275" font-family="sans-serif" font-size="18" font-weight="bold" fill="%23701a75" text-anchor="middle">AI Face Variant C</text></svg>`
    ]
  },
  {
    id: 'default-majuli',
    name: 'Majuli Island',
    label: 'Majuli Island on the Brahmaputra',
    prompt: 'Can you find Majuli Island?',
    category: 'place',
    image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23e0f2fe"/><path d="M0 180 Q80 150 150 180 T300 170 L300 300 L0 300 Z" fill="%2338bdf8"/><path d="M60 210 Q140 185 240 210 Q220 250 80 250 Z" fill="%2386efac"/><path d="M120 185 L135 165 L150 185 Z" fill="%23b45309"/><rect x="130" y="180" width="10" height="15" fill="%23d97706"/><circle cx="230" cy="70" r="30" fill="%23fde047"/><text x="150" y="285" font-family="sans-serif" font-size="19" font-weight="bold" fill="%23075985" text-anchor="middle">Majuli Island</text></svg>`,
    distractors: [
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23fef2f2"/><path d="M0 200 L100 120 L180 200 L240 140 L300 210 L300 300 L0 300 Z" fill="%23f87171"/><circle cx="70" cy="70" r="25" fill="%23fbbf24"/><text x="150" y="285" font-family="sans-serif" font-size="18" font-weight="bold" fill="%23991b1b" text-anchor="middle">AI Hill Landscape</text></svg>`,
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23f0fdf4"/><rect x="40" y="80" width="220" height="160" rx="20" fill="%234ade80"/><rect x="60" y="100" width="180" height="120" fill="%2322c55e"/><text x="150" y="285" font-family="sans-serif" font-size="18" font-weight="bold" fill="%23166534" text-anchor="middle">AI Garden Plot</text></svg>`,
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23fffbeb"/><path d="M30 250 L150 100 L270 250 Z" fill="%23f59e0b"/><rect x="135" y="200" width="30" height="50" fill="%2378350f"/><text x="150" y="285" font-family="sans-serif" font-size="18" font-weight="bold" fill="%2392400e" text-anchor="middle">AI Village Hut</text></svg>`
    ]
  },
  {
    id: 'default-grandma',
    name: 'Grandmother Rina',
    label: 'Grandmother Rina weaving',
    prompt: 'Can you find Grandmother Rina?',
    category: 'person',
    image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23fdf2f8"/><circle cx="150" cy="115" r="55" fill="%239ca3af"/><circle cx="150" cy="110" r="48" fill="%23fed7aa"/><circle cx="135" cy="105" r="6" fill="%2378350f"/><circle cx="165" cy="105" r="6" fill="%2378350f"/><path d="M135 125 Q150 138 165 125" stroke="%2378350f" stroke-width="4" fill="none"/><path d="M95 240 C95 190 205 190 205 240 Z" fill="%23be185d"/><text x="150" y="275" font-family="sans-serif" font-size="19" font-weight="bold" fill="%23831843" text-anchor="middle">Grandmother Rina</text></svg>`,
    distractors: [
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23f0fdfa"/><circle cx="150" cy="115" r="55" fill="%230d9488"/><circle cx="150" cy="110" r="48" fill="%2399f6e4"/><circle cx="135" cy="105" r="6" fill="%23134e4a"/><circle cx="165" cy="105" r="6" fill="%23134e4a"/><path d="M135 125 Q150 135 165 125" stroke="%23134e4a" stroke-width="4" fill="none"/><path d="M95 240 C95 190 205 190 205 240 Z" fill="%230f766e"/><text x="150" y="275" font-family="sans-serif" font-size="18" font-weight="bold" fill="%23134e4a" text-anchor="middle">AI Elder Variant 1</text></svg>`,
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23fefce8"/><circle cx="150" cy="115" r="55" fill="%23ca8a04"/><circle cx="150" cy="110" r="48" fill="%23fef08a"/><circle cx="135" cy="105" r="6" fill="%23713f12"/><circle cx="165" cy="105" r="6" fill="%23713f12"/><path d="M135 128 Q150 138 165 128" stroke="%23713f12" stroke-width="4" fill="none"/><path d="M95 240 C95 190 205 190 205 240 Z" fill="%23a16207"/><text x="150" y="275" font-family="sans-serif" font-size="18" font-weight="bold" fill="%23713f12" text-anchor="middle">AI Elder Variant 2</text></svg>`,
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23f5f3ff"/><circle cx="150" cy="115" r="55" fill="%237c3aed"/><circle cx="150" cy="110" r="48" fill="%23ddd6fe"/><circle cx="135" cy="105" r="6" fill="%234c1d95"/><circle cx="165" cy="105" r="6" fill="%234c1d95"/><path d="M135 125 Q150 135 165 125" stroke="%234c1d95" stroke-width="4" fill="none"/><path d="M95 240 C95 190 205 190 205 240 Z" fill="%236d28d9"/><text x="150" y="275" font-family="sans-serif" font-size="18" font-weight="bold" fill="%234c1d95" text-anchor="middle">AI Elder Variant 3</text></svg>`
    ]
  }
];

// Mock GenAI Distractor Generator function (Generates 3 themed distractors with filter variations)
async function generateAIDistractors(originalImage, label) {
  // Simulate GenAI API latency
  await new Promise((resolve) => setTimeout(resolve, 1400));

  // If the user uploaded a custom image, create 3 styled filter/variation cards
  const palettes = [
    { tint: 'rgba(5, 150, 105, 0.22)', label: 'Similar Tone 1 (Green/Mist)' },
    { tint: 'rgba(217, 119, 6, 0.22)', label: 'Similar Tone 2 (Warm Sun)' },
    { tint: 'rgba(37, 99, 235, 0.22)', label: 'Similar Tone 3 (River/Sky)' }
  ];

  return palettes.map((p, idx) => {
    // Generate SVG overlay representing the AI visual variation
    const svgOverlay = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
      <defs>
        <filter id="f${idx}">
          <feColorMatrix type="hueRotate" values="${(idx + 1) * 75}"/>
          <feColorMatrix type="matrix" values="0.8 0 0 0 0  0 0.8 0 0 0  0 0 0.8 0 0  0 0 0 1 0"/>
        </filter>
      </defs>
      <rect width="300" height="300" fill="%23f3f4f6"/>
      <image href="${originalImage}" width="300" height="300" preserveAspectRatio="xMidYMid slice" filter="url(%23f${idx})"/>
      <rect width="300" height="300" fill="${p.tint}"/>
      <rect y="240" width="300" height="60" fill="rgba(20, 35, 26, 0.85)"/>
      <text x="150" y="275" font-family="sans-serif" font-size="16" font-weight="bold" fill="%23ffffff" text-anchor="middle">AI Variation ${idx + 1}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgOverlay)}`;
  });
}

export default function FamiliarFacesGame({ profile, onDone, onBack }) {
  const [mode, setMode] = useState('play'); // 'play' | 'setup'
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [feedback, setFeedback] = useState(null); // null | 'correct' | 'try-again'
  const [speakingStatus, setSpeakingStatus] = useState('');
  const [startedAt] = useState(Date.now());

  // Setup Form State
  const [uploadPreview, setUploadPreview] = useState(null);
  const [customLabel, setCustomLabel] = useState('');
  const [customName, setCustomName] = useState('');
  const [generatedDistractors, setGeneratedDistractors] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const fileInputRef = useRef(null);

  // Load custom items from IndexedDB or fallback to default
  useEffect(() => {
    async function load() {
      try {
        const customMemories = await getMemories(profile.id);
        if (customMemories && customMemories.length > 0) {
          setItems([...customMemories, ...DEFAULT_ITEMS]);
        } else {
          setItems(DEFAULT_ITEMS);
        }
      } catch (e) {
        console.warn("Failed loading memories from IndexedDB", e);
        setItems(DEFAULT_ITEMS);
      }
    }
    load();
  }, [profile.id]);

  // Shuffle target image with its distractors for current round
  useEffect(() => {
    if (!items.length) return;
    const current = items[currentIndex % items.length];
    const targetOption = { id: 'target', image: current.image, isCorrect: true };
    const distractorOptions = (current.distractors || []).slice(0, 3).map((img, idx) => ({
      id: `distractor-${idx}`,
      image: img,
      isCorrect: false
    }));

    // Shuffle 2x2 cards
    const shuffled = [targetOption, ...distractorOptions].sort(() => Math.random() - 0.5);
    setOptions(shuffled);
    setSelectedId(null);
    setFeedback(null);
  }, [currentIndex, items]);

  const currentItem = items[currentIndex % items.length] || DEFAULT_ITEMS[0];
  const questionPrompt = currentItem.prompt || `Can you find ${currentItem.name}?`;

  function handleSpeakPrompt() {
    speakText(questionPrompt, profile.language, setSpeakingStatus);
  }

  function handleSelectOption(option) {
    if (feedback === 'correct') return; // already solved
    setSelectedId(option.id);

    if (option.isCorrect) {
      setFeedback('correct');
      logEvent(profile.id, 'familiar_face_correct', {
        name: currentItem.name,
        index: currentIndex
      });
      const praise = `Yes! That is ${currentItem.name}. Wonderful!`;
      speakText(praise, profile.language, setSpeakingStatus);
    } else {
      setFeedback('try-again');
      logEvent(profile.id, 'familiar_face_attempt', {
        name: currentItem.name,
        index: currentIndex
      });
      const reassurance = `That is okay. Take your time and let us try again.`;
      speakText(reassurance, profile.language, setSpeakingStatus);
    }
  }

  function handleNextQuestion() {
    if (currentIndex + 1 >= items.length) {
      saveSession({
        profileId: profile.id,
        gameId: 'familiar-faces',
        score: 100,
        correct: items.length,
        rounds: items.length,
        durationSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000))
      });
      onDone?.(profile);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  // --- Caregiver Setup Logic ---
  function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadPreview(event.target.result);
      setGeneratedDistractors([]);
      setSaveStatus('');
    };
    reader.readAsDataURL(file);
  }

  async function handleGenerateAIDistractors() {
    if (!uploadPreview) {
      alert('Please upload a photo first!');
      return;
    }
    setIsGenerating(true);
    setSaveStatus('Generating AI distractors...');
    try {
      const distractors = await generateAIDistractors(uploadPreview, customName || 'Loved One');
      setGeneratedDistractors(distractors);
      setSaveStatus('✓ 3 AI distractors generated successfully!');
    } catch {
      setSaveStatus('Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSaveCustomItem() {
    if (!uploadPreview) {
      alert('Please upload a photo.');
      return;
    }
    const nameClean = customName.trim() || 'Familiar Friend';
    const labelClean = customLabel.trim() || `Your friend, ${nameClean}`;
    const newItem = {
      id: `custom-${Date.now()}`,
      name: nameClean,
      label: labelClean,
      prompt: `Can you find ${nameClean}?`,
      category: 'person',
      image: uploadPreview,
      distractors: generatedDistractors.length > 0 ? generatedDistractors : DEFAULT_ITEMS[0].distractors
    };

    const updated = [newItem, ...items];
    setItems(updated);
    try {
      const userCustomOnly = updated.filter((item) => item.id.startsWith('custom-'));
      localStorage.setItem(`CARE_FAMILIAR_ITEMS_${profile.id}`, JSON.stringify(userCustomOnly));
    } catch (e) {
      console.warn('Local storage write failed', e);
    }

    setSaveStatus('✓ Saved to album! Now available in the game.');
    // Reset form
    setUploadPreview(null);
    setCustomLabel('');
    setCustomName('');
    setGeneratedDistractors([]);
  }

  // ----------------------------------------------------
  // VIEW: CAREGIVER SETUP STATE
  // ----------------------------------------------------
  if (mode === 'setup') {
    return (
      <main className="card elder-card p-6 sm:p-10 max-w-3xl mx-auto bg-[#fffdf9] border-4 border-[#14532d] shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#e2d9c8] pb-4">
          <div>
            <div className="flex items-center gap-2 text-[#14532d]">
              <span className="text-3xl" aria-hidden="true">⚙️</span>
              <span className="text-xs sm:text-sm font-black tracking-widest uppercase">
                Caregiver Setup Mode
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#14231a] mt-1">
              Add Familiar Faces & Places
            </h1>
            <p className="text-base text-[#4a584e]">
              Upload photos of loved ones, local schools, or tea gardens to personalize {profile.name}'s memory journey.
            </p>
          </div>

          <button
            onClick={() => setMode('play')}
            className="btn btn-primary min-h-[58px] px-6 text-lg font-black flex items-center gap-2 self-start sm:self-center"
          >
            <span>▶️ Start Patient Game</span>
          </button>
        </div>

        {/* Upload Form Section */}
        <section className="p-6 rounded-2xl bg-[#fefbf4] border-3 border-[#dfd7c6] space-y-5">
          <h2 className="text-2xl font-black text-[#14231a]">
            1. Upload a New Photo
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            {uploadPreview ? (
              <div className="relative">
                <img
                  src={uploadPreview}
                  alt="Upload Preview"
                  className="w-40 h-40 object-cover rounded-2xl border-4 border-[#14532d] shadow-md"
                />
                <button
                  onClick={() => {
                    setUploadPreview(null);
                    setGeneratedDistractors([]);
                  }}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-8 h-8 font-black flex items-center justify-center text-sm shadow"
                  aria-label="Remove uploaded image"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-44 h-40 border-3 border-dashed border-[#b37418] rounded-2xl bg-[#fffdfa] flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-[#fff9ed] transition"
              >
                <span className="text-4xl mb-1" aria-hidden="true">📷</span>
                <span className="text-base font-bold text-[#7a4c07]">
                  Tap to Choose Photo
                </span>
                <span className="text-xs text-[#92400e]">PNG, JPG up to 5MB</span>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />

            <div className="flex-1 space-y-3 w-full">
              <label className="block text-lg font-black text-[#14231a]">
                Person or Place Name
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Priya or Majuli Island"
                  className="elder-input w-full text-lg mt-1"
                />
              </label>

              <label className="block text-lg font-black text-[#14231a]">
                Description / Relationship
                <input
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="e.g. Your daughter, Priya"
                  className="elder-input w-full text-lg mt-1"
                />
              </label>
            </div>
          </div>

          {/* AI Distractor Generator */}
          <div className="pt-3 border-t-2 border-[#e2d9c8] space-y-3">
            <h3 className="text-xl font-black text-[#14231a] flex items-center gap-2">
              <span>✨</span>
              <span>2. Generative AI Distractors</span>
            </h3>
            <p className="text-base text-[#4a584e]">
              Generates 3 similar visual options to act as gentle choices for the patient.
            </p>

            <button
              onClick={handleGenerateAIDistractors}
              disabled={!uploadPreview || isGenerating}
              className="btn btn-voice w-full min-h-[64px] text-xl font-black flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isGenerating ? '⏳ Generating AI Variations…' : '✨ Generate AI Distractors'}</span>
            </button>

            {/* Generated Distractors Preview */}
            {generatedDistractors.length > 0 && (
              <div className="pt-2">
                <span className="text-base font-bold text-[#14532d] block mb-2">
                  Generated Options Preview (Caregiver Review):
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {generatedDistractors.map((distractor, idx) => (
                    <div
                      key={idx}
                      className="border-3 border-[#c2ddc7] rounded-xl overflow-hidden bg-white p-1"
                    >
                      <img
                        src={distractor}
                        alt={`AI Distractor ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <span className="block text-xs font-bold text-center text-[#4a584e] mt-1">
                        Distractor {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveCustomItem}
            disabled={!uploadPreview}
            className="btn btn-primary w-full min-h-[68px] text-xl font-black flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <span className="text-2xl" aria-hidden="true">💾</span>
            <span>Save to Patient's Album</span>
          </button>

          {saveStatus && (
            <div className="p-3 rounded-xl bg-[#ecfdf5] border-2 border-[#10b981] text-[#065f46] font-bold text-center text-lg">
              {saveStatus}
            </div>
          )}
        </section>

        {/* Existing Items in Album */}
        <section className="space-y-3">
          <h2 className="text-xl font-black text-[#14231a]">
            Active Photo Pool ({items.length} items)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-[#f7f4ed] border-2 border-[#ded1be] flex items-center gap-3"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-14 h-14 object-cover rounded-lg border-2 border-[#14532d]"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-black text-lg truncate">{item.name}</div>
                  <div className="text-xs text-[#5c4728] truncate">{item.label}</div>
                </div>
                {item.id.startsWith('custom-') && (
                  <span className="bg-[#dcfce7] text-[#166534] text-xs font-bold px-2 py-0.5 rounded">
                    Custom
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    );
  }

  // ----------------------------------------------------
  // VIEW: PATIENT PLAY STATE (ELDERLY & DEMENTIA-FRIENDLY)
  // ----------------------------------------------------
  return (
    <main className="card elder-card p-6 sm:p-10 max-w-3xl mx-auto bg-[#fffdf9] border-4 border-[#14532d] shadow-xl space-y-6">
      {/* Top Controls */}
      <div className="flex items-center justify-between gap-4 border-b-2 border-[#e2d9c8] pb-3">
        <button
          onClick={onBack}
          className="btn btn-soft min-h-[56px] px-4 text-lg font-black flex items-center gap-2"
        >
          <span className="text-2xl" aria-hidden="true">⬅️</span>
          <span>Back to Activities</span>
        </button>

        {/* Caregiver Setup Switcher with Explicit Label */}
        <button
          onClick={() => setMode('setup')}
          className="btn btn-soft min-h-[56px] px-4 text-base font-bold flex items-center gap-2"
          aria-label="Open Caregiver Setup to add or edit photos"
        >
          <span className="text-xl" aria-hidden="true">⚙️</span>
          <span>Caregiver Setup</span>
        </button>
      </div>

      {/* Header Prompt with Read Aloud Button */}
      <header className="rounded-2xl bg-[#fefbf2] border-3 border-[#e5d5b5] p-6 space-y-4 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block bg-[#14532d] text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              Familiar Faces & Places • {currentIndex + 1} of {items.length}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-[#14231a] leading-snug">
              {questionPrompt}
            </h1>
          </div>

          <button
            onClick={handleSpeakPrompt}
            className="btn btn-soft flex flex-col items-center justify-center min-h-[72px] px-5 self-center"
            aria-label="Listen to the question read aloud"
          >
            <span className="text-3xl" aria-hidden="true">🔊</span>
            <span className="text-sm font-black mt-1">Read Aloud</span>
          </button>
        </div>

        {speakingStatus && (
          <div className="voice-status text-base text-center py-2" role="status">
            {speakingStatus}
          </div>
        )}
      </header>

      {/* 2x2 Large Image Grid (Ultra-accessible tap targets, min-height 170px) */}
      <section
        className="grid grid-cols-2 gap-4 sm:gap-6 pt-2"
        aria-label="Photo choices"
      >
        {options.map((option, idx) => {
          const isSelected = selectedId === option.id;
          const isSolved = feedback === 'correct' && option.isCorrect;

          let borderClass = 'border-4 border-[#8ba192] hover:border-[#14532d]';
          if (isSolved) {
            borderClass = 'border-6 border-[#16a34a] shadow-xl ring-4 ring-[#86efac]';
          } else if (isSelected && feedback === 'try-again') {
            borderClass = 'border-4 border-[#d97706] opacity-75';
          }

          return (
            <button
              key={option.id}
              onClick={() => handleSelectOption(option)}
              className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#f7f4ed] p-2 transition transform active:scale-95 cursor-pointer min-h-[170px] sm:min-h-[220px] flex items-center justify-center ${borderClass}`}
              aria-label={`Photo option ${idx + 1}`}
            >
              <img
                src={option.image}
                alt={`Photo choice ${idx + 1}`}
                className="w-full h-36 sm:h-48 object-cover rounded-xl sm:rounded-2xl"
              />

              {/* Success Badge */}
              {isSolved && (
                <div className="absolute inset-0 bg-[#16a34a]/30 flex items-center justify-center rounded-2xl sm:rounded-3xl">
                  <span className="text-6xl sm:text-7xl filter drop-shadow" aria-hidden="true">
                    ✅
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </section>

      {/* Gentle Feedback Banner */}
      {feedback === 'correct' && (
        <div className="p-6 rounded-2xl bg-[#ecfdf5] border-4 border-[#16a34a] text-center space-y-3">
          <div className="text-4xl" aria-hidden="true">🌸</div>
          <p className="text-2xl sm:text-3xl font-black text-[#064e3b]">
            Yes! That is {currentItem.name}.
          </p>
          <p className="text-xl text-[#065f46]">
            {currentItem.label} • Wonderful recognition!
          </p>
          <button
            onClick={handleNextQuestion}
            className="btn btn-primary w-full text-2xl min-h-[72px] mt-2 flex items-center justify-center gap-2"
          >
            <span>Next Photo ➡️</span>
          </button>
        </div>
      )}

      {feedback === 'try-again' && (
        <div className="p-5 rounded-2xl bg-[#fefce8] border-3 border-[#ca8a04] text-center space-y-2">
          <div className="text-3xl" aria-hidden="true">💚</div>
          <p className="text-xl sm:text-2xl font-black text-[#713f12]">
            That is okay! Let us look closely and try again.
          </p>
          <p className="text-base text-[#854d0e]">
            Take your time. There is no rush or penalty.
          </p>
        </div>
      )}

      <footer className="text-center text-sm font-bold text-[#64748b] pt-2">
        CARE Visual Memory • Practice recognizing familiar faces and places at your own pace.
      </footer>
    </main>
  );
}

