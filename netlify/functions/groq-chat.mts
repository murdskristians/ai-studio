/**
 * Demo proxy for Groq.
 *
 * The studio is a static site, so a key given to the browser is a key given to
 * everyone who opens DevTools. This endpoint keeps GROQ_API_KEY in Netlify's
 * environment and is the only thing that ever sees it, which lets visitors try
 * the demo without supplying a key of their own.
 *
 * Visitors who save their own key in Settings never reach this function — the
 * client calls Groq directly in that case.
 */

// Kept in step with src/constants/models.ts. Verified against
// https://api.groq.com/openai/v1/models — an id that has been retired still
// looks perfectly valid in source and only fails when someone sends a message.
const ALLOWED_MODELS = new Set([
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b',
]);
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

/**
 * Mirrors supportsReasoningFormat in src/constants/models.ts. Without
 * `reasoning_format: hidden`, qwen returns its chain of thought as
 * `<think>…</think>` inside the reply; with it, Groq strips the thinking out.
 * It cannot be sent unconditionally — the llama models reject the parameter
 * with HTTP 400.
 */
const REASONING_MODELS = new Set([
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b',
]);

// A shared key is a shared bill, so the proxy only does what the demo needs.
// Reasoning models get a larger allowance because the budget has to cover the
// thinking as well as the reply — qwen spends past 1k tokens before it starts
// answering, and a budget that runs out mid-thought returns nothing at all.
const MAX_OUTPUT_TOKENS = 2048;
const MAX_OUTPUT_TOKENS_REASONING = 4096;
const DEFAULT_OUTPUT_TOKENS = 1024;
const DEFAULT_OUTPUT_TOKENS_REASONING = 2560;
const MAX_MESSAGE_CHARS = 8000;
const MAX_HISTORY_MESSAGES = 20;
const MAX_SYSTEM_PROMPT_CHARS = 4000;

type Turn = { role?: unknown; content?: unknown };

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

/** Keeps only well-formed {role, content} turns, trimmed to the tail. */
const sanitizeHistory = (history: unknown) => {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-MAX_HISTORY_MESSAGES)
    .filter(
      (turn: Turn) =>
        turn &&
        (turn.role === 'user' || turn.role === 'assistant') &&
        typeof turn.content === 'string' &&
        turn.content.trim().length > 0
    )
    .map((turn: Turn) => ({
      role: turn.role as 'user' | 'assistant',
      content: String(turn.content).slice(0, MAX_MESSAGE_CHARS),
    }));
};

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const apiKey = process.env.GROQ_API_KEY;
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

  const model = typeof payload.model === 'string' ? payload.model : DEFAULT_MODEL;
  if (!ALLOWED_MODELS.has(model)) {
    return json({ error: `Model "${model}" is not available in the demo.` }, 400);
  }

  const requested = (payload.generationConfig ?? {}) as Record<string, unknown>;
  const num = (v: unknown, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback;

  const messages: { role: string; content: string }[] = [];
  const systemPrompt =
    typeof payload.systemInstruction === 'string' ? payload.systemInstruction.trim() : '';
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt.slice(0, MAX_SYSTEM_PROMPT_CHARS) });
  }
  messages.push(...sanitizeHistory(payload.history));
  messages.push({ role: 'user', content: message });

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: Math.min(Math.max(num(requested.temperature, 1), 0), 2),
    top_p: Math.min(Math.max(num(requested.topP, 0.95), 0), 1),
    // Clamped rather than honoured: the demo pays for these tokens.
    max_completion_tokens: Math.min(
      num(
        requested.maxOutputTokens,
        REASONING_MODELS.has(model) ? DEFAULT_OUTPUT_TOKENS_REASONING : DEFAULT_OUTPUT_TOKENS
      ),
      REASONING_MODELS.has(model) ? MAX_OUTPUT_TOKENS_REASONING : MAX_OUTPUT_TOKENS
    ),
  };
  if (Array.isArray(requested.stopSequences) && requested.stopSequences.length) {
    body.stop = requested.stopSequences.filter((s: unknown) => typeof s === 'string').slice(0, 4);
  }
  if (REASONING_MODELS.has(model)) {
    body.reasoning_format = 'hidden';
  }

  let upstream: Response;
  try {
    upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    return json({ error: 'The demo could not reach Groq. Please try again.' }, 502);
  }

  const result = (await upstream.json().catch(() => ({}))) as {
    choices?: { message?: { content?: string }; finish_reason?: string }[];
    error?: { message?: string; code?: string; type?: string };
  };

  if (!upstream.ok) {
    // Never surface Groq's message: it can echo key and account details.
    console.error('Groq demo proxy error', upstream.status, result.error?.code ?? result.error?.type);

    if (upstream.status === 429) {
      return json(
        { error: 'The shared demo key is rate limited right now. Add your own key in Settings to keep going.' },
        429
      );
    }

    // A key can be present but unusable, so report that as "no demo key" and
    // let the client ask for a personal one instead of dead-ending.
    const rejectedKey =
      upstream.status === 401 ||
      upstream.status === 403 ||
      result.error?.code === 'invalid_api_key' ||
      /api[ _-]?key/i.test(result.error?.message ?? '');

    if (rejectedKey) return json({ error: 'demo_key_unavailable' }, 503);

    return json({ error: 'Groq rejected the request.' }, 502);
  }

  const text = (result.choices?.[0]?.message?.content ?? '').trim();

  if (!text) {
    // A reasoning model can burn the whole allowance thinking and return
    // nothing, which is a budget problem rather than a fault.
    if (result.choices?.[0]?.finish_reason === 'length') {
      return json(
        { error: 'The model ran out of room before answering. Try a shorter prompt or a different model.' },
        502
      );
    }
    return json({ error: 'Groq returned an empty response.' }, 502);
  }

  return json({ text }, 200);
};
