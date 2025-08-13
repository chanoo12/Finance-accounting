  /* ===== storage keys ===== */
  const KEY_LEDGER = 'ledger_entries_v1';
  const KEY_AP = 'ap_payables_v1';
  const KEY_TAX = 'tax_records_v1';
  const KEY_FIN = 'financial_reports_v1';
  const KEY_TX = 'spendmate_transactions_v1'; // dashboard uses this

  /* small helpers */
  function genId(prefix='id'){ return prefix + '_' + Math.random().toString(36).slice(2,9); }
  function setKey(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
  function getKey(key){ try{ return JSON.parse(localStorage.getItem(key)) || []; } catch(e){ return []; } }
  function fmtPeso(n){ return '₱' + Number(n).toLocaleString(undefined,{minimumFractionDigits:0, maximumFractionDigits:2}); }
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }

  /* ===== render ledger table ===== */
  function renderLedger(){
    const tbody = document.getElementById('ledgerTable');
    const rows = getKey(KEY_LEDGER);
    tbody.innerHTML = '';
    // newest first
    [...rows].reverse().forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.date}</td><td>${escapeHtml(r.account)}</td><td>${escapeHtml(r.description)}</td>
        <td class="amount-col ${r.debit>0? 'plus':''}">${r.debit? fmtPeso(r.debit): ''}</td>
        <td class="amount-col ${r.credit>0? 'minus':''}">${r.credit? fmtPeso(r.credit): ''}</td>`;
      tbody.appendChild(tr);
    });
  }

  /* ===== payroll compute & preview ===== */
  function computePayroll(gross, pcts){
    const tax = gross * (pcts.tax/100);
    const sss = gross * (pcts.sss/100);
    const phil = gross * (pcts.phil/100);
    const pag = gross * (pcts.pag/100);
    const deductions = tax + sss + phil + pag;
    const net = gross - deductions;
    return { gross, tax, sss, phil, pag, deductions, net };
  }

  document.getElementById('previewPayroll').addEventListener('click', ()=> {
    const date = document.getElementById('payDate').value || new Date().toISOString().slice(0,10);
    const name = document.getElementById('payEmployee').value.trim();
    const gross = Math.abs(Number(document.getElementById('payGross').value) || 0);
    if(!name || gross <= 0){ alert('Enter employee name and gross salary'); return; }
    const pcts = {
      tax: Number(document.getElementById('payTaxPct').value)||0,
      sss: Number(document.getElementById('paySssPct').value)||0,
      phil: Number(document.getElementById('payPhilPct').value)||0,
      pag: Number(document.getElementById('payPagPct').value)||0
    };
    const res = computePayroll(gross, pcts);
    const body = document.getElementById('payPreviewBody');
    body.innerHTML = `
      <div><strong>${escapeHtml(name)}</strong> — ${date}</div>
      <div>Gross: ${fmtPeso(res.gross)}</div>
      <div>Deductions: ${fmtPeso(res.deductions)} (Tax ${pcts.tax}% = ${fmtPeso(res.tax)}, SSS ${pcts.sss}% = ${fmtPeso(res.sss)}, Phil ${pcts.phil}% = ${fmtPeso(res.phil)}, Pag ${pcts.pag}% = ${fmtPeso(res.pag)})</div>
      <div><strong>Net Pay: ${fmtPeso(res.net)}</strong></div>
    `;
    document.getElementById('payPreview').style.display = 'block';
    // stash preview on button for posting
    document.getElementById('postPayroll')._last = { date, name, res, category: (document.getElementById('payOther').value || 'Payroll') };
  });

  /* ===== post payroll -> create ledger, AP, TAX, FIN, transaction ===== */
  document.getElementById('postPayroll').addEventListener('click', ()=> {
    const pack = document.getElementById('postPayroll')._last;
    if(!pack){ alert('Click Preview first'); return; }

    // load storages
    const ledger = getKey(KEY_LEDGER);
    const ap = getKey(KEY_AP);
    const tax = getKey(KEY_TAX);
    const fin = getKey(KEY_FIN);
    const txs = getKey(KEY_TX);

    const batch = genId('batch');
    const postDate = pack.date;
    const category = pack.category;
    const name = pack.name;
    const r = pack.res;

    // 1) Add transaction for dashboard (expense = net pay)
    const tx = { id: genId('tx'), date: postDate, category: `Payroll - ${name}`, amount: Number(r.net.toFixed(2)), type: 'expense', source:'payroll', ref: batch };
    txs.push(tx);

    // 2) AP payable (net pay) - status open
    ap.push({ id: genId('ap'), date: postDate, vendor: name, amount: Number(r.net.toFixed(2)), status: 'open', source:'payroll', ref: tx.id });

    // 3) Tax record
    tax.push({
      id: genId('tax'),
      date: postDate,
      employee: name,
      gross: Number(r.gross.toFixed(2)),
      withholding: Number(r.tax.toFixed(2)),
      sss: Number(r.sss.toFixed(2)),
      phil: Number(r.phil.toFixed(2)),
      pag: Number(r.pag.toFixed(2)),
      net: Number(r.net.toFixed(2)),
      ref: tx.id
    });

    // 4) Financial reporting summary (add gross as payroll expense)
    fin.push({
      id: genId('fin'),
      date: postDate,
      type: 'payroll',
      amount: Number(r.gross.toFixed(2)),
      notes: `Payroll for ${name}`,
      ref: batch
    });

    // 5) GL Journal lines (simplified):
    // Debit: Salary Expense (gross)
    ledger.push({ id: genId('gl'), batch, date: postDate, account: 'Salary Expense', debit: Number(r.gross.toFixed(2)), credit:0, description:`Payroll expense - ${name}`, source:'payroll' });
    // Credit: Withholding Tax Payable
    if(r.tax>0) ledger.push({ id: genId('gl'), batch, date: postDate, account: 'Withholding Tax Payable', debit:0, credit: Number(r.tax.toFixed(2)), description:`Withholding tax - ${name}`, source:'payroll' });
    if(r.sss>0) ledger.push({ id: genId('gl'), batch, date: postDate, account: 'SSS Payable', debit:0, credit: Number(r.sss.toFixed(2)), description:`SSS - ${name}`, source:'payroll' });
    if(r.phil>0) ledger.push({ id: genId('gl'), batch, date: postDate, account: 'PhilHealth Payable', debit:0, credit: Number(r.phil.toFixed(2)), description:`PhilHealth - ${name}`, source:'payroll' });
    if(r.pag>0) ledger.push({ id: genId('gl'), batch, date: postDate, account: 'Pag-IBIG Payable', debit:0, credit: Number(r.pag.toFixed(2)), description:`Pag-IBIG - ${name}`, source:'payroll' });
    // Credit: Payroll Payable (net)
    ledger.push({ id: genId('gl'), batch, date: postDate, account: 'Payroll Payable/Cash', debit:0, credit: Number(r.net.toFixed(2)), description:`Net pay payable - ${name}`, source:'payroll' });

    // save all back
    setKey(KEY_LEDGER, ledger);
    setKey(KEY_AP, ap);
    setKey(KEY_TAX, tax);
    setKey(KEY_FIN, fin);
    setKey(KEY_TX, txs);

    // UI updates
    renderLedger();
    // clear preview and form
    document.getElementById('payPreview').style.display = 'none';
    document.getElementById('payrollForm').reset();
    document.getElementById('postPayroll')._last = null;

    alert(`Payroll posted for ${name} — entries created in GL, AP, Tax, Financial Reports, and Dashboard transactions.`);

    // dispatch storage event manually for same-tab listeners (other tabs get native storage event)
    try {
      localStorage.setItem('__last_payroll_ts', Date.now().toString());
    } catch(e){/* ignore */}
  });

  /* ===== init ledger render + search ===== */
  function GL_init(){
    // seed ledger if empty
    if(getKey(KEY_LEDGER).length === 0){
      const seed = [
        { id: genId('gl'), batch:'seed', date:'2025-08-01', account:'Cash', debit:50000, credit:0, description:'Initial capital', source:'seed' },
        { id: genId('gl'), batch:'seed', date:'2025-08-02', account:'Accounts Payable', debit:0, credit:5000, description:'Office supplies', source:'seed' }
      ];
      setKey(KEY_LEDGER, seed);
    }
    renderLedger();

    // search filter
    document.getElementById('searchLedger').addEventListener('keyup', function(){
      const filter = this.value.toLowerCase();
      document.querySelectorAll('#ledgerTable tr').forEach(tr => {
        tr.style.display = tr.innerText.toLowerCase().includes(filter) ? '' : 'none';
      });
    });

    // storage listener to re-render when other tabs update ledger (or payroll)
    window.addEventListener('storage', (e) => {
      if ([KEY_LEDGER, KEY_AP, KEY_TAX, KEY_FIN, KEY_TX].includes(e.key)) {
        renderLedger();
      }
    });
  }

  GL_init();