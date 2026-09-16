// FishTrack Derby Engine v2
// Config-driven: reads derby settings from Firestore derbies/{DERBY_ID}.
// Requires firebase-auth-compat SDK on the page (anonymous auth via firebase-config.js).

const DERBY_ID = window.DERBY_ID || 'gansbaai_galjoen_2026';

let derbyConfig = null;
let derbyEntries = [];
let derbyCatches = [];
let photoDataURL = null;

function $(id) { return document.getElementById(id); }

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function normName(name) {
    return (name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function toDate(v) {
    if (!v) return null;
    if (v.toDate) return v.toDate();
    const d = new Date(v);
    return isNaN(d) ? null : d;
}

// ---------- Load config ----------
async function loadDerbyConfig() {
    const doc = await db.collection('derbies').doc(DERBY_ID).get();
    if (!doc.exists) throw new Error('Derby not found: ' + DERBY_ID);
    derbyConfig = doc.data();
    derbyConfig.start = toDate(derbyConfig.start);
    derbyConfig.end = toDate(derbyConfig.end);
    derbyConfig.entriesClose = toDate(derbyConfig.entriesClose) || derbyConfig.end;
}

// ---------- Countdown ----------
function updateCountdown() {
    const el = $('countdown');
    if (!el || !derbyConfig) return;
    const now = new Date();
    if (now < derbyConfig.start) {
        const ms = derbyConfig.start - now;
        const d = Math.floor(ms / 86400000);
        const h = Math.floor((ms % 86400000) / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        el.textContent = `⏳ Starts in ${d}d ${h}h ${m}m`;
    } else if (now > derbyConfig.end) {
        el.textContent = '🏁 Competition complete — final results below!';
        const banner = $('final-results-banner');
        if (banner) banner.style.display = 'block';
    } else {
        const ms = derbyConfig.end - now;
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        el.textContent = `🔴 LIVE — ${h}h ${m}m left to fish!`;
    }
}

// ---------- Entries ----------
async function loadEntries() {
    const snap = await db.collection('derbies').doc(DERBY_ID)
        .collection('entries').orderBy('createdAt', 'asc').get();
    derbyEntries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderEntries();
    populateAnglerSelect();
}

function allAnglers() {
    const out = [];
    derbyEntries.forEach(e => {
        if (e.entryType === 'team') {
            (e.anglers || []).forEach(a => out.push({ name: a, entryId: e.id, team: e.name }));
        } else {
            out.push({ name: e.name, entryId: e.id, team: null });
        }
    });
    return out;
}

function renderEntries() {
    const listEl = $('entries-list');
    const countEl = $('entry-count');
    if (!listEl) return;
    const anglers = allAnglers();
    if (countEl) countEl.textContent = anglers.length ? `(${anglers.length} anglers)` : '';
    if (!derbyEntries.length) {
        listEl.innerHTML = '<div class="empty-msg">No entries yet — be the first!</div>';
        return;
    }
    listEl.innerHTML = derbyEntries.map(e => {
        if (e.entryType === 'team') {
            const members = (e.anglers || []).map(a => escapeHtml(a)).join(', ');
            return `<div class="entry-chip team-chip">👥 <strong>${escapeHtml(e.name)}</strong><span class="chip-sub">${members}</span></div>`;
        }
        const town = e.town ? `<span class="chip-sub">${escapeHtml(e.town)}</span>` : '';
        return `<div class="entry-chip">🎣 ${escapeHtml(e.name)}${town}</div>`;
    }).join('');
}

function toggleEntryType() {
    const type = document.querySelector('input[name="entryType"]:checked').value;
    $('individual-fields').style.display = type === 'individual' ? 'block' : 'none';
    $('team-fields').style.display = type === 'team' ? 'block' : 'none';
}

async function submitEntry() {
    const msg = $('entryMsg');
    const btn = $('entryBtn');
    const type = document.querySelector('input[name="entryType"]:checked').value;

    if (!derbyConfig) return showMsg(msg, false, 'The derby is still being set up — try again soon.');
    if (new Date() > derbyConfig.entriesClose) {
        return showMsg(msg, false, 'Entries are closed.');
    }

    let payload;
    if (type === 'individual') {
        const name = $('entryName').value.trim();
        if (name.length < 2) return showMsg(msg, false, 'Please enter your name.');
        if (allAnglers().some(a => normName(a.name) === normName(name)))
            return showMsg(msg, false, `"${name}" is already entered.`);
        payload = {
            entryType: 'individual',
            name: name,
            town: $('entryTown').value.trim() || null
        };
    } else {
        const teamName = $('teamName').value.trim();
        const anglers = [1, 2, 3, 4]
            .map(i => $('teamAngler' + i).value.trim())
            .filter(n => n.length >= 2);
        if (teamName.length < 2) return showMsg(msg, false, 'Please enter a team name.');
        if (anglers.length < 2) return showMsg(msg, false, 'A team needs at least 2 anglers (max 4).');
        const existing = allAnglers();
        for (const a of anglers) {
            if (existing.some(x => normName(x.name) === normName(a)))
                return showMsg(msg, false, `"${a}" is already entered.`);
        }
        payload = { entryType: 'team', name: teamName, anglers: anglers, town: null };
    }

    btn.disabled = true;
    btn.textContent = 'Entering...';
    try {
        const user = await authReady;
        if (!user) throw new Error('auth');
        payload.uid = user.uid;
        payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('derbies').doc(DERBY_ID).collection('entries').add(payload);
        await loadEntries();
        showMsg(msg, true, type === 'team'
            ? `✅ Team "${payload.name}" is in! Tight lines! 🎣`
            : `✅ ${payload.name} is in! Tight lines! 🎣`);
        ['entryName', 'entryTown', 'teamName', 'teamAngler1', 'teamAngler2', 'teamAngler3', 'teamAngler4']
            .forEach(id => { const el = $(id); if (el) el.value = ''; });
        localStorage.setItem('fishtrack_derby_' + DERBY_ID, payload.name);
    } catch (err) {
        console.error('Entry failed:', err);
        showMsg(msg, false, '❌ Could not save entry. Check your connection and try again.');
    }
    btn.disabled = false;
    btn.textContent = 'Enter the Derby 🏆';
}

function showMsg(el, ok, text) {
    if (!el) return;
    el.style.color = ok ? '#27ae60' : '#e74c3c';
    el.textContent = text;
}

// ---------- Catch submission ----------
function populateAnglerSelect() {
    const sel = $('catchAngler');
    if (!sel) return;
    const current = sel.value;
    const anglers = allAnglers().sort((a, b) => a.name.localeCompare(b.name));
    sel.innerHTML = '<option value="">— Select angler —</option>' + anglers.map(a =>
        `<option value="${escapeHtml(a.name)}" data-entry="${a.entryId}">${escapeHtml(a.name)}${a.team ? ' (' + escapeHtml(a.team) + ')' : ''}</option>`
    ).join('');
    const remembered = current || localStorage.getItem('fishtrack_derby_' + DERBY_ID);
    if (remembered) {
        const match = anglers.find(a => normName(a.name) === normName(remembered));
        if (match) sel.value = match.name;
    }
}

function initPhotoHandler() {
    const input = $('catchPhoto');
    if (!input) return;
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        compressPhoto(file, (dataURL) => {
            photoDataURL = dataURL;
            $('photoPreviewImg').src = dataURL;
            $('photoPreview').style.display = 'block';
            $('photoLabel').textContent = '📸 Change photo';
        });
    });
}

function compressPhoto(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDim = 900;
            let { width, height } = img;
            if (width > height && width > maxDim) {
                height = Math.round(height * maxDim / width); width = maxDim;
            } else if (height > maxDim) {
                width = Math.round(width * maxDim / height); height = maxDim;
            }
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            callback(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function submitCatch() {
    const msg = $('catchMsg');
    const btn = $('catchBtn');
    const sel = $('catchAngler');
    const anglerName = sel.value;
    const species = $('catchSpecies').value;
    const spanCm = parseFloat($('catchSpan').value);

    if (!derbyConfig) return showMsg(msg, false, 'The derby is still being set up — try again soon.');
    const now = new Date();
    if (now < derbyConfig.start) return showMsg(msg, false, 'The competition has not started yet.');
    if (now > derbyConfig.end) return showMsg(msg, false, 'The competition is over — submissions are closed.');
    if (!anglerName) return showMsg(msg, false, 'Select the angler who caught the fish.');
    if (!species) return showMsg(msg, false, 'Select the species.');
    if (!spanCm || spanCm <= 0 || spanCm >= 250) return showMsg(msg, false, 'Enter a valid span in cm.');
    if (!photoDataURL) return showMsg(msg, false, 'A photo is required — it keeps the leaderboard honest!');

    const entryId = sel.selectedOptions[0].getAttribute('data-entry');

    btn.disabled = true;
    btn.textContent = 'Submitting...';
    try {
        const user = await authReady;
        if (!user) throw new Error('auth');
        await db.collection('derbies').doc(DERBY_ID).collection('catches').add({
            uid: user.uid,
            entryId: entryId,
            anglerName: anglerName,
            species: species,
            spanCm: spanCm,
            photo: photoDataURL,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showMsg(msg, true, '✅ Catch submitted! It will appear on the leaderboard once verified at the weigh-in table.');
        localStorage.setItem('fishtrack_derby_' + DERBY_ID, anglerName);
        $('catchSpan').value = '';
        photoDataURL = null;
        $('photoPreview').style.display = 'none';
        $('photoLabel').textContent = '📸 Add photo of your catch (required)';
        $('catchPhoto').value = '';
        await loadCatches();
    } catch (err) {
        console.error('Catch submit failed:', err);
        showMsg(msg, false, '❌ Could not submit. Check your connection and try again.');
    }
    btn.disabled = false;
    btn.textContent = 'Submit Catch 🎣';
}

// ---------- Leaderboards ----------
async function loadCatches() {
    const snap = await db.collection('derbies').doc(DERBY_ID).collection('catches').get();
    derbyCatches = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderLeaderboards();
    renderRecent();
}

function isGaljoen(species) {
    return (species || '').toLowerCase().includes('galjoen');
}

function renderLeaderboards() {
    const approved = derbyCatches.filter(c => c.status === 'approved');
    const galjoen = approved.filter(c => isGaljoen(c.species));
    const ended = new Date() > derbyConfig.end;

    // Biggest Galjoen by span
    const biggest = [...galjoen].sort((a, b) => b.spanCm - a.spanCm).slice(0, 10);
    renderRankList('lb-biggest-galjoen', biggest.map(c => ({
        name: c.anglerName,
        detail: teamOf(c.entryId),
        value: `${c.spanCm} cm`,
        photo: c.photo
    })), ended, 'No verified Galjoen yet — get casting!');

    // Most Galjoen per angler
    const counts = {};
    galjoen.forEach(c => {
        const key = normName(c.anglerName);
        if (!counts[key]) counts[key] = { name: c.anglerName, count: 0, total: 0 };
        counts[key].count++;
        counts[key].total += c.spanCm;
    });
    const most = Object.values(counts)
        .sort((a, b) => b.count - a.count || b.total - a.total).slice(0, 10);
    renderRankList('lb-most-galjoen', most.map(e => ({
        name: e.name,
        detail: `Total span: ${e.total.toFixed(0)} cm`,
        value: `${e.count} fish`,
        photo: null
    })), ended, 'No verified Galjoen yet');

    // Top teams: total approved galjoen span
    const teamScores = {};
    derbyEntries.filter(e => e.entryType === 'team').forEach(e => {
        teamScores[e.id] = { name: e.name, total: 0, count: 0 };
    });
    galjoen.forEach(c => {
        if (teamScores[c.entryId]) {
            teamScores[c.entryId].total += c.spanCm;
            teamScores[c.entryId].count++;
        }
    });
    const teams = Object.values(teamScores)
        .filter(t => t.count > 0)
        .sort((a, b) => b.total - a.total).slice(0, 10);
    const teamCard = $('team-card');
    if (teamCard) teamCard.style.display = derbyEntries.some(e => e.entryType === 'team') ? 'block' : 'none';
    renderRankList('lb-teams', teams.map(t => ({
        name: t.name,
        detail: `${t.count} verified Galjoen`,
        value: `${t.total.toFixed(0)} cm`,
        photo: null
    })), ended, 'No team catches verified yet');

    // Biggest overall (any species)
    const biggestAny = [...approved].sort((a, b) => b.spanCm - a.spanCm).slice(0, 5);
    renderRankList('lb-biggest-any', biggestAny.map(c => ({
        name: c.anglerName,
        detail: escapeHtml(c.species),
        value: `${c.spanCm} cm`,
        photo: c.photo
    })), ended, 'No verified catches yet');

    // Lucky draw pool
    const drawPool = new Set(approved.map(c => normName(c.anglerName)));
    const drawEl = $('draw-count');
    if (drawEl) drawEl.textContent = drawPool.size;
}

function teamOf(entryId) {
    const e = derbyEntries.find(x => x.id === entryId);
    return e && e.entryType === 'team' ? '👥 ' + escapeHtml(e.name) : '';
}

function renderRankList(elId, rows, ended, emptyText) {
    const el = $(elId);
    if (!el) return;
    if (!rows.length) {
        el.innerHTML = `<div class="empty-msg">${emptyText}</div>`;
        return;
    }
    const medals = ['🥇', '🥈', '🥉'];
    el.innerHTML = rows.map((r, i) => {
        const winner = ended && i === 0;
        const photo = r.photo ? `<img class="lb-photo" src="${r.photo}" alt="catch" onclick="showPhoto(this.src)">` : '';
        return `<div class="lb-row${winner ? ' winner' : ''}">
            <div class="lb-rank">${winner ? '👑' : (medals[i] || (i + 1) + '.')}</div>
            ${photo}
            <div class="lb-info">
                <div class="lb-name">${escapeHtml(r.name)}${winner ? ' — WINNER!' : ''}</div>
                <div class="lb-detail">${r.detail}</div>
            </div>
            <div class="lb-value">${r.value}</div>
        </div>`;
    }).join('');
}

function renderRecent() {
    const el = $('recent-list');
    if (!el) return;
    const recent = [...derbyCatches]
        .sort((a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0))
        .slice(0, 8);
    if (!recent.length) {
        el.innerHTML = '<div class="empty-msg">No submissions yet</div>';
        return;
    }
    el.innerHTML = recent.map(c => {
        const badge = c.status === 'approved' ? '<span class="badge ok">✔ verified</span>'
            : c.status === 'rejected' ? '<span class="badge no">✖ not counted</span>'
            : '<span class="badge wait">⏳ awaiting weigh-in</span>';
        return `<div class="recent-row">
            <img class="lb-photo" src="${c.photo}" alt="catch" onclick="showPhoto(this.src)">
            <div class="lb-info">
                <div class="lb-name">${escapeHtml(c.anglerName)}</div>
                <div class="lb-detail">${escapeHtml(c.species)} · ${c.spanCm} cm</div>
            </div>
            ${badge}
        </div>`;
    }).join('');
}

function showPhoto(src) {
    const overlay = $('photo-overlay');
    if (!overlay) return;
    $('photo-overlay-img').src = src;
    overlay.style.display = 'flex';
}

// ---------- Init ----------
async function initDerby() {
    const entryBtn = $('entryBtn');
    if (entryBtn) entryBtn.addEventListener('click', submitEntry);
    document.querySelectorAll('input[name="entryType"]').forEach(r =>
        r.addEventListener('change', toggleEntryType));
    const catchBtn = $('catchBtn');
    if (catchBtn) catchBtn.addEventListener('click', submitCatch);
    initPhotoHandler();

    try {
        await loadDerbyConfig();
    } catch (err) {
        console.error(err);
        const el = $('countdown');
        if (el) el.textContent = 'Derby is being set up — check back soon!';
        return;
    }

    updateCountdown();
    setInterval(updateCountdown, 30000);

    await loadEntries();
    await loadCatches();

    setInterval(async () => {
        try {
            await loadEntries();
            await loadCatches();
        } catch (e) { /* transient network */ }
    }, 60000);
}

document.addEventListener('DOMContentLoaded', initDerby);
