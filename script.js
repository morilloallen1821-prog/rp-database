const firebaseConfig = {
    apiKey: "AIzaSyAs-Paste-Your-Key-Here", 
    authDomain: "rp-database-b2d93.firebaseapp.com",
    databaseURL: "https://rp-database-b2d93-default-rtdb.firebaseio.com",
    projectId: "rp-database-b2d93",
    storageBucket: "rp-database-b2d93.appspot.com",
    messagingSenderId: "770956276707",
    appId: "1:770956276707:web:96e85bc940428d0676451e"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let db_c = [], db_l = [], db_t = [], viewMode = "CONSTITUENT", selectedId = null;

db.ref('/').on('value', (s) => {
    const d = s.val() || {};
    db_c = d.constituents ? Object.values(d.constituents) : [];
    db_l = d.lgu_workers ? Object.values(d.lgu_workers) : [];
    db_t = d.transactions ? Object.values(d.transactions) : [];
    renderList();
    updateLiveTiles();
});

function calculateAge(bday) {
    if(!bday) return 0;
    try {
        let birth = new Date(bday);
        let now = new Date();
        let age = now.getFullYear() - birth.getFullYear();
        if (now.getMonth() < birth.getMonth() || (now.getMonth() == birth.getMonth() && now.getDate() < birth.getDate())) age--;
        return Math.max(0, age);
    } catch(e) { return 0; }
}

function updateClock() {
    const now = new Date();
    document.getElementById('date-display').innerText = now.toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'});
    document.getElementById('clock-display').innerText = now.toLocaleTimeString();
    setTimeout(updateClock, 1000);
}

function loadVerse() {
    const verses = { 1: "Phil 4:13 - Christ strengthens me.", 24: "Col 3:23 - Work with all your heart.", 18: "John 3:16 - For God so loved the world." };
    document.getElementById('verse-display').innerText = verses[new Date().getDate()] || "Joshua 1:9 - Be strong and courageous.";
}

function renderList() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const container = document.getElementById('data-list');
    container.innerHTML = "";
    const data = (viewMode === "CONSTITUENT" ? db_c : db_l);

    data.filter(d => {
        let text = (viewMode === "CONSTITUENT" ? (d.last_name + d.first_name + d.brgy) : (d.name + d.brgy)).toLowerCase();
        return text.includes(search);
    }).forEach(d => {
        const div = document.createElement('div');
        div.className = `record-card ${selectedId === d.id ? 'selected' : ''}`;
        div.onclick = () => { selectedId = d.id; renderList(); };
        div.innerHTML = viewMode === "CONSTITUENT" ? 
            `<h4>${d.last_name}, ${d.first_name}</h4><p>📍 ${d.brgy} | 🎂 ${d.age} yrs | 📞 ${d.contact || 'N/A'}</p>` :
            `<h4>${d.name}</h4><p>🛠️ ${d.designation} | 📍 ${d.brgy} | 📞 ${d.contact || 'N/A'}</p>`;
        container.appendChild(div);
    });
}

function openAddModal() {
    let h = `<h3>New ${viewMode}</h3>`;
    if(viewMode === "CONSTITUENT") {
        h += `<input id="f1" placeholder="Last Name"><input id="f2" placeholder="First Name"><input id="f3" placeholder="Barangay"><input id="f4" placeholder="Contact Number"><label>Birthdate:</label><input id="f5" type="date">`;
    } else {
        h += `<input id="f1" placeholder="Full Name"><input id="f2" placeholder="Designation"><input id="f3" placeholder="Barangay"><input id="f4" placeholder="Contact Number"><label>Birthdate:</label><input id="f5" type="date">`;
    }
    h += `<button class="save-btn" onclick="saveNew()">SAVE</button>`;
    showM(h);
}

function saveNew() {
    const id = Date.now();
    const entry = { id: id };
    const f1 = document.getElementById('f1').value, f2 = document.getElementById('f2').value, f3 = document.getElementById('f3').value, f4 = document.getElementById('f4').value, f5 = document.getElementById('f5').value;
    if(viewMode === "CONSTITUENT") {
        entry.last_name = f1; entry.first_name = f2; entry.brgy = f3; entry.contact = f4; entry.bday = f5; entry.age = calculateAge(f5);
        db.ref('constituents/' + id).set(entry);
    } else {
        entry.name = f1; entry.designation = f2; entry.brgy = f3; entry.contact = f4; entry.bday = f5; entry.age = calculateAge(f5);
        db.ref('lgu_workers/' + id).set(entry);
    }
    closeM();
}

function openAssistModal() {
    if(!selectedId) return alert("Select person first!");
    let h = `<h3>Add Assistance</h3><select id="at"><option>Financial</option><option>Bottled Water</option><option>Medical</option></select>
             <input id="av" type="number" placeholder="Amount / Qty"><textarea id="ad" placeholder="Details..."></textarea>
             <button class="save-btn" onclick="saveAssist()">SAVE RECORD</button>`;
    showM(h);
}

function saveAssist() {
    const tid = Date.now();
    db.ref('transactions/' + tid).set({ person_id: selectedId, category: viewMode, date: new Date().toLocaleDateString(), type: document.getElementById('at').value, amount: document.getElementById('av').value, details: document.getElementById('ad').value });
    closeM();
}

