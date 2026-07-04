import { OpenAIContentGenerator } from './packages/core/dist/src/core/providers/openaiContentGenerator.js';

const generator = new OpenAIContentGenerator({
  providerId: 'openai-compatible',
  baseUrl: 'http://localhost:3001',
  apiKey: 'freellmapi-5a99344e472b1664845bd9ebec55d21409771f4626af2b5c',
});

const request = {
  model: 'auto',
  contents: [{ role: 'user', parts: [{ text: 'hey' }] }],
  config: {},
};

console.log('Starting stream...');
const t0 = Date.now();

const stream = await generator.generateContentStream(request, 'test-id', 'user');
let chunkCount = 0;
let text = '';
let lastFinishReason = null;

for await (const chunk of stream) {
  chunkCount++;
  const candidate = chunk.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  const fr = candidate?.finishReason;
  const delta = parts.map(p => p.text ?? '').join('');
  if (delta) text += delta;
  if (fr) lastFinishReason = fr;
  if (chunkCount <= 5 || fr) {
    process.stdout.write(`chunk ${chunkCount}: fr=${fr ?? 'none'} parts=${parts.length} delta="${delta.slice(0,30)}"\n`);
  }
}

console.log(`\nDone in ${Date.now()-t0}ms`);
console.log(`Total chunks: ${chunkCount}`);
console.log(`Last finishReason: ${lastFinishReason}`);
console.log(`Text (first 100): ${text.slice(0, 100)}`);
