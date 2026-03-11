// ═══════════════════════════════════════════════════════════════
//  GORDYTHEFILMIGO — CONTRIBUTION RECEIPT GENERATOR
//  Uses jsPDF (loaded via CDN in app.html)
//  Handles both event contributions and scheme payments
// ═══════════════════════════════════════════════════════════════

// ── ADD THIS TO app.html <head> if not already present ──────────
// <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

// ── RECEIPT MODAL HTML — paste inside app.html <body> ──────────
/*
<div class="modal-overlay" id="receiptModalOverlay">
  <div class="modal modal-wide" id="receiptModal">
    <div class="modal-title">🧾 Payment Receipt</div>
    <div class="modal-sub">Official payment receipt for this contribution</div>
    <div id="receiptPreview"></div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="closeReceiptModal()">Close</button>
      <button class="btn btn-primary" onclick="downloadReceipt()">⬇ Download PDF</button>
      <button class="btn btn-secondary" onclick="printReceiptDirect()">🖨 Print</button>
    </div>
  </div>
</div>
*/

// ── GLOBAL RECEIPT STATE ────────────────────────────────────────
let _currentReceiptData = null;

// ── MAIN ENTRY POINT ────────────────────────────────────────────
// Call this from contribution rows: openReceiptModal(contrib, 'event')
// Or for scheme payments: openReceiptModal(payment, 'scheme')
async function openReceiptModal(record, type = 'event') {
  try {
    // Fetch group info
    const { data: grp } = await sb.from('groups').select('name').eq('id', currentProfile.group_id).single();
    const groupName = grp?.name || 'My Group';

    // Fetch member info
    const memberId = record.member_id;
    const member = allMembers.find(m => m.id === memberId) || {};

    // Fetch event or scheme name
    let sourceName = '—';
    let sourceType = '';
    if (type === 'event' && record.event_id) {
      const ev = allEvents.find(e => e.id === record.event_id);
      sourceName = ev?.name || 'Event Contribution';
      sourceType = 'Event';
    } else if (type === 'scheme' && record.scheme_id) {
      const sc = allSchemes.find(s => s.id === record.scheme_id);
      sourceName = sc?.name || 'Recurring Scheme';
      sourceType = 'Recurring Scheme';
      if (record.period_id) {
        const period = allPeriods.find(p => p.id === record.period_id);
        if (period) sourceName += ` — ${period.period_label}`;
      }
    } else {
      sourceName = 'General Contribution';
      sourceType = 'Contribution';
    }

    // Build receipt number — use stored one or generate display one
    const receiptNo = record.receipt_number || `RCP-${new Date().getFullYear()}-${String(record.id || '').slice(-4).toUpperCase() || '0000'}`;

    // Build receipt data object
    _currentReceiptData = {
      receiptNo,
      groupName,
      memberName: member.full_name || record.profiles?.full_name || 'Member',
      memberUsername: member.username || '—',
      memberPhone: member.phone || '—',
      amount: parseFloat(record.amount || 0),
      paymentMethod: record.payment_method || 'Cash',
      sourceName,
      sourceType,
      note: record.note || '',
      date: record.created_at || record.paid_at || new Date().toISOString(),
      recordedBy: (() => {
        const recorder = allMembers.find(m => m.id === (record.created_by || record.recorded_by));
        return recorder?.full_name || 'System';
      })(),
      type
    };

    // Render preview
    renderReceiptPreview(_currentReceiptData);

    // Open modal
    const overlay = document.getElementById('receiptModalOverlay');
    if (overlay) overlay.classList.add('open');

  } catch (err) {
    showToast('Failed to generate receipt: ' + err.message, 'error');
  }
}

function closeReceiptModal() {
  const overlay = document.getElementById('receiptModalOverlay');
  if (overlay) overlay.classList.remove('open');
  _currentReceiptData = null;
}

