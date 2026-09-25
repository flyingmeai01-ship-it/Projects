import React, { useState, useRef, useEffect } from 'react';
import { saveMemory, getMemories } from '../db/db';
import { generateVariations } from '../services/imageGen';

export default function MemoryBuilder({ profile, onBack }) {
  const [items, setItems] = useState([]);
  const [uploadPreview, setUploadPreview] = useState(null);
  
  // Form State
  const [personName, setPersonName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [language, setLanguage] = useState(profile.language || 'en');
  const [context, setContext] = useState('');
  
  // AI Generation State
  const [generatedDistractors, setGeneratedDistractors] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasConsent, setHasConsent] = useState(false); // PRIVACY FLAG
  const [saveStatus, setSaveStatus] = useState('');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    getMemories(profile.id).then(setItems);
  }, [profile.id]);

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
    
    // Privacy Check
    if (!hasConsent) {
      alert('You must provide explicit consent before sending photos to an external AI service.');
      return;
    }

    setIsGenerating(true);
    setSaveStatus('Generating AI variations...');
    try {
      const distractors = await generateVariations({
        originalImage: uploadPreview,
        subject: personName || 'Loved One',
        description: relationship,
        context: context,
        language: language,
        count: 3,
        hasExplicitConsent: hasConsent
      });
      setGeneratedDistractors(distractors);
      setSaveStatus('✓ AI memory options generated successfully. Please review below.');
    } catch (e) {
      console.error(e);
      setSaveStatus(`Generation failed: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSaveMemory() {
    if (!uploadPreview) {
      alert('Please upload a photo.');
      return;
    }
    const nameClean = personName.trim() || 'Familiar Friend';
    const relClean = relationship.trim() || `Your friend, ${nameClean}`;
    
    const newItem = {
      name: nameClean,
      label: relClean,
      prompt: `Can you find ${nameClean}?`,
      category: 'person',
      context: context,
      language: language,
      image: uploadPreview,
      distractors: generatedDistractors // AI options for game use
    };

    try {
      await saveMemory(profile.id, newItem);
      const updatedMemories = await getMemories(profile.id);
      setItems(updatedMemories);
      setSaveStatus('✓ Saved to album! Now available in the games.');
      
      // Reset form
      setUploadPreview(null);
      setPersonName('');
      setRelationship('');
      setContext('');
      setGeneratedDistractors([]);
      setHasConsent(false);
    } catch (e) {
      console.warn('DB write failed', e);
      setSaveStatus('Failed to save memory.');
    }
  }

  return (
    <main className="card elder-card p-6 sm:p-10 max-w-4xl mx-auto bg-[#fffdf9] border-4 border-[#14532d] shadow-xl space-y-6">
      <div className="flex items-center justify-between gap-4 border-b-2 border-[#e2d9c8] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[#14532d]">
            <span className="text-3xl" aria-hidden="true">🛠️</span>
            <span className="text-xs sm:text-sm font-black tracking-widest uppercase">
              Caregiver Only
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#14231a] mt-1">
            Build a Family Memory
          </h1>
          <p className="text-base text-[#4a584e]">
            Safely add personal photos and create AI-assisted games for {profile.name}.
          </p>
        </div>
        <button
          onClick={onBack}
          className="btn btn-soft min-h-[56px] px-6 text-lg font-black"
        >
          Close
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column: Form & Privacy */}
        <section className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#fefbf4] border-3 border-[#dfd7c6] space-y-4">
            <h2 className="text-xl font-black text-[#14231a]">1. Upload Photo</h2>
            
            {uploadPreview ? (
              <div className="relative">
                <img src={uploadPreview} alt="Upload" className="w-full h-48 object-cover rounded-xl border-4 border-[#14532d]" />
                <button
                  onClick={() => setUploadPreview(null)}
                  className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-10 h-10 font-black flex items-center justify-center text-lg shadow-lg"
                  aria-label="Remove image"
                >✕</button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-4 border-dashed border-[#b37418] rounded-xl bg-[#fffdfa] flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-[#fff9ed] transition"
              >
                <span className="text-5xl mb-2" aria-hidden="true">📷</span>
                <span className="text-lg font-bold text-[#7a4c07]">Tap to Choose Photo</span>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />

            <label className="block text-base font-bold text-[#14231a]">
              Person's Name
              <input value={personName} onChange={(e) => setPersonName(e.target.value)} className="elder-input w-full mt-1 text-base" placeholder="e.g. Mina" />
            </label>

            <label className="block text-base font-bold text-[#14231a]">
              Relationship / Nickname
              <input value={relationship} onChange={(e) => setRelationship(e.target.value)} className="elder-input w-full mt-1 text-base" placeholder="e.g. Granddaughter" />
            </label>
            
            <label className="block text-base font-bold text-[#14231a]">
              Context (Place or Event)
              <input value={context} onChange={(e) => setContext(e.target.value)} className="elder-input w-full mt-1 text-base" placeholder="e.g. Family home in Assam" />
            </label>
          </div>
        </section>

        {/* Right Column: AI Generation & Review */}
        <section className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#ecfdf5] border-3 border-[#a7f3d0] space-y-4">
            <h2 className="text-xl font-black text-[#064e3b]">2. Create AI Memory Game Options</h2>
            <p className="text-sm text-[#065f46]">
              To create multiple choice questions, the AI needs to generate slightly altered variations of the photo. 
            </p>

            <label className="flex items-start gap-3 p-3 bg-white rounded-lg border-2 border-[#6ee7b7] cursor-pointer">
              <input 
                type="checkbox" 
                checked={hasConsent}
                onChange={(e) => setHasConsent(e.target.checked)}
                className="w-6 h-6 mt-1 text-[#059669] focus:ring-[#059669]" 
              />
              <span className="text-sm font-bold text-[#064e3b]">
                I explicitly consent to send this photo to the external AI service to generate memory distractors. 
                <span className="block text-xs font-normal mt-1 text-[#047857]">(Keep unchecked to use local-only mode)</span>
              </span>
            </label>

            <button
              onClick={handleGenerateAIDistractors}
              disabled={!uploadPreview || isGenerating || (!hasConsent && false) /* Mock provider allows local */}
              className="btn btn-primary w-full min-h-[56px] text-lg font-black flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isGenerating ? '⏳ Generating...' : '✨ Generate AI Distractors'}</span>
            </button>
          </div>

          {/* Validation & Review Screen */}
          <div className="p-5 rounded-2xl bg-[#f0f9ff] border-3 border-[#bae6fd] space-y-4">
             <h2 className="text-xl font-black text-[#0369a1]">3. Review & Validate</h2>
             {generatedDistractors.length > 0 ? (
                <>
                  <p className="text-sm font-bold text-[#0c4a6e]">Are these AI-generated options appropriate?</p>
                  <div className="grid grid-cols-3 gap-2">
                    {generatedDistractors.map((img, idx) => (
                      <div key={idx} className="border-2 border-[#7dd3fc] rounded-lg overflow-hidden bg-white">
                        <img src={img} alt={`Variant ${idx+1}`} className="w-full h-20 object-cover" />
                      </div>
                    ))}
                  </div>
                </>
             ) : (
                <p className="text-sm text-[#0c4a6e]">Generate options above to review them before saving.</p>
             )}

             <button
              onClick={handleSaveMemory}
              disabled={!uploadPreview}
              className="btn btn-voice w-full min-h-[64px] text-xl font-black mt-2 disabled:opacity-40"
             >
               💾 Save Validated Memory
             </button>
             {saveStatus && (
              <div className="p-3 rounded-xl bg-white text-center text-sm font-bold text-[#0369a1]">
                {saveStatus}
              </div>
             )}
          </div>
        </section>
      </div>
      
      {/* Existing Items */}
      <section className="pt-4 border-t-2 border-[#e2d9c8]">
        <h2 className="text-lg font-black text-[#14231a] mb-3">Saved Family Memories ({items.length})</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {items.map((item) => (
            <div key={item.id} className="p-2 rounded-xl bg-[#f7f4ed] border-2 border-[#ded1be] flex items-center gap-3">
              <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg border-2 border-[#14532d]" />
              <div className="flex-1 min-w-0">
                <div className="font-black text-sm truncate">{item.name}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

