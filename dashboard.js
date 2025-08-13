/* ====== Data + Persistence ====== */
const STORAGE_KEY = 'spendmate_transactions_v1';

let transactions = [];

// try load from localStorage
function loadTransactions() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            transactions = JSON.parse(raw);
        } catch(e) {
            transactions = [];
        }
    } else {
        // seed sample data (optional) — keep minimal
        transactions = [
            { id: genId(), date: '2025-08-09', category: 'Client Payment', amount: 15000, type: 'income' },
            { id: genId(), date: '2025-08-10', category: 'Office Supplies', amount: 2000, type: 'expense' },
            { id: genId(), date: '2025-08-07', category: 'Utilities', amount: 3200, type: 'expense' }
        ];
        saveTransactions();
    }

    // --- Merge asset purchases as transactions (if not already present) ---
    try {
        const assets = JSON.parse(localStorage.getItem('assets') || '[]');
        assets.forEach(asset => {
            // Check if already present (by category+date+amount)
            const exists = transactions.some(t => t.source === 'asset' && t.category === 'Asset: ' + asset.name && t.date === asset.date && Number(t.amount) === Number(asset.cost));
            if (!exists) {
                transactions.push({
                    id: 'asset_' + Math.random().toString(36).slice(2,9),
                    date: asset.date,
                    category: 'Asset: ' + asset.name,
                    amount: asset.cost,
                    type: 'expense',
                    source: 'asset'
                });
            }
        });
        saveTransactions();
    } catch(e) {/* ignore */}
}

function saveTransactions() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function genId() {
    return 'tx_' + Math.random().toString(36).slice(2,9);
}

/* ====== DOM helpers ====== */
const el = (sel) => document.querySelector(sel);
const elAll = (sel) => Array.from(document.querySelectorAll(sel));

/* ====== Charts Setup ====== */
const barCtx = document.getElementById('barChart').getContext('2d');
const doughnutCtx = document.getElementById('doughnutChart').getContext('2d');

const barChart = new Chart(barCtx, {
    type: 'bar',
    data: { labels: [], datasets: [{ label: 'Amount (₱)', data: [], backgroundColor: [], borderRadius: 8 }] },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: v => '₱' + v.toLocaleString() } } }
    }
});

const doughnutChart = new Chart(doughnutCtx, {
    type: 'doughnut',
    data: { labels: [], datasets: [{ data: [], backgroundColor: [], hoverOffset: 6 }] },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
    }
});

/* ====== Calculation / Aggregation ====== */
function calculateTotals() {
    let totalIncome = 0;
    let totalExpenses = 0;
    transactions.forEach(t => {
        if (t.type === 'income') totalIncome += Number(t.amount);
        else totalExpenses += Number(t.amount);
    });
    return { totalIncome, totalExpenses, outcome: totalIncome - totalExpenses };
}

function aggregateByCategory() {
    // returns map: category -> total absolute amount (income positive, expense positive)
    const map = {};
    transactions.forEach(t => {
        const key = t.category.trim() || 'Uncategorized';
        if (!map[key]) map[key] = { income:0, expense:0 };
        if (t.type === 'income') map[key].income += Number(t.amount);
        else map[key].expense += Number(t.amount);
    });
    return map;
}

