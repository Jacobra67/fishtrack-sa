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
// Lite variants first: faster and far less prone to overload, plenty accurate
// for reading a till slip. Heavier models are kept as fallbacks.
const MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash',
  'gemini-flash-latest',
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

  const catList = categories.map((c) => `- ${c.code} = ${c.name}${c.g ? ` [${c.g}]` : ''}`).join('\n');
  const prompt = [
    'You are reading a South African till slip / invoice / receipt photo.',
    'Extract the fields and pick the single best-fit spending category from the list.',
    'Return ONLY a compact JSON object, no markdown, with exactly these keys:',
    '{"vendor":string,"date":"YYYY-MM-DD"|null,"total":number|null,"vat":number|null,',
    '"currency":string,"category":string,"code":string,"confidence":"high"|"medium"|"low","summary":string}',
    'Rules:',
    '- vendor = shop/supplier name. total = final amount paid (grand total incl VAT).',
    '- The photo may be a CARD TRANSACTION RECORD / bank card slip instead of a till slip.',
    '  On those, the line labelled AMOUNT (or TOTAL / BEDRAG / TOTAAL) IS the total. Always return it.',
    '- Numbers MUST be plain JSON numbers: no currency symbol, no thousands separator,',
    '  a dot for the decimal point. "R1,187.84" and "R1 187,84" both become 1187.84.',
    '- Only use null for total if no amount is legible anywhere on the slip.',
    '- vat = VAT/BTW amount if shown, else null. currency defaults to "ZAR".',
    '- code MUST be copied exactly from the list below (format "0000/000");',
    '  category MUST be that code\'s name, copied exactly.',
    '- If unsure of the category, choose the closest and set confidence "low".',
    '- If nothing on the list fits, use code "4550/100" with confidence "low".',
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
      const match = categories.find((c) => c.code === String(data.code || '').trim())
        || categories.find((c) => c.name.toLowerCase() === String(data.category || '').toLowerCase());
      if (match) { data.category = match.name; data.code = match.code; }
      data.currency = data.currency || 'ZAR';
      // Models sometimes hand back "R1 187,84" or "1,187.84" instead of a number.
      // Coerce here so the browser's number input can always accept it.
      data.total = toNum(data.total);
      data.vat = toNum(data.vat);
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

// Coerce a model-supplied amount into a plain number. Handles "R1 187,84",
// "1,187.84", "R 1187.84" and similar. Returns null when nothing usable is left.
function toNum(v) {
  if (typeof v === 'number') return isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  var s = v.replace(/[^0-9.,-]/g, '');          // drop R, spaces, letters
  if (!s) return null;
  var lastComma = s.lastIndexOf(','), lastDot = s.lastIndexOf('.');
  if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.');  // 1.187,84
  else s = s.replace(/,/g, '');                                        // 1,187.84
  var n = parseFloat(s);
  return isFinite(n) ? n : null;
}

function safeParse(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

// Kinder Ark's chart of codes (confirmed from the school's code sheet,
// 2026-09-23). Mirrors CATEGORIES in slip-capture.html; kept here so the
// function still works if the browser sends no list.
const DEFAULT_CATEGORIES = [
  { g: 'Aankope / Skooluitgawes', code: '3000/100', name: 'Kos' },
  { g: 'Aankope / Skooluitgawes', code: '3000/110', name: 'Kunsmateriaal' },
  { g: 'Aankope / Skooluitgawes', code: '3000/115', name: 'Speelgoed & Boeke' },
  { g: 'Aankope / Skooluitgawes', code: '3000/120', name: 'T-Hemde' },
  { g: 'Aankope / Skooluitgawes', code: '3000/130', name: 'Skoonmaak' },
  { g: 'Aankope / Skooluitgawes', code: '3000/135', name: 'Skryfbehoeftes Kantoor' },
  { g: 'Bemarking & Bank', code: '3050/000', name: 'Advertensie / Bemarking' },
  { g: 'Bemarking & Bank', code: '3100/000', name: 'Bankkoste' },
  { g: 'Diverse Uitgawes', code: '3300/100', name: 'Uniforms Personeel' },
  { g: 'Diverse Uitgawes', code: '3300/120', name: 'Beserings / Medies Personeel' },
  { g: 'Diverse Uitgawes', code: '3400/000', name: 'Donasie' },
  { g: 'Funksies & Uitstappies', code: '3500/100', name: 'Moedersdag' },
  { g: 'Funksies & Uitstappies', code: '3500/110', name: 'Vadersdag' },
  { g: 'Funksies & Uitstappies', code: '3500/120', name: 'Konsert' },
  { g: 'Funksies & Uitstappies', code: '3500/125', name: 'Uitstappies' },
  { g: 'Funksies & Uitstappies', code: '3500/130', name: 'Opedag' },
  { g: 'Funksies & Uitstappies', code: '3500/135', name: 'Kleur Dag' },
  { g: 'Funksies & Uitstappies', code: '3500/140', name: 'Dans' },
  { g: 'Funksies & Uitstappies', code: '3500/145', name: 'Madiba Dag' },
  { g: 'Dienste & Geskenke', code: '3650/000', name: 'Elektrisiteit / Water / Gas / Mun. Koste' },
  { g: 'Dienste & Geskenke', code: '3700/000', name: 'Geskenke' },
  { g: 'Kopieerkoste', code: '3800/110', name: 'Drukkoste' },
  { g: 'Kopieerkoste', code: '3800/115', name: 'Ink' },
  { g: 'Kopieerkoste', code: '3800/130', name: 'Huur (Kopieerder)' },
  { g: 'Onthaal & Opleiding', code: '4000/000', name: 'Onthaal' },
  { g: 'Onthaal & Opleiding', code: '4100/000', name: 'Opleiding Personeel' },
  { g: 'Motorvoertuie', code: '4150/100', name: 'Onderhoud Voertuie' },
  { g: 'Motorvoertuie', code: '4150/200', name: 'Lisensie' },
  { g: 'Motorvoertuie', code: '4150/250', name: 'Brandstof' },
  { g: 'Persele & Huur', code: '4200/100', name: 'Huur (Perseel)' },
  { g: 'Persele & Huur', code: '4200/110', name: 'Onderhoud Geboue & Inhoud' },
  { g: 'Persele & Huur', code: '4200/125', name: 'Stoor Huur' },
  { g: 'Professionele Dienste & Vervoer', code: '4250/000', name: 'Professionele Dienste' },
  { g: 'Professionele Dienste & Vervoer', code: '4260/000', name: 'Personeel Vervoer' },
  { g: 'Rekenaar Uitgawes', code: '4300/115', name: 'Internet Maandeliks' },
  { g: 'Rekenaar Uitgawes', code: '4300/120', name: 'Webwerf' },
  { g: 'Rekenaar Uitgawes', code: '4300/210', name: 'Uitgawes / Onderhoud Rekenaars' },
  { g: 'Rekenmeesters & Ouditgelde', code: '4350/100', name: 'Rekenmeesters & Ouditgelde Maandeliks' },
  { g: 'Rekenmeesters & Ouditgelde', code: '4350/200', name: 'Rekenmeesters & Ouditgelde Jaarliks' },
  { g: 'Salarisse', code: '4400/100', name: 'Salarisse Maandeliks' },
  { g: 'Salarisse', code: '4400/110', name: 'Bonus' },
  { g: 'Salarisse', code: '4400/115', name: 'Maatskappy Koste' },
  { g: 'Salarisse', code: '4400/120', name: 'ETI' },
  { g: 'Salarisse', code: '4400/130', name: 'Tydelik / Oortyd' },
  { g: 'Sekuriteit & Telefoon', code: '4451/000', name: 'Sekuriteit' },
  { g: 'Sekuriteit & Telefoon', code: '4500/000', name: 'Telefoon' },
  { g: 'Toerusting & Ander Aankope', code: '4550/100', name: 'Aankope (Toerusting & Ander)' },
  { g: 'Toerusting & Ander Aankope', code: '4600/000', name: 'Versekering' },
  { g: 'Toerusting & Ander Aankope', code: '4650/000', name: 'Reis & Verblyf' },
];
