// ═══════════════════════════════════════════════════════════════
//  GORDYTHEFILMIGO — CONTRIBUTION RECEIPT GENERATOR
//  Security features: watermark + void pattern + hash checksum
// ═══════════════════════════════════════════════════════════════

// ── GLOBAL RECEIPT STATE ────────────────────────────────────────
let _currentReceiptData = null;

// ── SECURITY: Hash generator ────────────────────────────────────
// Produces a tamper-evident code from receipt data.
// If anyone edits amount, name, date — the hash won't match.
function generateReceiptHash(d) {
  const str = `${d.receiptNo}|${d.memberName}|${d.amount}|${d.date}|${d.sourceName}|GF-SECURE-2024`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(12, '0');
  return `${hex.slice(0,4)}-${hex.slice(4,8)}-${hex.slice(8,12)}`;
}

// ── MAIN ENTRY POINT ────────────────────────────────────────────
async function openReceiptModal(record, type = 'event') {
  try {
    const { data: grp } = await sb.from('groups').select('name').eq('id', currentProfile.group_id).single();
    const groupName = grp?.name || 'My Group';

    const memberId = record.member_id;
    const member = allMembers.find(m => m.id === memberId) || {};

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

    const receiptNo = record.receipt_number || `RCP-${new Date().getFullYear()}-${String(record.id || '').slice(-4).toUpperCase() || '0000'}`;

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

    renderReceiptPreview(_currentReceiptData);

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
  const hash = generateReceiptHash(d);

  const html = `
    <div id="receiptDoc" style="
      background:#fff;
      color:#1a1a2e;
      border-radius:12px;
      padding:32px;
      font-family:'DM Sans',sans-serif;
      border:1px solid rgba(91,156,246,0.2);
      max-width:480px;
      margin:0 auto;
      position:relative;
      overflow:hidden;
    ">

      <!-- ░░ SECURITY LAYER 1: Void crosshatch pattern ░░ -->
      <div style="
        position:absolute;inset:0;pointer-events:none;z-index:0;
        background-image:
          repeating-linear-gradient(45deg, transparent, transparent 18px, rgba(91,156,246,0.03) 18px, rgba(91,156,246,0.03) 20px),
          repeating-linear-gradient(-45deg, transparent, transparent 18px, rgba(91,156,246,0.03) 18px, rgba(91,156,246,0.03) 20px);
      "></div>

      <!-- ░░ SECURITY LAYER 2: Diagonal watermark ░░ -->
      <div style="
        position:absolute;inset:0;pointer-events:none;z-index:0;
        display:flex;flex-direction:column;justify-content:space-around;
        overflow:hidden;
      ">
        ${[...Array(5)].map(() => `
          <div style="
            white-space:nowrap;
            transform:rotate(-35deg) translateX(-10%);
            font-size:18px;font-weight:900;
            color:rgba(10,22,40,0.04);
            letter-spacing:8px;
            font-family:'Syne',sans-serif;
            text-transform:uppercase;
          ">OFFICIAL RECEIPT • ${esc(d.groupName)} • OFFICIAL RECEIPT • ${esc(d.groupName)} •</div>
        `).join('')}
      </div>

      <!-- ░░ ALL RECEIPT CONTENT — sits above security layers ░░ -->
      <div style="position:relative;z-index:1;">

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

        <!-- ░░ SECURITY LAYER 3: Hash verification bar ░░ -->
        <div style="
          background:#f8faff;
          border:1px dashed rgba(91,156,246,0.4);
          border-radius:8px;
          padding:12px 14px;
          margin-bottom:20px;
        ">
          <div style="font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:rgba(58,114,216,0.8);margin-bottom:6px;">
            🔐 Security Verification Code
          </div>
          <div style="font-family:monospace;font-size:15px;font-weight:700;letter-spacing:3px;color:#0a1628;margin-bottom:6px;">
            ${hash}
          </div>
          <div style="font-size:10px;color:#aaa;line-height:1.5;">
            This code is mathematically derived from the receipt data. Any alteration to the amount, member, or date will invalidate this code. Verify against receipt #${esc(d.receiptNo)} in group records.
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

      </div><!-- end content z-index wrapper -->
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
  const hash = generateReceiptHash(d);

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });

    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    let y = 15;

    // ── SECURITY: Void crosshatch pattern across entire page
    doc.setDrawColor(91, 156, 246, 0.08);
    doc.setLineWidth(0.1);
    for (let i = -H; i < W + H; i += 8) {
      doc.line(i, 0, i + H, H);
      doc.line(i + H, 0, i, H);
    }

    // ── SECURITY: Diagonal watermark text
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.04 }));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(10, 22, 40);
    for (let wy = 20; wy < H; wy += 35) {
      doc.text(`OFFICIAL RECEIPT • ${d.groupName.toUpperCase()}`, W / 2, wy, {
        align: 'center', angle: 35
      });
    }
    doc.restoreGraphicsState();

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
    y += 16;

    // ── SECURITY: Hash verification bar
    doc.setFillColor(248, 250, 255);
    doc.setDrawColor(91, 156, 246);
    doc.setLineWidth(0.3);
    doc.setLineDash([2, 2]);
    doc.roundedRect(10, y, W - 20, 22, 2, 2, 'FD');
    doc.setLineDash([]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(58, 114, 216);
    doc.text('SECURITY VERIFICATION CODE', 14, y + 6);
    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(10, 22, 40);
    doc.text(hash, W / 2, y + 13, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(160, 160, 160);
    doc.text('Any alteration to this receipt invalidates the above code.', W / 2, y + 19, { align: 'center' });
    y += 28;

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

    doc.save(`Receipt-${d.receiptNo}-${d.memberName.replace(/\s+/g, '-')}.pdf`);
    showToast('Receipt downloaded successfully', 'success');

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
    <style>
      body { margin:0; padding:20px; background:#fff; }
      @media print {
        body { padding:0; }
        /* Make watermark stronger on print */
        [data-watermark] { opacity: 0.08 !important; }
      }
    </style>
    </head><body>
    ${doc.outerHTML}
    <script>window.onload=()=>{window.print();window.close();}<\/script>
    </body></html>`);
  win.document.close();
}