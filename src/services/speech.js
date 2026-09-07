export const LANGUAGE_OPTIONS = [
  { value: 'as-IN', label: 'Assamese' },
  { value: 'mni-IN', label: 'Manipuri / Meitei' },
  { value: 'brx-IN', label: 'Bodo' },
  { value: 'bn-IN', label: 'Bengali' },
  { value: 'ne-IN', label: 'Nepali' },
  { value: 'en-IN', label: 'English' }
];

function chooseVoice(language, voices = window.speechSynthesis.getVoices()) {
  if (!('speechSynthesis' in window)) return null;
  const normalized = (language || 'en-IN').toLowerCase();
  const base = normalized.split('-')[0];
  const aliases = {
    'as-in': ['as-in', 'asm-beng'],
    'mni-in': ['mni-in', 'mni-mtei', 'mni-beng'],
    'brx-in': ['brx-in', 'brx-deva'],
    'bn-in': ['bn-in', 'ben-beng'],
    'ne-in': ['ne-in', 'npi-deva']
  }[normalized] || [normalized];
  return voices.find(voice => aliases.includes(voice.lang.toLowerCase())) ||
    voices.find(voice => voice.lang.toLowerCase().startsWith(`${base}-`)) ||
    voices.find(voice => voice.lang.toLowerCase() === 'en-in') ||
    voices.find(voice => voice.lang.toLowerCase().startsWith('en-')) ||
    voices[0] || null;
}

function availableVoices() {
  const current = window.speechSynthesis.getVoices();
  if (current.length) return Promise.resolve(current);
  return new Promise(resolve => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.speechSynthesis.removeEventListener('voiceschanged', finish);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', finish, { once: true });
    window.setTimeout(finish, 700);
  });
}

export async function speakText(text, language = 'en-IN', onStatus) {
  if (!text?.trim()) return false;
  if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance !== 'function') {
    onStatus?.('Read aloud is not available in this browser.');
    return false;
  }
  window.speechSynthesis.cancel();
  const voices = await availableVoices();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = chooseVoice(language, voices);
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
