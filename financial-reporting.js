// Financial Reporting: Show data from General Ledger, Asset Management, and Tax Management in separate cards

function fmtPeso(n) {
  return '₱' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function renderGL(filter = '') {
  const rows = JSON.parse(localStorage.getItem('ledger_entries_v1') || '[]');
  const tbody = document.getElementById('glTable');
  tbody.innerHTML = '';
  rows.slice().reverse().forEach(r => {
    const text = `${r.date} ${r.account || ''} ${r.description || ''} ${r.debit || ''} ${r.credit || ''}`.toLowerCase();
    if (!filter || text.includes(filter)) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.date}</td>
        <td>${r.account || ''}</td>
        <td>${r.description || ''}</td>
        <td class="amount-col plus">${r.debit ? fmtPeso(r.debit) : ''}</td>
        <td class="amount-col minus">${r.credit ? fmtPeso(r.credit) : ''}</td>
      `;
      tbody.appendChild(tr);
    }
  });
}

function renderAssets(filter = '') {
  const rows = JSON.parse(localStorage.getItem('assets') || '[]');
  const tbody = document.getElementById('assetTable');
  tbody.innerHTML = '';
  rows.slice().reverse().forEach(r => {
    const text = `${r.name || ''} ${r.date || ''} ${r.cost} ${r.salvage} ${r.life} ${r.depreciation}`.toLowerCase();
    if (!filter || text.includes(filter)) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.name || ''}</td>
        <td>${r.date || ''}</td>
        <td>${fmtPeso(r.cost)}</td>
        <td>${fmtPeso(r.salvage)}</td>
        <td>${r.life || ''} yrs</td>
        <td>${fmtPeso(r.depreciation)}</td>
      `;
      tbody.appendChild(tr);
    }
  });
}

function renderTax(filter = '') {
  const rows = JSON.parse(localStorage.getItem('tax_records_v1') || '[]');
  const tbody = document.getElementById('taxTable');
  tbody.innerHTML = '';
  rows.slice().reverse().forEach(r => {
    const text = `${r.date} ${r.employee || ''} ${r.gross} ${r.withholding} ${r.net}`.toLowerCase();
    if (!filter || text.includes(filter)) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.date}</td>
        <td>${r.employee || ''}</td>
        <td>${fmtPeso(r.gross)}</td>
        <td>${fmtPeso(r.withholding)}</td>
        <td class="amount-col">${fmtPeso(r.net)}</td>
      `;
      tbody.appendChild(tr);
    }
  });
}

function renderAll(filter = '') {
  renderGL(filter);
  renderAssets(filter);
  renderTax(filter);
}

window.addEventListener('storage', (e) => {
  if ([
    'ledger_entries_v1',
    'assets',
    'tax_records_v1'
  ].includes(e.key)) renderAll(document.getElementById('finSearch')?.value?.toLowerCase()||'');
});

document.getElementById('finSearch').addEventListener('input', function() {
  renderAll(this.value.toLowerCase());
});

renderAll();
