// Geelhoutboom Galjoen Derby - 24-26 July 2026
// Stores entries in users/derby_geelhoutboom_2026 (works with current Firestore rules).
// Leaderboard matches normal catches by participant name + date range - no changes to catch logging.

const DERBY = {
    docPath: { collection: 'users', doc: 'derby_geelhoutboom_2026' },
    start: new Date('2026-07-24T00:00:00+02:00'),
    end: new Date('2026-07-26T23:59:59+02:00')
};

let derbyParticipants = [];

function normName(name) {
    return (name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function waitForDb() {
    let attempts = 0;
    while (typeof db === 'undefined' && attempts < 50) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
    }
    return typeof db !== 'undefined';
}

// ---------- Countdown ----------
function updateCountdown() {
    const el = document.getElementById('countdown');
    const now = new Date();

    if (now < DERBY.start) {
        el.textContent = '⏳ Derby starts Friday 24 July!';
        return;
    }
    if (now > DERBY.end) {
        el.textContent = '🏁 Derby complete — final results below!';
        document.getElementById('final-results-banner').style.display = 'block';
        return;
    }
    const ms = DERBY.end - now;
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    el.textContent = `🔴 LIVE — ends in ${d}d ${h}h ${m}m (Sunday 23:59)`;
}

// ---------- Participants ----------
async function loadParticipants() {
    try {
        const doc = await db.collection(DERBY.docPath.collection).doc(DERBY.docPath.doc).get();
        derbyParticipants = (doc.exists && Array.isArray(doc.data().participants)) ? doc.data().participants : [];
        renderParticipants();
    } catch (err) {
        console.error('Error loading participants:', err);
        document.getElementById('participants-list').innerHTML =
            '<div class="empty-msg">Could not load participants. Check your connection.</div>';
    }
}

function renderParticipants() {
    const listEl = document.getElementById('participants-list');
    const countEl = document.getElementById('participant-count');
    countEl.textContent = derbyParticipants.length ? `(${derbyParticipants.length})` : '';

    if (!derbyParticipants.length) {
        listEl.innerHTML = '<div class="empty-msg">No entries yet — be the first!</div>';
        return;
    }
    listEl.innerHTML = derbyParticipants.map(p => {
        const town = p.town ? ` <span style="color:#888; font-size:13px;">· ${escapeHtml(p.town)}</span>` : '';
        return `<span class="participant-chip">🎣 ${escapeHtml(p.name)}${town}</span>`;
    }).join('');
}

async function joinDerby() {
    const nameInput = document.getElementById('entryName');
    const townInput = document.getElementById('entryTown');
    const btn = document.getElementById('joinBtn');
    const msg = document.getElementById('joinMsg');

    const name = nameInput.value.trim();
    const town = townInput.value.trim();

    if (name.length < 2) {
        msg.style.color = '#e74c3c';
        msg.textContent = '⚠️ Please enter an angler name';
        return;
    }
    if (derbyParticipants.some(p => normName(p.name) === normName(name))) {
        msg.style.color = '#e74c3c';
        msg.textContent = `⚠️ "${name}" is already entered!`;
        return;
    }
    if (new Date() > DERBY.end) {
        msg.style.color = '#e74c3c';
        msg.textContent = '🏁 The derby has ended — entries are closed.';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Entering...';

    try {
        const entry = { name: name, town: town || null, joinedAt: Date.now() };
        const ref = db.collection(DERBY.docPath.collection).doc(DERBY.docPath.doc);
        await ref.set({
            type: 'derby',
            derbyName: 'Geelhoutboom Galjoen Derby',
            participants: firebase.firestore.FieldValue.arrayUnion(entry)
        }, { merge: true });

        derbyParticipants.push(entry);
        renderParticipants();
        loadLeaderboard();

        msg.style.color = '#27ae60';
        msg.textContent = `✅ ${name} is in! Add another angler or start fishing! 🎣`;
        nameInput.value = '';
        localStorage.setItem('fishtrack_derby_entered', name);
    } catch (err) {
        console.error('Error joining derby:', err);
        msg.style.color = '#e74c3c';
        msg.textContent = '❌ Could not save entry. Please try again.';
    }

    btn.disabled = false;
    btn.textContent = 'Enter the Derby 🏆';
}

// ---------- Leaderboard ----------
function catchDateOf(data) {
    if (!data.catchDate) return null;
    if (data.catchDate.toDate) return data.catchDate.toDate();
    const d = new Date(data.catchDate);
    return isNaN(d) ? null : d;
}

async function loadLeaderboard() {
    try {
        const snapshot = await db.collection('catches').get();
        const names = new Set(derbyParticipants.map(p => normName(p.name)));

        const derbyCatches = [];
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const date = catchDateOf(data);
            if (!date || date < DERBY.start || date > DERBY.end) return;
            if (!names.has(normName(data.catcherName))) return;
            derbyCatches.push({ id: doc.id, ...data, _date: date });
        });

        renderLeaderboards(derbyCatches);
    } catch (err) {
        console.error('Error loading leaderboard:', err);
    }
}

