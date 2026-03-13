// ═══════════════════════════════════════════════════════════════
//  RECEIPT STORAGE + MY RECEIPTS PORTAL
//  Drop this into your app.js alongside receipt-generator.js
// ═══════════════════════════════════════════════════════════════

// ── SAVE RECEIPT TO DATABASE (call this when payment is confirmed)
// This is the ONLY write. After this, the row is frozen forever.
async function saveReceiptToDatabase(receiptData) {
  try {
    // Check if receipt already saved (prevent duplicates on retry)
    if (receiptData.contributionId) {
      const { data: existing } = await sb
        .from('receipts')
        .select('id')
        .eq('contribution_id', receiptData.contributionId)
        .eq('payment_type', receiptData.type)
        .maybeSingle();
      if (existing) return existing.id; // already saved, skip
    }

    const hash = generateReceiptHash(receiptData);

    const { data, error } = await sb.from('receipts').insert({
      receipt_no:      receiptData.receiptNo,
      group_id:        currentProfile.group_id,
      member_id:       receiptData.memberId,
      amount:          receiptData.amount,
      payment_method:  receiptData.paymentMethod,
      source_type:     receiptData.sourceType,
      source_name:     receiptData.sourceName,
      note:            receiptData.note || '',
      recorded_by:     receiptData.recordedBy,
      member_name:     receiptData.memberName,
      member_username: receiptData.memberUsername,
      member_phone:    receiptData.memberPhone,
      security_hash:   hash,
      group_name:      receiptData.groupName,
      event_id:        receiptData.eventId || null,
      scheme_id:       receiptData.schemeId || null,
      contribution_id: receiptData.contributionId || null,
      payment_type:    receiptData.type || 'event',
      paid_at:         receiptData.date,
    }).select('id').single();

    if (error) throw error;
    return data.id;

  } catch (err) {
    console.error('Receipt save failed:', err.message);
    // Don't block the payment flow — just log
    return null;
  }
}

// ── HOOK INTO openReceiptModal — save to DB automatically
// Replace the _currentReceiptData assignment block in receipt-generator.js
// with this enhanced version, OR call saveReceiptToDatabase() right after
// openReceiptModal() confirms payment. Example:
//
//   await confirmPayment(record);           // your existing payment save
//   await saveReceiptToDatabase({           // then freeze the receipt
//     ...builtReceiptData,
//     memberId: record.member_id,
//     contributionId: record.id,
//   });


// ═══════════════════════════════════════════════════════════════
//  MY RECEIPTS PAGE
// ═══════════════════════════════════════════════════════════════

let _allMyReceipts = [];
let _receiptsFiltered = [];

async function loadMyReceiptsPage() {
  renderMyReceiptsShell();
  await fetchAndRenderReceipts();
}

function renderMyReceiptsShell() {
  const main = document.getElementById('mainContent');
  if (!main) return;

  const isAdmin = currentProfile?.role === 'admin' || currentProfile?.role === 'treasurer';

  main.innerHTML = `
    <div style="padding:24px;max-width:900px;margin:0 auto;">

      <div style="margin-bottom:24px;">
        <h2 style="font-family:'Syne',sans-serif;font-size:24px;font-weight:900;margin:0 0 4px;">
          🧾 ${isAdmin ? 'All Receipts' : 'My Receipts'}
        </h2>
        <p style="color:var(--text-muted);font-size:13px;margin:0;">
          ${isAdmin
            ? 'Read-only record of all confirmed payments. No edits permitted.'
            : 'Your personal payment history. All receipts are tamper-proof and permanently stored.'}
        </p>
      </div>

      <!-- FILTERS -->
      <div style="
        display:flex;flex-wrap:wrap;gap:10px;
        background:var(--card-bg);border:1px solid var(--border);
        border-radius:12px;padding:16px;margin-bottom:20px;
      ">
        <input
          id="receiptSearchInput"
          type="text"
          placeholder="🔍 Search receipt no, name, event..."
          oninput="filterReceipts()"
          style="flex:1;min-width:180px;background:var(--input-bg,rgba(255,255,255,0.05));
            border:1px solid var(--border);border-radius:8px;padding:9px 12px;
            color:var(--text);font-size:13px;"
        />
        <select id="receiptTypeFilter" onchange="filterReceipts()" style="
          background:var(--input-bg,rgba(255,255,255,0.05));border:1px solid var(--border);
          border-radius:8px;padding:9px 12px;color:var(--text);font-size:13px;cursor:pointer;">
          <option value="">All Types</option>
          <option value="event">Events</option>
          <option value="scheme">Schemes</option>
          <option value="general">General</option>
        </select>
        <input id="receiptDateFrom" type="date" onchange="filterReceipts()" style="
          background:var(--input-bg,rgba(255,255,255,0.05));border:1px solid var(--border);
          border-radius:8px;padding:9px 12px;color:var(--text);font-size:13px;">
        <input id="receiptDateTo" type="date" onchange="filterReceipts()" style="
          background:var(--input-bg,rgba(255,255,255,0.05));border:1px solid var(--border);
          border-radius:8px;padding:9px 12px;color:var(--text);font-size:13px;">
        <button onclick="clearReceiptFilters()" style="
          background:rgba(242,92,84,0.1);border:1px solid rgba(242,92,84,0.3);
          border-radius:8px;padding:9px 14px;color:#f25c54;font-size:12px;
          font-weight:700;cursor:pointer;">✕ Clear</button>
      </div>

      <!-- SUMMARY BAR -->
      <div id="receiptSummaryBar" style="
        display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;font-size:13px;
        color:var(--text-muted);">
      </div>

      <!-- TABLE -->
      <div style="background:var(--card-bg);border:1px solid var(--border);border-radius:12px;overflow:hidden;">
        <div id="receiptsTableContainer">
          <div style="padding:40px;text-align:center;color:var(--text-muted);">
            Loading receipts...
          </div>
        </div>
      </div>

    </div>`;
}

