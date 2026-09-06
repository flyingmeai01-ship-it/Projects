export const LANGUAGE_OPTIONS = [
  { value: 'as-IN', label: 'Assamese' },
  { value: 'mni-IN', label: 'Manipuri / Meitei' },
  { value: 'brx-IN', label: 'Bodo' },
  { value: 'bn-IN', label: 'Bengali' },
  { value: 'ne-IN', label: 'Nepali' },
  { value: 'en-IN', label: 'English' }
];

function chooseVoice(language) {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  const normalized = (language || 'en-IN').toLowerCase();
  const base = normalized.split('-')[0];
  return voices.find(voice => voice.lang.toLowerCase() === normalized) ||
    voices.find(voice => voice.lang.toLowerCase().startsWith(`${base}-`)) ||
    voices.find(voice => voice.lang.toLowerCase() === 'en-in') ||
    voices.find(voice => voice.lang.toLowerCase().startsWith('en-')) ||
    voices[0] || null;
}

export function speakText(text, language = 'en-IN', onStatus) {
  if (!text?.trim()) return false;
  if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance !== 'function') {
    onStatus?.('Read aloud is not available in this browser.');
    return false;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = chooseVoice(language);
  if (!voice) onStatus?.('No browser voices are installed. Install an Indic voice or configure AI4Bharat/Gemini in Settings.');
  utterance.voice = voice;
  utterance.lang = voice?.lang || language;
  utterance.rate = 0.82;
  utterance.onstart = () => onStatus?.(`Reading aloud in ${utterance.lang}.`);
  utterance.onend = () => onStatus?.('');
  utterance.onerror = event => onStatus?.(`Read aloud stopped${event.error ? `: ${event.error}` : '.'}`);
  window.speechSynthesis.speak(utterance);
  return true;
}
