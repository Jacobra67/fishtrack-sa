// slip-ocr — Netlify serverless function
// Takes a receipt/slip photo, uses Gemini vision to read it and suggest a
// spending category, and returns structured JSON. The Gemini API key lives in
// the GEMINI_API_KEY environment variable (Netlify site settings) and is NEVER
// exposed to the browser.
//
// POST body (JSON):
//   { "imageBase64": "<base64 without data: prefix>", "mimeType": "image/jpeg",
//     "categories": [{ "name": "Kos", "code": "KO" }, ...] }
//
// Response (JSON):
//   { ok: true, data: { vendor, date, total, vat, currency, category, code,
//                       confidence, summary } }

// Tried in order; each is retried once on a transient overload before moving on.
// Lite variants are less likely to be rate-limited under load.
const MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3.6-flash',
];

exports.handler = async function (event) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ ok: false, error: 'Use POST.' }) };
  }

  const KEY = process.env.GEMINI_API_KEY;
  if (!KEY) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ ok: false, error: 'Server not configured: GEMINI_API_KEY missing.' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: cors, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  const imageBase64 = body.imageBase64;
  const mimeType = body.mimeType || 'image/jpeg';
  const categories = Array.isArray(body.categories) && body.categories.length ? body.categories : DEFAULT_CATEGORIES;
  if (!imageBase64) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ ok: false, error: 'imageBase64 required.' }) };
  }

  const catList = categories.map((c) => `- ${c.name} (code: ${c.code})`).join('\n');
  const prompt = [
    'You are reading a South African till slip / invoice / receipt photo.',
    'Extract the fields and pick the single best-fit spending category from the list.',
    'Return ONLY a compact JSON object, no markdown, with exactly these keys:',
    '{"vendor":string,"date":"YYYY-MM-DD"|null,"total":number|null,"vat":number|null,',
    '"currency":string,"category":string,"code":string,"confidence":"high"|"medium"|"low","summary":string}',
    'Rules:',
    '- vendor = shop/supplier name. total = final amount paid (grand total incl VAT).',
    '- vat = VAT/BTW amount if shown, else null. currency defaults to "ZAR".',
    '- category MUST be one of the names below; code MUST be its matching code.',
    '- If unsure of the category, choose the closest and set confidence "low".',
    '- summary = max 8 words describing what was bought.',
    '',
    'Categories:',
    catList,
  ].join('\n');

  const payload = {
    contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: imageBase64 } }] }],
    generationConfig: { temperature: 0, responseMimeType: 'application/json' },
  };

  // Netlify sync functions are killed at ~10s. Stay under that: try models in
  // sequence, each with its own abort timeout, and stop once the budget is spent.
  const DEADLINE_MS = 8500;
  const started = Date.now();
  const remaining = () => DEADLINE_MS - (Date.now() - started);

  let lastErr = 'unknown error';
  let overloaded = false;
  for (const model of MODELS) {
    if (remaining() < 2500) break; // not enough time for another attempt
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), Math.min(remaining(), 7500));
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctrl.signal }
      );
      clearTimeout(timer);
      const json = await resp.json();
      if (!resp.ok) {
        lastErr = (json.error && json.error.message) || `HTTP ${resp.status}`;
        if (resp.status === 503 || resp.status === 429) overloaded = true;
        continue; // try the next model while the budget allows
      }
      const parts = (((json.candidates || [])[0] || {}).content || {}).parts || [];
      const text = parts.map((p) => p.text || '').join('').trim();
      const data = safeParse(text);
      if (!data) { lastErr = 'Could not parse model output.'; continue; }
      // Normalise + validate the category against the allowed list.
      const match = categories.find((c) => c.name.toLowerCase() === String(data.category || '').toLowerCase())
        || categories.find((c) => c.code.toLowerCase() === String(data.code || '').toLowerCase());
      if (match) { data.category = match.name; data.code = match.code; }
      data.currency = data.currency || 'ZAR';
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, data, model }) };
    } catch (e) {
      clearTimeout(timer);
      lastErr = (e && e.name === 'AbortError') ? 'model timed out' : String((e && e.message) || e);
      if (e && e.name === 'AbortError') overloaded = true;
      continue;
    }
  }
  return { statusCode: 502, headers: cors, body: JSON.stringify({ ok: false, error: lastErr, overloaded }) };
};

function safeParse(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

// Placeholder categories + codes. Replace with Kinder Ark's real chart of codes
// once the sister confirms them. Kept here so the function works standalone.
const DEFAULT_CATEGORIES = [
  { name: 'Kos & Verversings', code: 'KOS' },
  { name: 'Mediese / Dokter', code: 'MED' },
  { name: 'Brandstof', code: 'BRA' },
  { name: 'Skoonmaak', code: 'SKM' },
  { name: 'Opvoedkundig / Speelgoed', code: 'OPV' },
  { name: 'Munisipaliteit / Dienste', code: 'MUN' },
  { name: 'Onderhoud & Herstel', code: 'OND' },
  { name: 'Kantoor / Admin', code: 'KAN' },
  { name: 'Ander', code: 'AND' },
];
