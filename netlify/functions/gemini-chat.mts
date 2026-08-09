/**
 * Demo proxy for Gemini.
 *
 * The studio is a static site, so a key given to the browser is a key given to
 * everyone who opens DevTools. This endpoint keeps GEMINI_API_KEY in Netlify's
 * environment and is the only thing that ever sees it, which lets visitors try
 * the demo without supplying a key of their own.
 *
 * Visitors who save their own key in Settings never reach this function — the
 * client calls Gemini directly in that case.
 */

// A shared key is a shared bill, so the proxy only does what the demo needs.
const ALLOWED_MODELS = new Set(['gemini-3.5-flash', 'gemini-3.1-flash-lite']);
const MAX_OUTPUT_TOKENS = 2048;
const MAX_MESSAGE_CHARS = 8000;
const MAX_HISTORY_MESSAGES = 20;
const MAX_SYSTEM_PROMPT_CHARS = 4000;

type Part = { text?: unknown };
type Turn = { role?: unknown; parts?: unknown };

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

/** Keeps only well-formed {role, parts:[{text}]} turns, trimmed to the tail. */
const sanitizeHistory = (history: unknown) => {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-MAX_HISTORY_MESSAGES)
    .filter((turn: Turn) => turn && (turn.role === 'user' || turn.role === 'model') && Array.isArray(turn.parts))
    .map((turn: Turn) => ({
      role: turn.role as 'user' | 'model',
      parts: (turn.parts as Part[])
        .filter((p) => p && typeof p.text === 'string')
        .map((p) => ({ text: String(p.text).slice(0, MAX_MESSAGE_CHARS) })),
    }))
    .filter((turn) => turn.parts.length > 0);
};

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Signals the client to fall back to asking for a personal key.
    return json({ error: 'demo_key_unavailable' }, 503);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Request body must be JSON.' }, 400);
  }

  const message = typeof payload.message === 'string' ? payload.message.trim() : '';
  if (!message) return json({ error: 'A message is required.' }, 400);
  if (message.length > MAX_MESSAGE_CHARS) {
    return json({ error: `Message exceeds ${MAX_MESSAGE_CHARS} characters.` }, 413);
  }

  const model = typeof payload.model === 'string' ? payload.model : 'gemini-3.5-flash';
  if (!ALLOWED_MODELS.has(model)) {
    return json({ error: `Model "${model}" is not available in the demo.` }, 400);
  }

  const requested = (payload.generationConfig ?? {}) as Record<string, unknown>;
  const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
  const generationConfig: Record<string, unknown> = {
    temperature: Math.min(Math.max(num(requested.temperature, 1), 0), 2),
    topP: Math.min(Math.max(num(requested.topP, 0.95), 0), 1),
    // Clamped rather than honoured: the demo pays for these tokens.
    maxOutputTokens: Math.min(num(requested.maxOutputTokens, 1024), MAX_OUTPUT_TOKENS),
  };
  if (Array.isArray(requested.stopSequences) && requested.stopSequences.length) {
    generationConfig.stopSequences = requested.stopSequences
      .filter((s: unknown) => typeof s === 'string')
      .slice(0, 5);
  }

  const body: Record<string, unknown> = {
    contents: [...sanitizeHistory(payload.history), { role: 'user', parts: [{ text: message }] }],
    generationConfig,
  };

  const systemPrompt =
    typeof payload.systemInstruction === 'string' ? payload.systemInstruction.trim() : '';
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt.slice(0, MAX_SYSTEM_PROMPT_CHARS) }] };
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(25_000),
      }
    );
  } catch {
    return json({ error: 'The demo could not reach Gemini. Please try again.' }, 502);
  }

  const result = (await upstream.json().catch(() => ({}))) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    promptFeedback?: { blockReason?: string };
    error?: { message?: string; status?: string };
  };

  if (!upstream.ok) {
    // Never surface Google's message: it can echo key and project details.
    console.error('Gemini demo proxy error', upstream.status, result.error?.status);
    const tooBusy = upstream.status === 429;
    return json(
      {
        error: tooBusy
          ? 'The shared demo key is rate limited right now. Add your own key in Settings to keep going.'
          : 'Gemini rejected the request.',
      },
      tooBusy ? 429 : 502
    );
  }

  if (result.promptFeedback?.blockReason) {
    return json({ error: `Request blocked by Gemini safety filters.` }, 400);
  }

  const text = (result.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? '')
    .join('')
    .trim();

  if (!text) return json({ error: 'Gemini returned an empty response.' }, 502);

  return json({ text }, 200);
};
