# CARE — Cultural Dementia Support MVP

Offline-first React/Vite PWA MVP aligned to the CARE architecture discussed for SIH: local profile + IndexedDB vault, C++/mbedTLS AES-256-GCM WASM layer, five culturally-oriented memory games, lightweight adaptive analytics, and optional Gemini speech transcription.

## Run
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## C++ vault
`cpp/vault_core.cpp` contains the mbedTLS AES-256-GCM implementation exposed through Emscripten. The web vault loads `public/wasm/vault_core.js` when available and keeps WebCrypto as a compatibility fallback for existing local records. To rebuild the C++ module, activate Emscripten, ensure the mbedTLS WASM archive exists, and run `scripts/build-wasm.sh`.

> Security note: the demo derives the AES key from a local secret with SHA-256. For production, use a proper key lifecycle and CSPRNG, device-bound key storage, authenticated vault metadata, secure wipe, and independent security review. The current C++ demo uses `rand()` for IV generation and must be replaced with a cryptographically secure random source before production.

## Gemini voice transcription
Set a Gemini API key inside **Settings** to enable the voice layer. Audio is sent to Gemini only to create a reviewable transcript; the completed note is then encrypted locally. Gemini free-tier inputs may be used to improve Google products, so use it only with informed consent. The browser stores the key locally for this MVP; production must proxy requests through a backend so the secret is not exposed.

## AI4Bharat regional-language voice
CARE can use a self-hosted AI4Bharat gateway for regional-language transcription. Configure `VITE_AI4BHARAT_URL` at build time or enter the gateway URL in **Settings**. The gateway should keep model credentials server-side and expose:

```text
POST /transcribe
multipart form: file, language_code
response: { "transcript": "..." }

POST /translate
json: { "text": "...", "source_lang": "eng_Latn", "target_lang": "asm_Beng" }
response: { "translation": "..." }
```

The adapter maps Assamese (`asm_Beng`), Manipuri/Meitei (`mni_Mtei`), Bodo (`brx_Deva`), Bengali (`ben_Beng`), and Nepali (`npi_Deva`). The browser falls back to Gemini or browser speech when the gateway is unavailable. Review transcripts before saving; this feature is for memory notes and accessibility, not diagnosis.

## MVP modules
- Stage 1A: React + Tailwind responsive UI
- Stage 1B: Vite PWA/offline shell
- Stage 1C: local IndexedDB profile/activity store + C++ AES-GCM source
- Stage 3A: five Phaser-ready game concepts implemented as lightweight React games
- Stage 3A-3: local recommendation + difficulty signal scaffold
- Voice: optional Gemini STT with browser-speech fallback and mandatory transcript review
- Analytics: local engagement, scores, completion and recommendation signals

## Important clinical boundary
This is a cognitive-stimulation/support prototype, not a diagnostic or treatment system. Analytics should never be presented as a dementia diagnosis or medical score.
