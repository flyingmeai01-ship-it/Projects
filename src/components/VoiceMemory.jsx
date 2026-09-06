import React, { useEffect, useRef, useState } from 'react';
import { getVoiceNotes, saveVoiceNote } from '../db/db';
import { hasAI4BharatEndpoint, transcribe as transcribeAI4Bharat } from '../services/ai4bharat';
import { hasGeminiKey, transcribe } from '../services/gemini';
import { speakText } from '../services/speech';

export default function VoiceMemory({ profile }) {
  const [recording, setRecording] = useState(false);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState([]);
  const media = useRef(null);
  const recognition = useRef(null);
  const chunks = useRef([]);

  useEffect(() => { getVoiceNotes(profile.id).then(setNotes) }, [profile.id]);

  async function saveTranscript(transcript) {
    const clean = transcript.trim();
    if (!clean) throw new Error('Please write or say a memory before saving.');
    await saveVoiceNote(profile.id, clean);
    setText(clean);
    setNotes(await getVoiceNotes(profile.id));
    setStatus('Saved in this device’s encrypted CARE vault.');
  }

  function reviewTranscript(transcript) {
    const clean = transcript.trim();
    if (!clean) throw new Error('I could not hear a memory. Please try again.');
    setText(clean);
    setStatus('Please check the words below, then press Save memory.');
  }

  async function startBrowserSpeech() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) throw new Error('Browser speech is not available. Configure AI4Bharat or Gemini in Settings, or type the memory below.');
    const r = new Recognition();
    recognition.current = r;
    r.lang = profile.language || 'en-IN';
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onstart = () => { setRecording(true); setStatus(`Listening in ${r.lang}. Speak one short memory now.`) };
    r.onspeechstart = () => setStatus('I hear speech. Finishing your memory…');
    r.onspeechend = () => setStatus('I heard you. Turning your words into text…');
    r.onresult = event => { try { reviewTranscript(event.results[0][0].transcript) } catch (error) { setStatus(error.message) } finally { setRecording(false) } };
    r.onerror = event => { setRecording(false); const messages = { 'no-speech': 'No speech was detected. Move closer to the microphone and try one short sentence.', 'not-allowed': 'Microphone permission is blocked. Allow microphone access for CARE, then try again.', 'audio-capture': 'No working microphone was found. Check the device microphone or type the memory below.', network: 'Browser speech could not reach its recognition service. Configure AI4Bharat or Gemini in Settings.' }; setStatus(messages[event.error] || 'Voice recognition stopped. Please try again slowly, or type the memory below.') };
    r.onend = () => setRecording(false);
    r.start();
    setRecording(true);
    setStatus(`Listening in ${r.lang}. Speak one short memory now.`);
  }

  async function startCloudRecording(kind) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      media.current = recorder;
      chunks.current = [];
      recorder.ondataavailable = event => event.data.size && chunks.current.push(event.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        setStatus(kind === 'ai4bharat' ? 'Using AI4Bharat to understand your words…' : 'Turning your words into text…');
        try {
          const result = kind === 'ai4bharat' ? await transcribeAI4Bharat(blob, profile.language) : await transcribe(blob);
          reviewTranscript(result.transcript || '');
        } catch (error) {
          if (kind === 'ai4bharat' && hasGeminiKey()) {
            setStatus('AI4Bharat was unavailable. Trying Gemini…');
            try { reviewTranscript((await transcribe(blob)).transcript || ''); return } catch (fallbackError) { setStatus(fallbackError.message); return }
          }
          setStatus(error.message);
        }
      };
      recorder.start();
      setRecording(true);
      setStatus(kind === 'ai4bharat' ? 'Listening with AI4Bharat. Speak one short memory.' : 'Listening. Speak one short memory.');
    } catch { setStatus('Please allow microphone access, then try again.') }
  }

  function start() {
    if (hasAI4BharatEndpoint()) return startCloudRecording('ai4bharat');
    if (hasGeminiKey()) return startCloudRecording('gemini');
    return startBrowserSpeech().catch(error => setStatus(error.message));
  }

  function stop() { media.current?.stop(); recognition.current?.stop(); setRecording(false) }
  function speak(value = text) { speakText(value, profile.language, setStatus) }

  return <section className="card p-6 elder-card"><div className="flex items-start justify-between gap-4"><div><h2 className="font-black text-2xl">Tell a memory</h2><p className="text-base text-slate-600 mt-2">Say one short story, name, or happy moment. There are no right or wrong answers.</p></div><div className="text-4xl" aria-hidden="true">🎙️</div></div><div className="mt-5">{!recording ? <button className="btn btn-primary elder-action" onClick={start}>🎤 Start speaking</button> : <button className="btn btn-danger elder-action" onClick={stop}>■ Stop recording</button>}<p className="text-sm text-slate-500 mt-3">{hasAI4BharatEndpoint() ? 'Audio is sent to your configured AI4Bharat gateway for regional-language transcription. Review it before saving.' : hasGeminiKey() ? 'Audio is sent to Gemini for transcription. Review it before saving.' : 'Uses browser speech when available. Configure AI4Bharat or Gemini in Settings for regional-language transcription.'}</p></div>{status && <p className="voice-status mt-4" role="status">{status}</p>}<label className="block mt-5 font-bold text-lg">Check or type the memory</label><div className="flex gap-3 mt-2"><input value={text} onChange={event => setText(event.target.value)} placeholder="For example: I enjoyed Bihu with my family." className="elder-input flex-1" /><button className="btn btn-soft elder-action" onClick={() => saveTranscript(text).catch(error => setStatus(error.message))}>Save memory</button></div>{notes.length > 0 && <div className="mt-6"><h3 className="font-black text-lg">My recent memories</h3><div className="space-y-3 mt-3">{notes.slice(0, 3).map(note => <div key={note.id} className="memory-note"><p>{note.text}</p><button className="text-teal-800 font-bold mt-2" onClick={() => speak(note.text)}>🔊 Read aloud</button></div>)}</div></div>}</section>;
}