
async function fetchLedgerEntries() {
    const res = await fetch('/api/ledger');
    return res.json();
}

async function addLedgerEntry(entry) {
    const res = await fetch('/api/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
    });
    return res.json();
}

async function updateLedgerEntry(id, entry) {
    const res = await fetch(`/api/ledger/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
    });
    return res.json();
}

async function deleteLedgerEntry(id) {
    const res = await fetch(`/api/ledger/${id}`, { method: 'DELETE' });
    return res.json();
}

async function fetchPayables() {
    const res = await fetch('/api/accounts-payable');
    return res.json();
}

async function addPayable(entry) {
    const res = await fetch('/api/accounts-payable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
    });
    return res.json();
}

async function updatePayable(id, entry) {
    const res = await fetch(`/api/accounts-payable/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
    });
    return res.json();
}

async function deletePayable(id) {
    const res = await fetch(`/api/accounts-payable/${id}`, { method: 'DELETE' });
    return res.json();
}

async function fetchReceivables() {
    const res = await fetch('/api/accounts-receivable');
    return res.json();
}

async function addReceivable(entry) {
    const res = await fetch('/api/accounts-receivable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
    });
    return res.json();
}

async function updateReceivable(id, entry) {
    const res = await fetch(`/api/accounts-receivable/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
    });
    return res.json();
}

async function deleteReceivable(id) {
    const res = await fetch(`/api/accounts-receivable/${id}`, { method: 'DELETE' });
    return res.json();
}

// ========== BUDGETING CRUD ==========
async function fetchBudgets() {
    const res = await fetch('/api/budget');
    return res.json();
}

async function addBudget(entry) {
    const res = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
    });
    return res.json();
}

async function updateBudget(id, entry) {
    const res = await fetch(`/api/budget/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
    });
    return res.json();
}

async function deleteBudget(id) {
    const res = await fetch(`/api/budget/${id}`, { method: 'DELETE' });
    return res.json();
}


async function loadPayables() {
    const data = await fetchPayables();
    const tableBody = document.getElementById('accountsPayableTableBody');
    tableBody.innerHTML = ''; // clear existing

    data.forEach(   payable => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payable.supplier_id}</td>
            <td>${payable.supplier_name}</td>
            <td>${payable.amount}</td>
            <td>${new Date(payable.due_date).toLocaleDateString()}</td>
            <td>
                <button onclick="editPayable(${payable.ap_id})">Edit</button>
                <button onclick="deletePayable(${payable.ap_id})">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function editPayable(id) {
    // open a modal or fill the form with data to edit
    alert(`edit payable ${id}`);
}

async function deletePayable(id) {
    if (confirm('Are you sure you want to delete this payable?')) {
        await deletePayable(id);
        loadPayables(); // reload
    }
}