function isGaljoen(species) {
    return (species || '').toLowerCase().includes('galjoen');
}

function renderLeaderboards(catches) {
    const ended = new Date() > DERBY.end;
    const galjoen = catches.filter(c => isGaljoen(c.species));

    // Biggest Galjoen (top 5 by weight)
    const biggestGaljoen = [...galjoen]
        .filter(c => c.weight > 0)
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5);
    renderRankList('lb-biggest-galjoen', biggestGaljoen.map(c => ({
        name: c.catcherName,
        detail: `${c.locationName && c.privacy === 'public' ? escapeHtml(c.locationName) + ' · ' : ''}${formatDay(c._date)}`,
        value: `${c.weight} kg`,
        photo: c.privacy !== 'private' ? c.photo : null
    })), ended, 'No Galjoen logged yet — get casting!');

    // Most Galjoen (count per angler)
    const counts = {};
    galjoen.forEach(c => {
        const key = normName(c.catcherName);
        if (!counts[key]) counts[key] = { name: c.catcherName, count: 0, totalWeight: 0 };
        counts[key].count++;
        counts[key].totalWeight += (c.weight || 0);
    });
    const mostGaljoen = Object.values(counts)
        .sort((a, b) => b.count - a.count || b.totalWeight - a.totalWeight)
        .slice(0, 5);
    renderRankList('lb-most-galjoen', mostGaljoen.map(e => ({
        name: e.name,
        detail: `Total weight: ${e.totalWeight.toFixed(1)} kg`,
        value: `${e.count} fish`,
        photo: null
    })), ended, 'No Galjoen logged yet');

    // Biggest overall (any species)
    const biggestAny = [...catches]
        .filter(c => c.weight > 0)
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5);
    renderRankList('lb-biggest-any', biggestAny.map(c => ({
        name: c.catcherName,
        detail: escapeHtml(c.species || ''),
        value: `${c.weight} kg`,
        photo: c.privacy !== 'private' ? c.photo : null
    })), ended, 'No catches logged yet');
}

function renderRankList(elId, rows, ended, emptyText) {
    const el = document.getElementById(elId);
    if (!rows.length) {
        el.innerHTML = `<div class="empty-msg">${emptyText}</div>`;
        return;
    }
    const medals = ['🥇', '🥈', '🥉', '4.', '5.'];
    el.innerHTML = rows.map((r, i) => {
        const winner = ended && i === 0;
        const photo = r.photo ? `<img class="lb-photo" src="${r.photo}" alt="catch">` : '';
        return `<div class="lb-row${winner ? ' winner' : ''}">
            <div class="lb-rank">${winner ? '👑' : medals[i]}</div>
            ${photo}
            <div class="lb-info">
                <div class="lb-name">${escapeHtml(r.name)}${winner ? ' — WINNER!' : ''}</div>
                <div class="lb-detail">${r.detail}</div>
            </div>
            <div class="lb-value">${r.value}</div>
        </div>`;
    }).join('');
}

function formatDay(date) {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()] + ' ' + date.getDate() + ' Jul';
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

// ---------- Init ----------
async function initDerby() {
    updateCountdown();
    setInterval(updateCountdown, 30000);

    document.getElementById('joinBtn').addEventListener('click', joinDerby);
    document.getElementById('entryName').addEventListener('keypress', e => {
        if (e.key === 'Enter') { e.preventDefault(); joinDerby(); }
    });

    const ready = await waitForDb();
    if (!ready) {
        console.error('Firebase not loaded');
        return;
    }

    await loadParticipants();
    await loadLeaderboard();

    // Refresh leaderboard every 2 minutes while page is open
    setInterval(async () => {
        await loadParticipants();
        await loadLeaderboard();
    }, 120000);
}

initDerby();
