import React, { useEffect, useRef, useState } from 'react';
import { getVoiceNotes, saveVoiceNote } from '../db/db';
import { hasAI4BharatEndpoint, transcribe as transcribeAI4Bharat } from '../services/ai4bharat';
import { hasGeminiKey, transcribe } from '../services/gemini';
import { speakText } from '../services/speech';

export default function VoiceMemory({ profile, onBack }) {
  const [recording, setRecording] = useState(false);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState([]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const media = useRef(null);
  const recognition = useRef(null);
  const chunks = useRef([]);

  useEffect(() => {
    getVoiceNotes(profile.id).then(setNotes);
  }, [profile.id]);

  async function saveTranscript(transcript) {
    const clean = transcript.trim();
    if (!clean) {
      setStatus('Please say a memory before saving.');
      return;
    }
    await saveVoiceNote(profile.id, clean);
    setText(clean);
    setSavedSuccess(true);
    setNotes(await getVoiceNotes(profile.id));
    setStatus('✓ Saved safely into your private CARE vault.');
    setTimeout(() => setSavedSuccess(false), 3000);
  }

  function reviewTranscript(transcript) {
    const clean = transcript.trim();
    if (!clean) {
      setStatus('I could not hear speech clearly. Please try again gently.');
      return;
    }
    setText(clean);
    setStatus('Here are the words we heard. Press "Save Memory" when you are happy.');
  }

  async function startBrowserSpeech() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setStatus('Browser speech recognition is not supported on this device. You can type below or configure AI in Settings.');
      return;
    }
    const r = new Recognition();
    recognition.current = r;
    r.lang = profile.language || 'en-IN';
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onstart = () => {
      setRecording(true);
      setStatus('Listening... Please speak your memory slowly.');
    };
    r.onspeechstart = () => setStatus('Listening to your words...');
    r.onspeechend = () => setStatus('Processing your words...');
    r.onresult = (event) => {
      try {
        reviewTranscript(event.results[0][0].transcript);
      } catch (error) {
        setStatus(error.message);
      } finally {
        setRecording(false);
      }
    };
    r.onerror = (event) => {
      setRecording(false);
      const messages = {
        'no-speech': 'No words were heard. Speak a little closer to the device.',
        'not-allowed': 'Microphone access is blocked. Please allow microphone access.',
        'audio-capture': 'No microphone found on this device.',
        network: 'Speech service could not be reached.'
      };
      setStatus(messages[event.error] || 'Recording stopped. Please try again.');
    };
    r.onend = () => setRecording(false);
    r.start();
    setRecording(true);
  }

  async function startCloudRecording(kind) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      media.current = recorder;
      chunks.current = [];
      recorder.ondataavailable = (event) => event.data.size && chunks.current.push(event.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        setStatus('Turning your spoken words into text...');
        try {
          const result =
            kind === 'ai4bharat'
              ? await transcribeAI4Bharat(blob, profile.language)
              : await transcribe(blob);
          reviewTranscript(result.transcript || '');
        } catch (error) {
          if (kind === 'ai4bharat' && hasGeminiKey()) {
            setStatus('AI4Bharat service paused. Trying Gemini...');
            try {
              const res = await transcribe(blob);
              reviewTranscript(res.transcript || '');
              return;
            } catch (fallbackError) {
              setStatus(fallbackError.message);
              return;
            }
          }
          setStatus(error.message);
        }
      };
      recorder.start();
      setRecording(true);
      setStatus('Listening to your voice. Speak at your own comfortable pace.');
    } catch {
      setStatus('Please allow microphone permission to record your voice.');
    }
  }

  function start() {
    setStatus('');
    setSavedSuccess(false);
    if (hasAI4BharatEndpoint()) return startCloudRecording('ai4bharat');
    if (hasGeminiKey()) return startCloudRecording('gemini');
    return startBrowserSpeech().catch((error) => setStatus(error.message));
  }

  function stop() {
    media.current?.stop();
    recognition.current?.stop();
    setRecording(false);
  }

  function speak(value = text) {
    speakText(value, profile.language, setStatus);
  }

  return (
    <main className="card elder-card p-6 sm:p-10 max-w-2xl mx-auto bg-[#fffdf9] border-4 border-[#14532d] shadow-lg space-y-6">
      {onBack && (
        <button
          onClick={onBack}
          className="btn btn-soft min-h-[58px] px-5 text-lg font-black flex items-center gap-2"
        >
          <span className="text-2xl" aria-hidden="true">⬅️</span>
          <span>Back to Activities</span>
        </button>
      )}

      {/* Header with clear literal icon & text */}
      <header className="text-center space-y-2">
        <div className="text-6xl sm:text-7xl mb-1" aria-hidden="true">🎙️</div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#14532d]">
          Tell a Story or Memory
        </h1>
        <p className="text-xl sm:text-2xl text-[#334b3c] leading-relaxed max-w-lg mx-auto">
          Speak softly into the phone. Share a happy memory, a familiar song, or a recipe from home.
        </p>
      </header>

      {/* GIANT MICROPHONE BUTTON WITH LITERAL LABELS */}
      <div className="flex flex-col items-center justify-center py-4">
        {!recording ? (
          <button
            onClick={start}
            className="btn btn-voice w-full sm:w-80 min-h-[90px] rounded-3xl text-2xl font-black flex flex-col items-center justify-center gap-1 shadow-lg"
            aria-label="Tap to start recording speech"
          >
            <span className="text-4xl" aria-hidden="true">🎤</span>
            <span>Tap to Speak</span>
          </button>
        ) : (
          <button
            onClick={stop}
            className="btn btn-danger w-full sm:w-80 min-h-[90px] rounded-3xl text-2xl font-black flex flex-col items-center justify-center gap-1 shadow-lg border-4 border-[#dc2626]"
            aria-label="Tap to stop recording speech"
          >
            <span className="text-4xl" aria-hidden="true">⏹️</span>
            <span>Tap to Finish</span>
          </button>
        )}
      </div>

      {status && (
        <div className="voice-status text-center text-lg sm:text-xl py-3" role="status">
          {status}
        </div>
      )}

      {/* Transcript Review Box (Large, High Contrast 22px text) */}
      <div className="space-y-3 pt-2">
        <label htmlFor="memory-input" className="block text-xl sm:text-2xl font-black text-[#14231a]">
          Your Spoken Words:
        </label>
        <textarea
          id="memory-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Your words will appear here. Or, you can type a memory here."
          rows={3}
          className="elder-input w-full text-xl sm:text-2xl p-4 min-h-[120px] bg-white border-3 border-[#78857c] rounded-2xl leading-relaxed"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {text.trim() && (
            <button
              onClick={() => speak(text)}
              className="btn btn-soft min-h-[68px] text-xl flex items-center justify-center gap-2"
            >
              <span className="text-2xl" aria-hidden="true">🔊</span>
              <span>Listen Aloud</span>
            </button>
          )}

          <button
            onClick={() => saveTranscript(text)}
            disabled={!text.trim()}
            className={`btn btn-primary min-h-[68px] text-xl flex items-center justify-center gap-2 ${
              !text.trim() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <span className="text-2xl" aria-hidden="true">💾</span>
            <span>Save This Memory</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-xl bg-[#dcfce7] border-2 border-[#16a34a] text-[#14532d] font-bold text-center text-xl">
            ✓ Memory saved into your private vault!
          </div>
        )}
      </div>

      {/* Recent Notes Preview */}
      {notes.length > 0 && (
        <div className="pt-6 border-t-2 border-[#d6ccba] space-y-4">
          <h2 className="text-2xl font-black text-[#14231a]">
            Recent Saved Memories
          </h2>
          <div className="space-y-3">
            {notes.slice(0, 2).map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-xl bg-[#f7f3ea] border-2 border-[#ded1be] space-y-2"
              >
                <p className="text-xl font-bold text-[#14231a]">"{note.text}"</p>
                <button
                  onClick={() => speak(note.text)}
                  className="btn btn-soft min-h-[50px] py-1 px-4 text-base font-bold flex items-center gap-2"
                >
                  <span aria-hidden="true">🔊</span>
                  <span>Read aloud</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}