async function fetchAndRenderReceipts() {
  try {
    const isAdmin = currentProfile?.role === 'admin' || currentProfile?.role === 'treasurer';

    let query = sb
      .from('receipts')
      .select('*')
      .eq('group_id', currentProfile.group_id)
      .order('paid_at', { ascending: false });

    // Members only see their own; admins see all
    if (!isAdmin) {
      query = query.eq('member_id', currentProfile.id);
    }

    const { data, error } = await query;
    if (error) throw error;

    _allMyReceipts = data || [];
    _receiptsFiltered = [..._allMyReceipts];
    renderReceiptsTable(_receiptsFiltered);
    renderReceiptSummary(_receiptsFiltered);

  } catch (err) {
    document.getElementById('receiptsTableContainer').innerHTML = `
      <div style="padding:40px;text-align:center;color:#f25c54;">
        Failed to load receipts: ${err.message}
      </div>`;
  }
}

function filterReceipts() {
  const search  = (document.getElementById('receiptSearchInput')?.value || '').toLowerCase();
  const type    = document.getElementById('receiptTypeFilter')?.value || '';
  const dateFrom = document.getElementById('receiptDateFrom')?.value;
  const dateTo   = document.getElementById('receiptDateTo')?.value;

  _receiptsFiltered = _allMyReceipts.filter(r => {
    const matchSearch = !search || [
      r.receipt_no, r.member_name, r.source_name,
      r.payment_method, r.recorded_by
    ].some(f => (f || '').toLowerCase().includes(search));

    const matchType = !type || r.payment_type === type;

    const paidAt = new Date(r.paid_at);
    const matchFrom = !dateFrom || paidAt >= new Date(dateFrom);
    const matchTo   = !dateTo  || paidAt <= new Date(dateTo + 'T23:59:59');

    return matchSearch && matchType && matchFrom && matchTo;
  });

  renderReceiptsTable(_receiptsFiltered);
  renderReceiptSummary(_receiptsFiltered);
}

function clearReceiptFilters() {
  document.getElementById('receiptSearchInput').value = '';
  document.getElementById('receiptTypeFilter').value = '';
  document.getElementById('receiptDateFrom').value = '';
  document.getElementById('receiptDateTo').value = '';
  _receiptsFiltered = [..._allMyReceipts];
  renderReceiptsTable(_receiptsFiltered);
  renderReceiptSummary(_receiptsFiltered);
}

function renderReceiptSummary(receipts) {
  const total = receipts.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
  const bar = document.getElementById('receiptSummaryBar');
  if (!bar) return;
  bar.innerHTML = `
    <span>📋 <strong>${receipts.length}</strong> receipt${receipts.length !== 1 ? 's' : ''}</span>
    <span>•</span>
    <span>💰 Total: <strong style="color:var(--accent,#34d9a5)">KES ${total.toLocaleString()}</strong></span>
  `;
}