/* ====== UI Updates ====== */
function formatMoney(num) {
    return '₱' + Number(num).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function updateCards() {
    const { totalIncome, totalExpenses, outcome } = calculateTotals();
    el('#cardIncome').innerText = formatMoney(totalIncome);
    el('#cardExpenses').innerText = formatMoney(totalExpenses);
    el('#cardOutcome').innerText = formatMoney(outcome);
}

function updateLatestInvoice() {
    // logic: latest income transaction becomes invoice (simple approach)
    const latest = [...transactions].reverse().find(t => t.type === 'income' || t.type === 'expense');
    if (!latest) {
        el('#latestInvoiceNo').innerText = '—';
        el('#latestInvoiceAmount').innerText = '₱0';
        el('#latestInvoiceInfo').innerHTML = '<p class="muted">No invoice yet — add a transaction to create one.</p>';
        return;
    }
    const invNo = 'INV-' + latest.id.slice(-4).toUpperCase();
    el('#latestInvoiceNo').innerText = invNo;
    el('#latestInvoiceAmount').innerText = formatMoney(latest.amount);
    el('#latestInvoiceInfo').innerHTML = `
        <p><strong>${latest.category}</strong></p>
        <p class="muted">${latest.date} • ${latest.type === 'income' ? 'Paid' : 'Pending'}</p>
    `;
}

function renderTransactionTable() {
    const tbody = el('#transactionTable');
    tbody.innerHTML = '';
    // newest first
    const rows = [...transactions].reverse();
    rows.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${t.date}</td>
            <td>${escapeHtml(t.category)}</td>
            <td class="amount-col ${t.type === 'income' ? 'plus' : 'minus'}">${t.type === 'income' ? '+' : '-'} ${formatMoney(t.amount)}</td>
            <td class="action-col"><button class="icon-btn delete-btn" data-id="${t.id}" title="Delete">✕</button></td>
        `;
        tbody.appendChild(tr);
    });
    // attach delete listeners
    elAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.dataset.id;
            transactions = transactions.filter(t => t.id !== id);
            saveTransactions();
            refreshAll();
        });
    });
}

/* ====== Charts update ====== */
function updateCharts() {
    const agg = aggregateByCategory();
    const categories = Object.keys(agg);
    // For bar chart: total per category (income - expense) represented as absolute totals,
    // but color-coded: green for net positive (income>expense), red for net negative
    const barLabels = [];
    const barData = [];
    const barColors = [];

    categories.forEach(cat => {
        const item = agg[cat];
        const net = Number(item.income) - Number(item.expense);
        const totalAbs = Math.abs(net) > 0 ? Math.abs(net) : (item.income + item.expense); // fallback
        barLabels.push(cat);
        barData.push(totalAbs);
        barColors.push(net >= 0 ? '#16a34a' : '#ef4444'); // green or red
    });

    barChart.data.labels = barLabels;
    barChart.data.datasets[0].data = barData;
    barChart.data.datasets[0].backgroundColor = barColors;
    barChart.update();

    // Doughnut: expenses only breakdown
    const expenseCats = categories.filter(c => agg[c].expense > 0);
    const doughLabels = [];
    const doughData = [];
    const doughColors = [];

    expenseCats.forEach(cat => {
        doughLabels.push(cat);
        doughData.push(agg[cat].expense);
        doughColors.push(randomColorFromPalette());
    });

    doughnutChart.data.labels = doughLabels;
    doughnutChart.data.datasets[0].data = doughData;
    doughnutChart.data.datasets[0].backgroundColor = doughColors;
    doughnutChart.update();
}

/* ====== Utilities ====== */
function randomColorFromPalette() {
    const palette = ['#3b82f6','#f59e0b','#10b981','#8b5cf6','#06b6d4','#ef4444','#f97316','#06b6d4','#6366f1','#0ea5a4'];
    return palette[Math.floor(Math.random()*palette.length)];
}

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

/* ====== Main refresh ====== */
function refreshAll() {
    updateCards();
    renderTransactionTable();
    updateLatestInvoice();
    updateCharts();
}

/* ====== Form handling ====== */
el('#txForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const date = el('#txDate').value;
    const category = el('#txCategory').value.trim() || 'Uncategorized';
    const amountRaw = parseFloat(el('#txAmount').value);
    const type = el('#txType').value;

    if (!date || isNaN(amountRaw)) return;

    const amount = Math.abs(amountRaw);

    const tx = { id: genId(), date, category, amount, type };
    transactions.push(tx);
    saveTransactions();
    refreshAll();
    el('#txForm').reset();

    // flash animation on cards
    flashCards();
});

el('#clearAllBtn').addEventListener('click', (e) => {
    if (!confirm('Clear all transactions? This cannot be undone.')) return;
    transactions = [];
    saveTransactions();
    refreshAll();
});

/* quick refresh button */
el('#refreshBtn').addEventListener('click', () => refreshAll());

/* small animation when numbers update */
function flashCards() {
    const cards = elAll('.stat-card');
    cards.forEach(c => {
        c.classList.add('flash');
        setTimeout(()=> c.classList.remove('flash'), 650);
    });
}
    function loadAssetSummary() {
        const assets = JSON.parse(localStorage.getItem('assets') || '[]');
        const totalCost = assets.reduce((sum, a) => sum + a.cost, 0);
        const totalDep = assets.reduce((sum, a) => sum + a.depreciation, 0);
        const last = assets.length ? assets[assets.length - 1].name : "None";

        document.getElementById('assetCount').textContent = assets.length + " Assets";
        document.getElementById('assetTotal').textContent = "Total Cost: ₱" + totalCost.toLocaleString();
        document.getElementById('assetDep').textContent = "Annual Dep: ₱" + totalDep.toLocaleString();
        document.getElementById('lastAsset').textContent = "Last Added: " + last;
    }

    loadAssetSummary();


/* init */
loadTransactions();
refreshAll();

// --- Notification state (demo) ---
let notifications = [
  {id:1, text:'Payroll posted for Juan Dela Cruz', read:false, time:'2025-08-12 09:00'},
  {id:2, text:'New asset added: Laptop', read:true, time:'2025-08-11 15:30'}
];

function updateNotifDot() {
  const hasUnread = notifications.some(n=>!n.read);
  document.getElementById('notifDot').style.display = hasUnread ? 'block' : 'none';
}

document.getElementById('homeBtn').addEventListener('click',()=>{
  window.location.href = 'dashboard.html';
});

document.getElementById('notifBtn').addEventListener('click',()=>{
  // Simple notification dropdown
  let box = document.getElementById('notifDropdown');
  if(box){ box.remove(); return; }
  box = document.createElement('div');
  box.id = 'notifDropdown';
  box.style.position = 'absolute';
  box.style.top = '48px';
  box.style.right = '24px';
  box.style.background = '#fff';
  box.style.boxShadow = '0 4px 24px rgba(15,23,42,0.10)';
  box.style.borderRadius = '10px';
  box.style.minWidth = '260px';
  box.style.zIndex = '1001';
  box.style.padding = '10px 0';
  box.innerHTML = notifications.length ? notifications.map(n=>
    `<div style="padding:10px 18px;${n.read?'color:#64748b;':'font-weight:600;'}cursor:pointer;display:flex;align-items:center;gap:8px;" onclick="this.style.color='#64748b';this.style.fontWeight='400';notifications.find(x=>x.id==${n.id}).read=true;updateNotifDot();this.parentNode.remove();">
      <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${n.read?'#e5e7eb':'#10b981'};margin-right:6px;"></span>
      ${n.text}<span style="margin-left:auto;font-size:0.85em;color:#94a3b8;">${n.time}</span>
    </div>`
  ).join('') : '<div style="padding:12px 18px;color:#64748b;">No notifications</div>';
  document.body.appendChild(box);
  function closeBox(e){
    if(!box.contains(e.target) && e.target.id!=='notifBtn'){
      box.remove();
      document.removeEventListener('mousedown',closeBox);
    }
  }
  setTimeout(()=>document.addEventListener('mousedown',closeBox),0);
});

updateNotifDot();
/* ===== storage keys ===== */
const KEY_LEDGER = 'ledger_entries_v1';
const KEY_AP = 'ap_payables_v1';
const KEY_TAX = 'tax_records_v1';
const KEY_FIN = 'financial_reports_v1';
const KEY_TX = 'spendmate_transactions_v1'; // dashboard uses this