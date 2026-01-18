// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBlhxg218lbAlZ-c66jmktW1wI-361tryA",
  authDomain: "rp-database-b2d93.firebaseapp.com",
  projectId: "rp-database-b2d93",
  storageBucket: "rp-database-b2d93.firebasestorage.app",
  messagingSenderId: "667428347859",
  appId: "1:667428347859:web:f297c11e90fe2ee0e01926",
  databaseURL: "https://rp-database-b2d93-default-rtdb.firebaseio.com/" // TAMA NA ITO
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let db_c = [], db_l = [], db_t = [];
let viewMode = "CONSTITUENT", selectedId = null;

// --- REAL-TIME LISTENER ---
database.ref('/').on('value', (snapshot) => {
    const data = snapshot.val() || {};
    db_c = data.constituents ? Object.values(data.constituents) : [];
    db_l = data.lgu_workers ? Object.values(data.lgu_workers) : [];
    db_t = data.transactions ? Object.values(data.transactions) : [];
    renderList();
    updateLiveTiles();
}, (error) => {
    alert("Database Error: Check your Firebase Rules!");
});

// --- UI FUNCTIONS ---
function renderList() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const container = document.getElementById('data-list');
    container.innerHTML = "";
    
    const data = (viewMode === "CONSTITUENT" ? db_c : db_l);
    const filtered = data.filter(d => 
        (viewMode === "CONSTITUENT" ? (d.last_name + d.first_name) : d.name)
        .toLowerCase().includes(search)
    );

    filtered.forEach(d => {
        const div = document.createElement('div');
        div.className = `record-card ${selectedId === d.id ? 'selected' : ''}`;
        div.onclick = () => { selectedId = d.id; renderList(); };
        
        if(viewMode === "CONSTITUENT") {
            div.innerHTML = `<h4>${d.last_name}, ${d.first_name}</h4><p>${d.brgy} | Contact: ${d.contact}</p>`;
        } else {
            div.innerHTML = `<h4>${d.name}</h4><p>${d.designation} | Size: ${d.tshirt}</p>`;
        }
        container.appendChild(div);
    });
}

function openAddModal() {
    let h = `<h3>New ${viewMode}</h3>`;
    if(viewMode === "CONSTITUENT") {
        h += `<input id="f1" placeholder="Last Name"><input id="f2" placeholder="First Name">
              <input id="f3" placeholder="Barangay"><input id="f4" placeholder="Contact">`;
    } else {
        h += `<input id="f1" placeholder="Full Name"><input id="f2" placeholder="Designation">
              <input id="f3" placeholder="T-Shirt Size">`;
    }
    h += `<button class="save-btn" onclick="saveNew()">SAVE TO CLOUD</button>
          <button class="save-btn" style="background:gray" onclick="closeM()">CANCEL</button>`;
    showM(h);
}

function saveNew() {
    const id = Date.now();
    const entry = { id: id };
    let path = "";

    if(viewMode === "CONSTITUENT") {
        entry.last_name = document.getElementById('f1').value;
        entry.first_name = document.getElementById('f2').value;
        entry.brgy = document.getElementById('f3').value;
        entry.contact = document.getElementById('f4').value;
        path = `constituents/${id}`;
    } else {
        entry.name = document.getElementById('f1').value;
        entry.designation = document.getElementById('f2').value;
        entry.tshirt = document.getElementById('f3').value;
        path = `lgu_workers/${id}`;
    }

    database.ref(path).set(entry).then(() => closeM());
}

function openAssistModal() {
    if(!selectedId) return alert("Pili muna ng tao!");
    let h = `<h3>Add Assistance</h3>
             <select id="at"><option>Financial</option><option>Bottled Water</option></select>
             <input id="av" type="number" placeholder="Amount/Qty">
             <button class="save-btn" onclick="saveAssist()">SUBMIT</button>`;
    showM(h);
}

function saveAssist() {
    const id = Date.now();
    const data = {
        id: id, person_id: selectedId,
        type: document.getElementById('at').value,
        amount: document.getElementById('av').value,
        date: new Date().toLocaleDateString()
    };
    database.ref(`transactions/${id}`).set(data).then(() => closeM());
}

function updateLiveTiles() {
    const today = new Date().toLocaleDateString();
    let cash = 0, water = 0;
    db_t.forEach(t => {
        if(t.date === today) {
            if(t.type === "Financial") cash += parseFloat(t.amount || 0);
            if(t.type === "Bottled Water") water += parseInt(t.amount || 0);
        }
    });
    document.getElementById('tile-cash').innerText = "₱ " + cash.toLocaleString();
    document.getElementById('tile-water').innerText = water + " PCS";
}

function switchView(m) { viewMode = m; selectedId = null; renderList(); }
function showM(h) { document.getElementById('modal-content').innerHTML = h; document.getElementById('modal-overlay').style.display = 'block'; }
function closeM() { document.getElementById('modal-overlay').style.display = 'none'; }

// Clock
setInterval(() => {
    const now = new Date();
    document.getElementById('clock-display').innerText = now.toLocaleTimeString();
    document.getElementById('date-display').innerText = now.toLocaleDateString();
}, 1000);