function openReports() {
    let cash = 0, water = 0;
    db_t.forEach(t => { if(t.type === "Financial") cash += parseFloat(t.amount || 0); if(t.type === "Bottled Water") water += parseInt(t.amount || 0); });
    let h = `<h3>Reports Summary</h3><div style="background:#8B0000; color:#FFDB58; padding:15px; border-radius:10px; margin-bottom:10px;"><small>TOTAL CASH</small><br><b>₱ ${cash.toLocaleString()}</b></div><div style="background:#000; color:#fff; padding:15px; border-radius:10px; margin-bottom:15px;"><small>TOTAL WATER</small><br><b>${water} PCS</b></div><button class="save-btn" onclick="exportCSV()">EXPORT CSV</button>`;
    showM(h);
}

function viewHistory() {
    if(!selectedId) return alert("Select person first!");
    const hist = db_t.filter(t => t.person_id === selectedId);
    let h = `<h3>History</h3><div style="font-size:12px;">`;
    hist.reverse().forEach(t => h += `<div style="border-bottom:1px solid #eee; padding:8px 0;"><b>${t.date}</b>: ${t.type} (${t.amount})</div>`);
    h += `</div><button class="save-btn" onclick="closeM()">CLOSE</button>`;
    showM(h);
}

// BIRTHDAY REMINDER FEATURE
function showBdayReminder() {
    const tmrw = new Date(); tmrw.setDate(tmrw.getDate() + 1);
    const m = (tmrw.getMonth() + 1).toString().padStart(2, '0'), d = tmrw.getDate().toString().padStart(2, '0');
    const target = `${m}-${d}`;
    const bdays = (viewMode === "CONSTITUENT" ? db_c : db_l).filter(x => x.bday && x.bday.includes(`-${target}`));
    
    let h = `<h3>Tomorrow's Birthdays (${tmrw.toLocaleDateString()})</h3><div style="font-size:14px; text-align:left;">`;
    if(bdays.length > 0) {
        bdays.forEach(x => h += `<div style="padding:10px; border-bottom:1px solid #eee;"><b>🎂 ${x.first_name || x.name} ${x.last_name || ''}</b><br>📍 Brgy: ${x.brgy}<br>📞 ${x.contact || 'No Contact'}</div>`);
    } else {
        h += `<p>Walang may birthday bukas.</p>`;
    }
    h += `</div><button class="save-btn" onclick="closeM()">CLOSE</button>`;
    showM(h);
}

function uiMoreMenu() {
    let h = `<h3>System Menu</h3>
        <button class="tab" style="width:100%; margin:5px 0;" onclick="showBdayReminder()">🎂 BIRTHDAY TOMORROW</button>
        <button class="tab" style="width:100%; margin:5px 0;" onclick="triggerImport()">📥 IMPORT CSV</button>
        <button class="tab" style="width:100%; margin:5px 0;" onclick="exportCSV()">📤 EXPORT CSV</button>
        <button class="tab" style="width:100%; margin:5px 0; color:red;" onclick="deleteRecord()">🗑️ DELETE SELECTED</button>`;
    showM(h);
}

function deleteRecord() {
    if(!selectedId) return alert("Select a record first!");
    if(confirm("Delete this record?")) {
        db.ref((viewMode === "CONSTITUENT" ? 'constituents/' : 'lgu_workers/') + selectedId).remove().then(() => { alert("Deleted."); selectedId = null; closeM(); });
    }
}

function triggerImport() { document.getElementById('import-file').click(); }
function handleImport(e) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const rows = event.target.result.split('\n').slice(1);
        rows.forEach(row => {
            const cols = row.split(',');
            if(cols.length >= 4) {
                const id = Date.now() + Math.floor(Math.random()*1000);
                db.ref('constituents/'+id).set({ id:id, last_name:cols[0], first_name:cols[1], brgy:cols[2], contact:cols[3], bday:cols[4], age:calculateAge(cols[4]) });
            }
        });
        alert("Imported.");
    };
    reader.readAsText(e.target.files[0]);
}

function exportCSV() {
    let csv = "Date,Type,Amount,Details\n";
    db_t.forEach(t => csv += `${t.date},${t.type},${t.amount},${t.details}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = "RP_Database.csv"; a.click();
}

function updateLiveTiles() {
    const today = new Date().toLocaleDateString();
    let cash = 0, water = 0, pSet = new Set();
    db_t.forEach(t => { if(t.date === today) { if(t.type === "Financial") cash += parseFloat(t.amount || 0); if(t.type === "Bottled Water") water += parseInt(t.amount || 0); pSet.add(t.person_id); } });
    document.getElementById('tile-cash').innerText = `₱ ${cash.toLocaleString()}`;
    document.getElementById('tile-water').innerText = `${water} PCS`;
    document.getElementById('tile-people').innerText = pSet.size;
}

function switchView(m) { viewMode = m; selectedId = null; renderList(); }
function showM(h) { document.getElementById('modal-content').innerHTML = h; document.getElementById('modal-overlay').style.display = 'block'; }
function closeM() { document.getElementById('modal-overlay').style.display = 'none'; }
window.onload = () => { updateClock(); loadVerse(); };