// ── RECEIPT PREVIEW HTML ────────────────────────────────────────
function renderReceiptPreview(d) {
  const dateStr = new Date(d.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = new Date(d.date).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });

  const html = `
    <div id="receiptDoc" style="
      background:#fff;color:#1a1a2e;border-radius:12px;
      padding:32px;font-family:'DM Sans',sans-serif;
      border:1px solid rgba(91,156,246,0.2);
      max-width:480px;margin:0 auto;
    ">
      <!-- HEADER -->
      <div style="text-align:center;border-bottom:2px solid #f0f0f0;padding-bottom:20px;margin-bottom:20px;">
        <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:900;color:#0a1628;margin-bottom:4px;">
          ${esc(d.groupName)}
        </div>
        <div style="font-size:12px;color:#7a8fb0;letter-spacing:1px;text-transform:uppercase;font-weight:600;">
          Official Payment Receipt
        </div>
        <div style="display:inline-block;margin-top:10px;background:#f0f7ff;border:1px solid #c3d9ff;border-radius:8px;padding:5px 16px;">
          <span style="font-size:11px;color:#3a72d8;font-weight:800;letter-spacing:0.5px;">Receipt No: ${esc(d.receiptNo)}</span>
        </div>
      </div>

      <!-- AMOUNT HERO -->
      <div style="text-align:center;background:linear-gradient(135deg,#0a1628,#1a2f55);border-radius:12px;padding:24px;margin-bottom:20px;">
        <div style="font-size:12px;color:#7a8fb0;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Amount Paid</div>
        <div style="font-family:'Syne',sans-serif;font-size:38px;font-weight:900;color:#34d9a5;letter-spacing:-1px;">
          KES ${Number(d.amount).toLocaleString()}
        </div>
        <div style="font-size:12px;color:#7a8fb0;margin-top:4px;">${dateStr} at ${timeStr}</div>
      </div>

      <!-- DETAILS GRID -->
      <div style="display:grid;gap:0;border:1px solid #f0f0f0;border-radius:10px;overflow:hidden;margin-bottom:20px;">
        ${receiptRow('👤 Member', d.memberName)}
        ${receiptRow('🔑 Username', '@' + d.memberUsername)}
        ${receiptRow('📱 Phone', d.memberPhone)}
        ${receiptRow('📂 ' + d.sourceType, d.sourceName)}
        ${receiptRow('💳 Payment Method', d.paymentMethod)}
        ${receiptRow('📝 Recorded By', d.recordedBy)}
        ${d.note ? receiptRow('💬 Note', d.note) : ''}
      </div>

      <!-- STATUS STAMP -->
      <div style="text-align:center;margin-bottom:20px;">
        <div style="display:inline-flex;align-items:center;gap:8px;background:#f0fff8;border:2px solid #34d9a5;border-radius:8px;padding:8px 20px;">
          <span style="font-size:18px;">✅</span>
          <span style="font-family:'Syne',sans-serif;font-size:14px;font-weight:800;color:#00a651;">PAYMENT CONFIRMED</span>
        </div>
      </div>

      <!-- FOOTER -->
      <div style="text-align:center;padding-top:16px;border-top:1px dashed #e0e0e0;">
        <div style="font-size:11px;color:#aaa;line-height:1.6;">
          This is an official receipt generated by GordyTheFilmigo<br/>
          Group Management System. Keep this for your records.
        </div>
        <div style="font-size:10px;color:#ccc;margin-top:6px;">Generated on ${new Date().toLocaleString('en-KE')}</div>
      </div>
    </div>`;

  const preview = document.getElementById('receiptPreview');
  if (preview) preview.innerHTML = html;
}