function renderReceiptsTable(receipts) {
  const container = document.getElementById('receiptsTableContainer');
  if (!container) return;

  if (!receipts.length) {
    container.innerHTML = `
      <div style="padding:48px;text-align:center;color:var(--text-muted);">
        <div style="font-size:32px;margin-bottom:8px;">🧾</div>
        <div style="font-size:14px;">No receipts found</div>
      </div>`;
    return;
  }

  const isAdmin = currentProfile?.role === 'admin' || currentProfile?.role === 'treasurer';

  const rows = receipts.map((r, i) => {
    const date = new Date(r.paid_at).toLocaleDateString('en-KE', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    const typeColors = {
      event:   { bg: 'rgba(91,156,246,0.12)',  color: '#5b9cf6' },
      scheme:  { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
      general: { bg: 'rgba(52,217,165,0.12)',  color: '#34d9a5' },
    };
    const tc = typeColors[r.payment_type] || typeColors.general;

    return `
      <tr style="border-bottom:1px solid var(--border);transition:background 0.15s;"
          onmouseover="this.style.background='rgba(91,156,246,0.04)'"
          onmouseout="this.style.background='transparent'">
        <td style="padding:12px 16px;font-size:12px;font-family:monospace;color:var(--text-muted);">
          ${esc(r.receipt_no)}
        </td>
        ${isAdmin ? `
        <td style="padding:12px 16px;font-size:13px;font-weight:600;">
          ${esc(r.member_name)}
        </td>` : ''}
        <td style="padding:12px 16px;">
          <span style="
            display:inline-block;padding:3px 10px;border-radius:20px;
            font-size:11px;font-weight:700;
            background:${tc.bg};color:${tc.color};
          ">${r.payment_type.toUpperCase()}</span>
        </td>
        <td style="padding:12px 16px;font-size:13px;color:var(--text-muted);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          ${esc(r.source_name)}
        </td>
        <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#34d9a5;">
          KES ${Number(r.amount).toLocaleString()}
        </td>
        <td style="padding:12px 16px;font-size:12px;color:var(--text-muted);">
          ${date}
        </td>
        <td style="padding:12px 16px;">
          <div style="display:flex;gap:6px;">
            <button onclick="openReceiptFromStore('${r.id}')" style="
              background:rgba(91,156,246,0.1);border:1px solid rgba(91,156,246,0.3);
              border-radius:6px;padding:5px 10px;color:#5b9cf6;
              font-size:11px;font-weight:700;cursor:pointer;">
              🧾 View
            </button>
            <button onclick="printStoredReceipt('${r.id}')" style="
              background:rgba(52,217,165,0.1);border:1px solid rgba(52,217,165,0.3);
              border-radius:6px;padding:5px 10px;color:#34d9a5;
              font-size:11px;font-weight:700;cursor:pointer;">
              🖨 Print
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  container.innerHTML = `
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:2px solid var(--border);background:rgba(91,156,246,0.04);">
            <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.5px;text-transform:uppercase;">Receipt No</th>
            ${isAdmin ? '<th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.5px;text-transform:uppercase;">Member</th>' : ''}
            <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.5px;text-transform:uppercase;">Type</th>
            <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.5px;text-transform:uppercase;">Source</th>
            <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.5px;text-transform:uppercase;">Amount</th>
            <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.5px;text-transform:uppercase;">Date</th>
            <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.5px;text-transform:uppercase;">Actions</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// ── OPEN STORED RECEIPT IN MODAL (reconstructs from frozen DB data)
async function openReceiptFromStore(receiptId) {
  try {
    const { data: r, error } = await sb
      .from('receipts')
      .select('*')
      .eq('id', receiptId)
      .single();

    if (error || !r) throw new Error('Receipt not found');

    // Verify hash integrity
    const reconstructed = {
      receiptNo:   r.receipt_no,
      memberName:  r.member_name,
      amount:      r.amount,
      date:        r.paid_at,
      sourceName:  r.source_name,
    };
    const expectedHash = generateReceiptHash(reconstructed);
    const hashValid = expectedHash === r.security_hash;

    // Build receipt data from frozen DB snapshot
    _currentReceiptData = {
      receiptNo:       r.receipt_no,
      groupName:       r.group_name,
      memberName:      r.member_name,
      memberUsername:  r.member_username,
      memberPhone:     r.member_phone,
      amount:          parseFloat(r.amount),
      paymentMethod:   r.payment_method,
      sourceName:      r.source_name,
      sourceType:      r.source_type,
      note:            r.note,
      date:            r.paid_at,
      recordedBy:      r.recorded_by,
      type:            r.payment_type,
      _hashValid:      hashValid, // passed into renderReceiptPreview
    };

    renderReceiptPreview(_currentReceiptData);

    // Show tamper warning if hash doesn't match
    if (!hashValid) {
      const preview = document.getElementById('receiptPreview');
      if (preview) {
        preview.insertAdjacentHTML('afterbegin', `
          <div style="background:rgba(242,92,84,0.1);border:1px solid #f25c54;
            border-radius:8px;padding:12px 16px;margin-bottom:12px;
            color:#f25c54;font-size:13px;font-weight:600;">
            ⚠️ WARNING: This receipt's security hash does not match.
            The data may have been tampered with. Contact your administrator.
          </div>`);
      }
    }

    const overlay = document.getElementById('receiptModalOverlay');
    if (overlay) overlay.classList.add('open');

  } catch (err) {
    showToast('Could not load receipt: ' + err.message, 'error');
  }
}

// ── PRINT DIRECTLY FROM STORED RECEIPT
async function printStoredReceipt(receiptId) {
  await openReceiptFromStore(receiptId);
  // Small delay to let modal render, then print
  setTimeout(() => printReceiptDirect(), 400);
}