export function hasGeminiKey() { return Boolean(localStorage.getItem('CARE_GEMINI_KEY')) }

export async function transcribe(file) {
  const apiKey = localStorage.getItem('CARE_GEMINI_KEY');
  if (!apiKey) throw new Error('Gemini API key not configured. Add it in Settings on this device.');
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });
  const audio = new File([file], 'care-memory.webm', { type: file.type || 'audio/webm' });
  let uploaded;
  try {
    uploaded = await ai.files.upload({ file: audio, config: { mimeType: audio.type } });
    const interaction = await ai.interactions.create({ model: 'gemini-3.5-transcribe', input: [{ type: 'audio', uri: uploaded.uri, mime_type: uploaded.mimeType || audio.type }] });
    const transcript = interaction.outputText || interaction.output_text || '';
    if (!transcript.trim()) throw new Error('Gemini could not produce a transcript. Please try again.');
    return { transcript };
  } catch (error) {
    if (error?.status === 429) throw new Error('Gemini free-tier limit reached. Please try again later.');
    throw new Error(error?.message || 'Gemini transcription failed.');
  } finally {
    if (uploaded?.name) await ai.files.delete({ name: uploaded.name }).catch(() => {});
  }
}
