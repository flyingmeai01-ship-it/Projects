const configuredUrl = import.meta.env.VITE_AI4BHARAT_URL || '';

export const AI4BHARAT_LANGS = {
  'en-IN': 'eng_Latn',
  'as-IN': 'asm_Beng',
  'mni-IN': 'mni_Mtei',
  'brx-IN': 'brx_Deva',
  'bn-IN': 'ben_Beng',
  'ne-IN': 'npi_Deva'
};

function endpoint() {
  return localStorage.getItem('CARE_AI4BHARAT_URL') || configuredUrl;
}

function token() {
  return localStorage.getItem('CARE_AI4BHARAT_TOKEN') || '';
}

export function hasAI4BharatEndpoint() {
  return Boolean(endpoint());
}

async function request(path, options) {
  const base = endpoint().replace(/\/$/, '');
  const response = await fetch(`${base}/${path}`, {
    ...options,
    headers: {
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...options.headers
    }
  });
  if (!response.ok) throw new Error(`AI4Bharat gateway failed (${response.status})`);
  return response.json();
}

export async function transcribe(file, language = 'en-IN') {
  const form = new FormData();
  form.append('file', file, 'care-memory.webm');
  form.append('language_code', AI4BHARAT_LANGS[language] || language || 'eng_Latn');
  const result = await request('transcribe', { method: 'POST', body: form });
  const transcript = result.transcript || result.text || result.output_text || '';
  if (!transcript.trim()) throw new Error('AI4Bharat returned an empty transcript.');
  return { transcript };
}

export async function translate(text, source, target) {
  const result = await request('translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      source_lang: AI4BHARAT_LANGS[source] || source,
      target_lang: AI4BHARAT_LANGS[target] || target
    })
  });
  return result.translation || result.text || result.output_text || '';
}
