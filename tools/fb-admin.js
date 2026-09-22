#!/usr/bin/env node
// Minimal Firebase admin helper using a service account key — no external deps.
// Mints an OAuth token via a signed JWT, then talks to the Firebase Rules API
// and Firestore REST API directly.
//
// Usage:
//   node fb-admin.js deploy-rules <rulesFile>
//   node fb-admin.js delete-doc <collection/docId>
// Requires env GOOGLE_APPLICATION_CREDENTIALS pointing at the SA json.

const fs = require('fs');
const crypto = require('crypto');

const KEY_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!KEY_PATH) { console.error('GOOGLE_APPLICATION_CREDENTIALS not set'); process.exit(1); }
const SA = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
const PROJECT = SA.project_id;

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({
    iss: SA.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: SA.token_uri,
    iat: now,
    exp: now + 3600,
  }));
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(header + '.' + claim);
  const sig = b64url(signer.sign(SA.private_key));
  const jwt = header + '.' + claim + '.' + sig;
  const res = await fetch(SA.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + encodeURIComponent(jwt),
  });
  const json = await res.json();
  if (!res.ok) throw new Error('token: ' + JSON.stringify(json));
  return json.access_token;
}

async function api(token, url, method, body) {
  const res = await fetch(url, {
    method,
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) throw new Error(method + ' ' + url + ' -> ' + res.status + ': ' + text);
  return json;
}

async function deployRules(rulesFile) {
  const content = fs.readFileSync(rulesFile, 'utf8');
  const token = await getToken();
  const base = 'https://firebaserules.googleapis.com/v1/projects/' + PROJECT;
  // 1) create ruleset
  const ruleset = await api(token, base + '/rulesets', 'POST', {
    source: { files: [{ name: 'firestore.rules', content }] },
  });
  console.log('ruleset created:', ruleset.name);
  // 2) point the cloud.firestore release at it
  const releaseName = 'projects/' + PROJECT + '/releases/cloud.firestore';
  await api(token, base + '/releases/cloud.firestore', 'PATCH', {
    release: { name: releaseName, rulesetName: ruleset.name },
  });
  console.log('release updated: cloud.firestore ->', ruleset.name);
}

async function deleteDoc(path) {
  const token = await getToken();
  const url = 'https://firestore.googleapis.com/v1/projects/' + PROJECT +
    '/databases/(default)/documents/' + path;
  await api(token, url, 'DELETE');
  console.log('deleted:', path);
}

(async () => {
  const [cmd, arg] = process.argv.slice(2);
  try {
    if (cmd === 'deploy-rules') await deployRules(arg);
    else if (cmd === 'delete-doc') await deleteDoc(arg);
    else { console.error('unknown command:', cmd); process.exit(1); }
  } catch (e) { console.error('ERROR:', e.message); process.exit(1); }
})();
