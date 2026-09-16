// FishTrack Derby Admin — weigh-in verification console
// Admin access = your anonymous uid is listed in derbies/{DERBY_ID}.adminUids
// (added by the derby owner via Firebase Console).

const DERBY_ID = window.DERBY_ID;
let isAdmin = false;
let allCatches = [];
let allEntries = [];
let currentFilter = 'pending';

function $(id) { return document.getElementById(id); }
function esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

async function init() {
    const user = await authReady;
    if (!user) {
        $('admin-status').textContent = 'Could not sign in — check your connection and reload.';
        return;
    }
    $('my-uid').textContent = user.uid;

    const doc = await db.collection('derbies').doc(DERBY_ID).get();
    if (!doc.exists) {
        $('admin-status').textContent = 'Derby "' + DERBY_ID + '" is not set up yet.';
        return;
    }
    const adminUids = doc.data().adminUids || [];
    isAdmin = adminUids.includes(user.uid);
    const statusEl = $('admin-status');
    if (isAdmin) {
        statusEl.className = 'ok-banner';
        statusEl.textContent = '✔ You are a verifier for: ' + (doc.data().name || DERBY_ID);
    } else {
        statusEl.className = 'warn';
        statusEl.textContent = '⚠ View-only. You are not registered as a verifier — send your device ID below to the derby owner.';
    }

    document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        currentFilter = t.getAttribute('data-filter');
        renderCatches();
    }));

    await refresh();
    setInterval(refresh, 30000);
}

async function refresh() {
    const ref = db.collection('derbies').doc(DERBY_ID);
    const [catchSnap, entrySnap] = await Promise.all([
        ref.collection('catches').get(),
        ref.collection('entries').get()
    ]);
    allCatches = catchSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    allEntries = entrySnap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderCatches();
    renderEntries();
}

function ts(c) {
    return c.createdAt && c.createdAt.toDate ? c.createdAt.toDate().getTime() : 0;
}

function teamOf(entryId) {
    const e = allEntries.find(x => x.id === entryId);
    return e && e.entryType === 'team' ? e.name : null;
}

function renderCatches() {
    const el = $('catch-list');
    let rows = [...allCatches].sort((a, b) => ts(b) - ts(a));
    if (currentFilter !== 'all') rows = rows.filter(c => c.status === currentFilter);
    if (!rows.length) {
        el.innerHTML = '<div class="empty">Nothing here.</div>';
        return;
    }
    el.innerHTML = rows.map(c => {
        const team = teamOf(c.entryId);
        const when = c.createdAt && c.createdAt.toDate
            ? c.createdAt.toDate().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : '';
        const badge = c.status === 'approved' ? '<span class="badge ok">✔ verified</span>'
            : c.status === 'rejected' ? '<span class="badge no">✖ rejected</span>'
            : '<span class="badge wait">⏳ pending</span>';
        const buttons = !isAdmin ? '' : c.status === 'pending'
            ? `<button class="btn approve" onclick="setStatus('${c.id}','approved')">✔ Verify</button>
               <button class="btn reject" onclick="setStatus('${c.id}','rejected')">✖ Reject</button>`
            : `<button class="btn undo" onclick="setStatus('${c.id}','pending')">↩ Back to pending</button>`;
        return `<div class="catch-row">
            <img src="${c.photo}" alt="catch" onclick="showPhoto(this.src)">
            <div class="catch-info">
                <div class="catch-name">${esc(c.anglerName)} ${badge}</div>
                <div class="catch-detail">${esc(c.species)} · <strong>${c.spanCm} cm</strong>${team ? ' · 👥 ' + esc(team) : ''}${when ? ' · submitted ' + when : ''}</div>
                ${buttons}
            </div>
        </div>`;
    }).join('');
}

async function setStatus(catchId, status) {
    try {
        await db.collection('derbies').doc(DERBY_ID)
            .collection('catches').doc(catchId)
            .update({
                status: status,
                verifiedAt: firebase.firestore.FieldValue.serverTimestamp(),
                verifiedBy: firebase.auth().currentUser.uid
            });
        const c = allCatches.find(x => x.id === catchId);
        if (c) c.status = status;
        renderCatches();
    } catch (err) {
        console.error('Status update failed:', err);
        alert('Could not update — are you registered as a verifier?');
    }
}

function renderEntries() {
    const el = $('entry-list');
    if (!allEntries.length) {
        el.innerHTML = '<div class="empty">No entries yet.</div>';
        return;
    }
    el.innerHTML = allEntries.map(e => {
        if (e.entryType === 'team') {
            return `<div style="padding:8px 0; border-bottom:1px solid #eee;">👥 <strong>${esc(e.name)}</strong> — ${(e.anglers || []).map(esc).join(', ')}</div>`;
        }
        return `<div style="padding:8px 0; border-bottom:1px solid #eee;">🎣 ${esc(e.name)}${e.town ? ' <span style="color:#888;">(' + esc(e.town) + ')</span>' : ''}</div>`;
    }).join('');
}

function showPhoto(src) {
    $('photo-overlay-img').src = src;
    $('photo-overlay').style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', init);