function receiptRow(label, value) {
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:11px 16px;border-bottom:1px solid #f5f5f5;gap:12px;">
      <span style="font-size:12px;color:#7a8fb0;white-space:nowrap;">${label}</span>
      <span style="font-size:13px;font-weight:600;color:#1a1a2e;text-align:right;">${esc(String(value || '—'))}</span>
    </div>`;
}

// ── PDF DOWNLOAD ────────────────────────────────────────────────
async function downloadReceipt() {
  if (!_currentReceiptData) return;
  const d = _currentReceiptData;

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });

    const W = doc.internal.pageSize.getWidth();
    let y = 15;

    // ── Header band
    doc.setFillColor(10, 22, 40);
    doc.roundedRect(10, y, W - 20, 28, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(238, 241, 250);
    doc.text(d.groupName.toUpperCase(), W / 2, y + 10, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(122, 143, 176);
    doc.text('OFFICIAL PAYMENT RECEIPT', W / 2, y + 17, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(91, 156, 246);
    doc.text('Receipt No: ' + d.receiptNo, W / 2, y + 23, { align: 'center' });
    y += 34;

    // ── Amount hero
    doc.setFillColor(52, 217, 165);
    doc.roundedRect(10, y, W - 20, 20, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(10, 22, 40);
    doc.text('KES ' + Number(d.amount).toLocaleString(), W / 2, y + 13, { align: 'center' });
    y += 26;

    // ── Date
    const dateStr = new Date(d.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(122, 143, 176);
    doc.text(dateStr, W / 2, y, { align: 'center' });
    y += 8;

    // ── Details table
    const rows = [
      ['Member', d.memberName],
      ['Username', '@' + d.memberUsername],
      ['Phone', d.memberPhone],
      [d.sourceType, d.sourceName],
      ['Payment Method', d.paymentMethod],
      ['Recorded By', d.recordedBy],
    ];
    if (d.note) rows.push(['Note', d.note]);

    rows.forEach((row, i) => {
      const bg = i % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
      doc.setFillColor(...bg);
      doc.rect(10, y, W - 20, 8, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(122, 143, 176);
      doc.text(row[0], 14, y + 5.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 26, 46);
      doc.text(String(row[1] || '—'), W - 14, y + 5.5, { align: 'right', maxWidth: 80 });
      y += 8;
    });
    y += 6;

    // ── Confirmed stamp
    doc.setFillColor(240, 255, 248);
    doc.setDrawColor(52, 217, 165);
    doc.setLineWidth(0.5);
    doc.roundedRect(W / 2 - 30, y, 60, 10, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 166, 81);
    doc.text('✓ PAYMENT CONFIRMED', W / 2, y + 6.5, { align: 'center' });
    y += 18;

    // ── Footer
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(10, y, W - 10, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text('This is an official receipt generated by GordyTheFilmigo Group Management System.', W / 2, y, { align: 'center' });
    doc.text('Generated: ' + new Date().toLocaleString('en-KE'), W / 2, y + 4, { align: 'center' });

    // Save
    doc.save(`Receipt-${d.receiptNo}-${d.memberName.replace(/\s+/g, '-')}.pdf`);
    showToast('Receipt downloaded successfully', 'success');

    // Update receipt_generated_at in database
    const table = d.type === 'scheme' ? 'scheme_payments' : 'contributions';
    await sb.from(table).update({ receipt_generated_at: new Date().toISOString() }).eq('id', _currentReceiptData.id).eq('group_id', currentProfile.group_id);

  } catch (err) {
    showToast('PDF generation failed: ' + err.message, 'error');
  }
}

// ── PRINT RECEIPT ───────────────────────────────────────────────
function printReceiptDirect() {
  const doc = document.getElementById('receiptDoc');
  if (!doc) return;
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>Receipt</title>
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
    <style>body{margin:0;padding:20px;background:#fff;} @media print{body{padding:0;}}</style>
    </head><body>
    ${doc.outerHTML}
    <script>window.onload=()=>{window.print();window.close();}<\/script>
    </body></html>`);
  win.document.close();
}

// ═══════════════════════════════════════════════════════════════
//  HOW TO ADD RECEIPT BUTTONS TO YOUR EXISTING CONTRIBUTION ROWS
//
//  In your renderContributions() function, wherever you build
//  each contribution row, add this button:
//
//  <button class="btn btn-xs btn-secondary"
//    onclick="openReceiptModal(allContribs.find(c=>c.id==='${c.id}'),'event')">
//    🧾 Receipt
//  </button>
//
//  For scheme payments:
//  <button class="btn btn-xs btn-secondary"
//    onclick="openReceiptModal(allSchemePayments.find(p=>p.id==='${p.id}'),'scheme')">
//    🧾 Receipt
//  </button>
// ═══════════════════════════════════════════════════════════════