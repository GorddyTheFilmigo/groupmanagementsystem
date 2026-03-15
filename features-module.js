// ═══════════════════════════════════════════════════════════════
//  GORDYTHEFILMIGO — FEATURES MODULE v2
// ═══════════════════════════════════════════════════════════════

// ── HELPER: always safe isOfficial check ──────────────────────
function _off(){return window._isOfficial===true;}
function fmtDate(d){if(!d)return'—';return new Date(d).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'});}
function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// ═══════════════════════════════════════════════════════════════
//  1. DARK / LIGHT MODE
// ═══════════════════════════════════════════════════════════════
function initTheme(){
  const saved=localStorage.getItem('gf_theme')||'dark';
  applyTheme(saved);
}
function toggleTheme(){
  const current=localStorage.getItem('gf_theme')||'dark';
  const next=current==='dark'?'light':'dark';
  localStorage.setItem('gf_theme',next);
  applyTheme(next);
  showToast(next==='light'?'☀️ Light mode on':'🌙 Dark mode on','info');
}
function applyTheme(theme){
  document.body.classList.remove('theme-light','theme-dark');
  document.body.classList.add('theme-'+theme);
  const btn=document.getElementById('themeToggleBtn');
  if(btn)btn.textContent=theme==='dark'?'☀️':'🌙';
}

// ═══════════════════════════════════════════════════════════════
//  2. SWAHILI / ENGLISH TOGGLE
// ═══════════════════════════════════════════════════════════════
const TRANSLATIONS={
  en:{dashboard:'Dashboard',noticeboard:'Noticeboard',members:'Members',events:'Events',schemes:'Recurring Schemes',contributions:'All Contributions',expenses:'Expenses & Balance',defaulters:'Defaulters',myStatement:'My Statement',reports:'Reports',elections:'Elections',voting:'Voting',manageUsers:'Manage Users',settings:'M-Pesa Settings',minutes:'Meeting Minutes',agendas:'Agendas',budgets:'Budget Planning',documents:'Document Vault',amendments:'Amendment Log',signOut:'Sign Out',overview:'Overview',finances:'Finances',governance:'Governance',adminOnly:'Admin Only',addEvent:'+ Add Event',addContrib:'+ Manual Entry',addScheme:'+ New Scheme',addExpense:'+ Log Expense',welcome:'Welcome back',loading:'Loading...',save:'Save',cancel:'Cancel',close:'Close',delete:'Delete',edit:'Edit',submit:'Submit',confirm:'Confirm',search:'Search...',filter:'Filter',export:'Export CSV',print:'Print',noData:'No data found.',success:'Success!',error:'Error'},
  sw:{dashboard:'Dashibodi',noticeboard:'Bodi ya Matangazo',members:'Wanachama',events:'Matukio',schemes:'Mipango ya Mara kwa Mara',contributions:'Michango Yote',expenses:'Matumizi & Salio',defaulters:'Wadaiwa',myStatement:'Taarifa Yangu',reports:'Ripoti',elections:'Uchaguzi',voting:'Kupiga Kura',manageUsers:'Simamia Watumiaji',settings:'Mipangilio ya M-Pesa',minutes:'Kumbukumbu za Mkutano',agendas:'Ajenda',budgets:'Mipango ya Bajeti',documents:'Hazina ya Nyaraka',amendments:'Kumbukumbu za Marekebisho',signOut:'Toka',overview:'Muhtasari',finances:'Fedha',governance:'Utawala',adminOnly:'Msimamizi Pekee',addEvent:'+ Ongeza Tukio',addContrib:'+ Ingiza Mkono',addScheme:'+ Mpango Mpya',addExpense:'+ Rekodi Matumizi',welcome:'Karibu tena',loading:'Inapakia...',save:'Hifadhi',cancel:'Ghairi',close:'Funga',delete:'Futa',edit:'Hariri',submit:'Wasilisha',confirm:'Thibitisha',search:'Tafuta...',filter:'Chuja',export:'Hamisha CSV',print:'Chapisha',noData:'Hakuna data.',success:'Imefanikiwa!',error:'Hitilafu'}
};
let currentLang=localStorage.getItem('gf_lang')||'en';
function t(key){return TRANSLATIONS[currentLang][key]||TRANSLATIONS['en'][key]||key;}
function toggleLanguage(){
  currentLang=currentLang==='en'?'sw':'en';
  localStorage.setItem('gf_lang',currentLang);
  applyLanguage();
  showToast(currentLang==='sw'?'🇰🇪 Kiswahili kimewashwa':'🇬🇧 English enabled','info');
}
function applyLanguage(){
  const btn=document.getElementById('langToggleBtn');
  if(btn)btn.textContent=currentLang==='en'?'🇰🇪 SW':'🇬🇧 EN';
  const navMap={
    dashboard:'dashboard',
    noticeboard:'noticeboard',
    members:'members',
    events:'events',
    schemes:'schemes',
    contributions:'contributions',
    myReceipts:'myReceipts',
    expenses:'expenses',
    defaulters:'defaulters',
    myStatement:'myStatement',
    budgets:'budgets',
    reports:'reports',
    elections:'elections',
    minutes:'minutes',
    agendas:'agendas',
    documents:'documents',
    amendments:'amendments',
    manageUsers:'manageUsers',
    settings:'settings'
  };
  Object.entries(navMap).forEach(([page,key])=>{
    const el=document.querySelector(`[data-page="${page}"] .nav-label`);
    if(el)el.textContent=t(key);
  });
}

// ═══════════════════════════════════════════════════════════════
//  3. AMENDMENT LOG
// ═══════════════════════════════════════════════════════════════
async function logAmendment(changeType,oldValue,newValue,reason=''){
  try{
    await sb.from('group_amendments').insert([{group_id:currentProfile.group_id,change_type:changeType,old_value:String(oldValue||''),new_value:String(newValue||''),changed_by:currentProfile.id,reason}]);
  }catch(e){console.warn('Amendment log error:',e.message);}
}

function renderAmendments(){
  const content=document.getElementById('amendmentsContent');
  if(!content)return;
  const isOff=_off();
  const mm=Object.fromEntries((allMembers||[]).map(m=>[m.id,m]));
  const rows=(allAmendments||[]);
  content.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
      <div style="font-size:14px;color:var(--text-muted);">${rows.length} amendment(s) recorded</div>
      ${isOff?`<button class="btn btn-primary btn-sm" onclick="openAddAmendmentModal()">+ Add Entry</button>`:''}
    </div>
    ${rows.length?`
    <div class="table-card">
      <div style="overflow-x:auto;">
        <table>
          <thead><tr><th>Change Type</th><th>Old Value</th><th>New Value</th><th>Reason</th><th>Changed By</th><th>Date</th></tr></thead>
          <tbody>
            ${rows.map(a=>`
              <tr>
                <td><span class="badge badge-admin">${esc(a.change_type)}</span></td>
                <td style="color:var(--danger);font-size:12px;">${esc(a.old_value||'—')}</td>
                <td style="color:var(--accent2);font-size:12px;">${esc(a.new_value||'—')}</td>
                <td style="color:var(--text-muted);font-size:12px;">${esc(a.reason||'—')}</td>
                <td>${esc(mm[a.changed_by]?.full_name||'System')}</td>
                <td style="color:var(--text-muted);font-size:12px;">${fmtDate(a.created_at)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`:`<div class="empty"><div class="empty-icon">📜</div><p>No amendments recorded yet.${isOff?' Click <strong>+ Add Entry</strong> to record a change.':''}</p></div>`}`;
}

function openAddAmendmentModal(){
  document.getElementById('amendModalOverlay')?.remove();
  const html=`
    <div class="modal-overlay open" id="amendModalOverlay">
      <div class="modal">
        <div class="modal-title">📜 Add Amendment Entry</div>
        <div class="modal-sub">Record a change to group rules or settings</div>
        <div class="field"><label>Change Type</label>
          <select id="am-type" class="filter-select" style="width:100%">
            <option value="Contribution Amount Changed">Contribution Amount Changed</option>
            <option value="Membership Fee Changed">Membership Fee Changed</option>
            <option value="Suspension Policy Changed">Suspension Policy Changed</option>
            <option value="Group Name Changed">Group Name Changed</option>
            <option value="Meeting Schedule Changed">Meeting Schedule Changed</option>
            <option value="Role Assignment Changed">Role Assignment Changed</option>
            <option value="Constitution Amended">Constitution Amended</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="fields-row">
          <div class="field"><label>Old Value</label><input id="am-old" type="text" placeholder="e.g. KES 500"/></div>
          <div class="field"><label>New Value</label><input id="am-new" type="text" placeholder="e.g. KES 1000"/></div>
        </div>
        <div class="field"><label>Reason</label><textarea id="am-reason" placeholder="Why was this change made?" style="min-height:80px;"></textarea></div>
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="document.getElementById('amendModalOverlay').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="saveAmendment()">Save Entry</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend',html);
}

async function saveAmendment(){
  const changeType=document.getElementById('am-type').value;
  const oldValue=document.getElementById('am-old').value.trim();
  const newValue=document.getElementById('am-new').value.trim();
  const reason=document.getElementById('am-reason').value.trim();
  if(!changeType)return showToast('Select a change type','error');
  await logAmendment(changeType,oldValue,newValue,reason);
  document.getElementById('amendModalOverlay')?.remove();
  const{data}=await sb.from('group_amendments').select('*').eq('group_id',currentProfile.group_id).order('created_at',{ascending:false});
  allAmendments=data||[];
  renderAmendments();
  showToast('Amendment recorded','success');
}

// ═══════════════════════════════════════════════════════════════
//  4. MEETING MINUTES
// ═══════════════════════════════════════════════════════════════
function renderMinutes(){
  const content=document.getElementById('minutesContent');
  if(!content)return;
  const isOff=_off();
  content.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
      <select class="filter-select" id="min-status-filter" onchange="renderMinutesList()">
        <option value="">All</option>
        <option value="draft">Drafts</option>
        <option value="published">Published</option>
      </select>
      ${isOff?`<button class="btn btn-primary btn-sm" onclick="openMinutesEditor()">+ New Minutes</button>`:''}
    </div>
    <div id="minutesList"></div>`;
  renderMinutesList();
}

function renderMinutesList(){
  const container=document.getElementById('minutesList');
  if(!container)return;
  const statusFilter=document.getElementById('min-status-filter')?.value||'';
  const isOff=_off();
  const mm=Object.fromEntries((allMembers||[]).map(m=>[m.id,m]));
  const filtered=(allMinutes||[]).filter(m=>!statusFilter||m.status===statusFilter);
  if(!filtered.length){
    container.innerHTML=`<div class="empty"><div class="empty-icon">📝</div><p>No meeting minutes yet.${isOff?' Click <strong>+ New Minutes</strong> to create one.':''}</p></div>`;
    return;
  }
  container.innerHTML=filtered.map(m=>`
    <div class="event-card" style="margin-bottom:16px;">
      <div class="event-card-header">
        <div>
          <div class="event-card-name">${esc(m.title)}</div>
          <div class="event-card-meta">
            <span>📅 ${fmtDate(m.meeting_date)}</span>
            <span>✍️ ${esc(mm[m.author_id]?.full_name||'Unknown')}</span>
            <span class="badge ${m.status==='published'?'badge-paid':'badge-unpaid'}">${m.status==='published'?'✅ Published':'📝 Draft'}</span>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-secondary btn-sm" onclick="viewMinutes('${m.id}')">👁 View</button>
          ${isOff?`
            <button class="btn btn-secondary btn-sm" onclick="openMinutesEditor('${m.id}')">✏️ Edit</button>
            ${m.status==='draft'?`<button class="btn btn-success btn-sm" onclick="publishMinutes('${m.id}')">📢 Publish</button>`:''}
            <button class="btn btn-danger btn-sm" onclick="deleteMinutes('${m.id}')">✕</button>
          `:''}
        </div>
      </div>
      ${m.content?`<div style="padding:0 0 12px;"><p style="color:var(--text-muted);font-size:13px;line-height:1.6;">${esc(m.content.substring(0,200))}${m.content.length>200?'...':''}</p></div>`:''}
    </div>`).join('');
}

function openMinutesEditor(id=null){
  document.getElementById('minutesEditorOverlay')?.remove();
  const existing=id?(allMinutes||[]).find(m=>m.id===id):null;
  const html=`
    <div class="modal-overlay open" id="minutesEditorOverlay">
      <div class="modal modal-wide">
        <div class="modal-title">${existing?'✏️ Edit Minutes':'📝 New Meeting Minutes'}</div>
        <div class="field"><label>Title</label><input id="min-title" type="text" placeholder="e.g. January 2026 Monthly Meeting" value="${esc(existing?.title||'')}"/></div>
        <div class="field"><label>Meeting Date</label><input id="min-date" type="date" value="${existing?.meeting_date||''}"/></div>
        <div class="field"><label>Minutes Content</label><textarea id="min-content" style="min-height:220px;line-height:1.7;" placeholder="Write the meeting minutes here...">${esc(existing?.content||'')}</textarea></div>
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="document.getElementById('minutesEditorOverlay').remove()">Cancel</button>
          <button class="btn btn-secondary" onclick="saveMinutes('${id||''}','draft')">💾 Save Draft</button>
          <button class="btn btn-primary" onclick="saveMinutes('${id||''}','published')">📢 Publish</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend',html);
}

async function saveMinutes(id,status){
  const title=document.getElementById('min-title').value.trim();
  const date=document.getElementById('min-date').value;
  const content=document.getElementById('min-content').value.trim();
  if(!title||!date)return showToast('Title and date are required','error');
  try{
    if(id){
      await sb.from('group_minutes').update({title,meeting_date:date,content,status,updated_at:new Date().toISOString()}).eq('id',id);
    }else{
      await sb.from('group_minutes').insert([{group_id:currentProfile.group_id,title,meeting_date:date,content,status,author_id:currentProfile.id}]);
    }
    document.getElementById('minutesEditorOverlay')?.remove();
    const{data}=await sb.from('group_minutes').select('*').eq('group_id',currentProfile.group_id).order('meeting_date',{ascending:false});
    allMinutes=data||[];
    renderMinutes();
    showToast(status==='published'?'Minutes published!':'Draft saved','success');
  }catch(e){showToast('Failed to save: '+e.message,'error');}
}

function viewMinutes(id){
  const m=(allMinutes||[]).find(x=>x.id===id);
  if(!m)return;
  document.getElementById('minutesViewOverlay')?.remove();
  const html=`
    <div class="modal-overlay open" id="minutesViewOverlay">
      <div class="modal modal-wide">
        <div class="modal-title">📝 ${esc(m.title)}</div>
        <div class="modal-sub">Meeting Date: ${fmtDate(m.meeting_date)}</div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;padding:20px;font-size:14px;line-height:1.8;white-space:pre-wrap;max-height:400px;overflow-y:auto;">${esc(m.content||'No content recorded.')}</div>
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="document.getElementById('minutesViewOverlay').remove()">Close</button>
          <button class="btn btn-primary" onclick="printMinutes('${id}')">🖨 Print</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend',html);
}

function printMinutes(id){
  const m=(allMinutes||[]).find(x=>x.id===id);
  if(!m)return;
  const win=window.open('','_blank');
  win.document.write(`<html><head><title>${m.title}</title><style>body{font-family:Arial,sans-serif;padding:40px;max-width:700px;margin:0 auto;}h1{font-size:22px;}p{line-height:1.8;}</style></head><body><h1>${m.title}</h1><p><strong>Meeting Date:</strong> ${fmtDate(m.meeting_date)}</p><hr/><p>${(m.content||'').replace(/\n/g,'<br/>')}</p><script>window.onload=()=>{window.print();window.close();}<\/script></body></html>`);
  win.document.close();
}

async function publishMinutes(id){
  await sb.from('group_minutes').update({status:'published'}).eq('id',id);
  const{data}=await sb.from('group_minutes').select('*').eq('group_id',currentProfile.group_id).order('meeting_date',{ascending:false});
  allMinutes=data||[];
  renderMinutes();
  showToast('Minutes published!','success');
}

async function deleteMinutes(id){
  if(!confirm('Delete these minutes?'))return;
  await sb.from('group_minutes').delete().eq('id',id);
  const{data}=await sb.from('group_minutes').select('*').eq('group_id',currentProfile.group_id).order('meeting_date',{ascending:false});
  allMinutes=data||[];
  renderMinutes();
  showToast('Deleted','info');
}

// ═══════════════════════════════════════════════════════════════
//  5. AGENDA BUILDER
// ═══════════════════════════════════════════════════════════════
function renderAgendas(){
  const content=document.getElementById('agendasContent');
  if(!content)return;
  const isOff=_off();
  content.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
      <div style="font-size:14px;color:var(--text-muted);">${(allAgendas||[]).length} agenda(s) total</div>
      ${isOff?`<button class="btn btn-primary btn-sm" onclick="openAgendaBuilder()">+ New Agenda</button>`:''}
    </div>
    <div id="agendaList"></div>`;
  renderAgendaList();
}

function renderAgendaList(){
  const container=document.getElementById('agendaList');
  if(!container)return;
  const isOff=_off();
  const agendas=allAgendas||[];
  if(!agendas.length){
    container.innerHTML=`<div class="empty"><div class="empty-icon">📋</div><p>No agendas yet.${isOff?' Click <strong>+ New Agenda</strong> to create one.':''}</p></div>`;
    return;
  }
  container.innerHTML=agendas.map(a=>{
    const items=Array.isArray(a.items)?a.items:[];
    const totalMins=items.reduce((s,i)=>s+(parseInt(i.duration)||0),0);
    return `
      <div class="event-card" style="margin-bottom:16px;">
        <div class="event-card-header">
          <div>
            <div class="event-card-name">${esc(a.title)}</div>
            <div class="event-card-meta">
              <span>📅 ${fmtDate(a.meeting_date)}</span>
              <span>📋 ${items.length} items</span>
              <span>⏱ ${totalMins} mins</span>
              <span class="badge ${a.status==='published'?'badge-paid':'badge-unpaid'}">${a.status==='published'?'✅ Published':'📝 Draft'}</span>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" onclick="viewAgenda('${a.id}')">👁 View</button>
            ${isOff?`
              <button class="btn btn-secondary btn-sm" onclick="openAgendaBuilder('${a.id}')">✏️ Edit</button>
              ${a.status==='draft'?`<button class="btn btn-success btn-sm" onclick="publishAgenda('${a.id}')">📢 Post</button>`:''}
              <button class="btn btn-danger btn-sm" onclick="deleteAgenda('${a.id}')">✕</button>
            `:''}
          </div>
        </div>
        ${items.length?`
          <div style="padding:0 0 8px;">
            ${items.slice(0,3).map((item,i)=>`
              <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
                <div style="width:22px;height:22px;border-radius:50%;background:rgba(91,156,246,0.15);color:var(--accent);font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${i+1}</div>
                <div style="flex:1;font-size:13px;">${esc(item.title||'')}</div>
                <div style="font-size:11px;color:var(--text-muted);">${item.duration||0} min</div>
                <div style="font-size:11px;color:var(--accent2);">${esc(item.owner||'')}</div>
              </div>`).join('')}
            ${items.length>3?`<div style="font-size:12px;color:var(--text-muted);padding-top:6px;">+${items.length-3} more items</div>`:''}
          </div>`:''}
      </div>`;
  }).join('');
}

function openAgendaBuilder(id=null){
  document.getElementById('agendaBuilderOverlay')?.remove();
  const existing=id?(allAgendas||[]).find(a=>a.id===id):null;
  const items=existing?.items||[{title:'',duration:10,owner:''}];
  const html=`
    <div class="modal-overlay open" id="agendaBuilderOverlay">
      <div class="modal modal-wide">
        <div class="modal-title">${existing?'✏️ Edit Agenda':'📋 New Meeting Agenda'}</div>
        <div class="fields-row">
          <div class="field"><label>Agenda Title</label><input id="ag-title" type="text" placeholder="e.g. February 2026 Meeting" value="${esc(existing?.title||'')}"/></div>
          <div class="field"><label>Meeting Date</label><input id="ag-date" type="date" value="${existing?.meeting_date||''}"/></div>
        </div>
        <div class="field">
          <label>Agenda Items</label>
          <div id="agendaItemsContainer">${items.map((item,i)=>agendaItemRow(i,item)).join('')}</div>
          <button class="btn btn-secondary btn-sm" style="margin-top:10px;" onclick="addAgendaItem()">+ Add Item</button>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="document.getElementById('agendaBuilderOverlay').remove()">Cancel</button>
          <button class="btn btn-secondary" onclick="saveAgenda('${id||''}','draft')">💾 Save Draft</button>
          <button class="btn btn-primary" onclick="saveAgenda('${id||''}','published')">📢 Publish</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend',html);
}

function agendaItemRow(i,item={}){
  return `
    <div class="agenda-item-row" id="agrow-${i}" style="display:grid;grid-template-columns:1fr 80px 140px 36px;gap:8px;margin-bottom:8px;align-items:center;">
      <input type="text" placeholder="Agenda item title" value="${esc(item.title||'')}" style="background:rgba(10,22,40,0.8);border:1px solid var(--border);border-radius:8px;padding:9px 12px;color:var(--text);font-size:13px;outline:none;width:100%;" class="ag-item-title"/>
      <input type="number" placeholder="Mins" value="${item.duration||10}" min="1" style="background:rgba(10,22,40,0.8);border:1px solid var(--border);border-radius:8px;padding:9px 8px;color:var(--text);font-size:13px;outline:none;text-align:center;width:100%;" class="ag-item-duration"/>
      <input type="text" placeholder="Owner" value="${esc(item.owner||'')}" style="background:rgba(10,22,40,0.8);border:1px solid var(--border);border-radius:8px;padding:9px 12px;color:var(--text);font-size:13px;outline:none;width:100%;" class="ag-item-owner"/>
      <button onclick="this.closest('.agenda-item-row').remove()" style="background:rgba(240,84,79,0.1);color:var(--danger);border:1px solid rgba(240,84,79,0.2);border-radius:8px;padding:9px;cursor:pointer;font-size:14px;width:36px;">✕</button>
    </div>`;
}

function addAgendaItem(){
  const container=document.getElementById('agendaItemsContainer');
  if(!container)return;
  const i=container.children.length;
  container.insertAdjacentHTML('beforeend',agendaItemRow(i));
}

async function saveAgenda(id,status){
  const title=document.getElementById('ag-title').value.trim();
  const date=document.getElementById('ag-date').value;
  if(!title||!date)return showToast('Title and date are required','error');
  const rows=document.querySelectorAll('.agenda-item-row');
  const items=Array.from(rows).map(row=>({
    title:row.querySelector('.ag-item-title')?.value.trim()||'',
    duration:parseInt(row.querySelector('.ag-item-duration')?.value)||10,
    owner:row.querySelector('.ag-item-owner')?.value.trim()||''
  })).filter(i=>i.title);
  try{
    if(id){
      await sb.from('group_agendas').update({title,meeting_date:date,items,status}).eq('id',id);
    }else{
      await sb.from('group_agendas').insert([{group_id:currentProfile.group_id,title,meeting_date:date,items,status,created_by:currentProfile.id}]);
    }
    document.getElementById('agendaBuilderOverlay')?.remove();
    const{data}=await sb.from('group_agendas').select('*').eq('group_id',currentProfile.group_id).order('meeting_date',{ascending:false});
    allAgendas=data||[];
    renderAgendas();
    showToast(status==='published'?'Agenda published!':'Draft saved','success');
  }catch(e){showToast('Failed: '+e.message,'error');}
}

function viewAgenda(id){
  const a=(allAgendas||[]).find(x=>x.id===id);
  if(!a)return;
  document.getElementById('agendaViewOverlay')?.remove();
  const items=Array.isArray(a.items)?a.items:[];
  const totalMins=items.reduce((s,i)=>s+(parseInt(i.duration)||0),0);
  const html=`
    <div class="modal-overlay open" id="agendaViewOverlay">
      <div class="modal modal-wide">
        <div class="modal-title">📋 ${esc(a.title)}</div>
        <div class="modal-sub">📅 ${fmtDate(a.meeting_date)} · ⏱ ${totalMins} minutes total</div>
        <div style="border:1px solid var(--border);border-radius:10px;overflow:hidden;">
          <div style="padding:12px 16px;background:rgba(91,156,246,0.06);border-bottom:1px solid var(--border);display:grid;grid-template-columns:36px 1fr 80px 120px;gap:10px;">
            <div style="font-size:11px;font-weight:800;color:var(--text-muted);">#</div>
            <div style="font-size:11px;font-weight:800;color:var(--text-muted);">ITEM</div>
            <div style="font-size:11px;font-weight:800;color:var(--text-muted);">TIME</div>
            <div style="font-size:11px;font-weight:800;color:var(--text-muted);">OWNER</div>
          </div>
          ${items.map((item,i)=>`
            <div style="padding:13px 16px;border-bottom:1px solid rgba(91,156,246,0.05);display:grid;grid-template-columns:36px 1fr 80px 120px;gap:10px;align-items:center;">
              <div style="width:24px;height:24px;border-radius:50%;background:rgba(91,156,246,0.15);color:var(--accent);font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;">${i+1}</div>
              <div style="font-size:14px;">${esc(item.title)}</div>
              <div style="font-size:12px;color:var(--accent3);">${item.duration} min</div>
              <div style="font-size:12px;color:var(--accent2);">${esc(item.owner||'—')}</div>
            </div>`).join('')}
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="document.getElementById('agendaViewOverlay').remove()">Close</button>
          <button class="btn btn-primary" onclick="printAgenda('${id}')">🖨 Print</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend',html);
}

function printAgenda(id){
  const a=(allAgendas||[]).find(x=>x.id===id);
  if(!a)return;
  const items=Array.isArray(a.items)?a.items:[];
  const rows=items.map((item,i)=>`<tr><td>${i+1}</td><td>${item.title}</td><td>${item.duration} min</td><td>${item.owner||'—'}</td></tr>`).join('');
  const win=window.open('','_blank');
  win.document.write(`<html><head><title>${a.title}</title><style>body{font-family:Arial,sans-serif;padding:40px;}table{width:100%;border-collapse:collapse;}th,td{padding:10px;border:1px solid #ddd;text-align:left;}th{background:#f5f5f5;}</style></head><body><h2>${a.title}</h2><p>Meeting Date: ${fmtDate(a.meeting_date)}</p><table><thead><tr><th>#</th><th>Agenda Item</th><th>Duration</th><th>Owner</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=()=>{window.print();window.close();}<\/script></body></html>`);
  win.document.close();
}

async function publishAgenda(id){
  await sb.from('group_agendas').update({status:'published'}).eq('id',id);
  const a=(allAgendas||[]).find(x=>x.id===id);
  if(a){
    await sb.from('group_notices').insert([{group_id:currentProfile.group_id,title:'📋 Agenda: '+a.title,body:`Meeting scheduled for ${fmtDate(a.meeting_date)}. ${(a.items||[]).length} agenda items. Please review before the meeting.`,notice_type:'general',is_pinned:false,author_id:currentProfile.id,read_by:{}}]);
  }
  const{data}=await sb.from('group_agendas').select('*').eq('group_id',currentProfile.group_id).order('meeting_date',{ascending:false});
  allAgendas=data||[];
  renderAgendas();
  showToast('Agenda published and posted to noticeboard!','success');
}

async function deleteAgenda(id){
  if(!confirm('Delete this agenda?'))return;
  await sb.from('group_agendas').delete().eq('id',id);
  const{data}=await sb.from('group_agendas').select('*').eq('group_id',currentProfile.group_id).order('meeting_date',{ascending:false});
  allAgendas=data||[];
  renderAgendas();
  showToast('Deleted','info');
}

// ═══════════════════════════════════════════════════════════════
//  6. BUDGET PLANNING + TRACKING
// ═══════════════════════════════════════════════════════════════
function renderBudgets(){
  const content=document.getElementById('budgetsContent');
  if(!content)return;
  const isOff=_off();
  content.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
      <select class="filter-select" id="bud-status-filter" onchange="renderBudgetList()">
        <option value="">All Budgets</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
      ${isOff?`<button class="btn btn-primary btn-sm" onclick="openBudgetModal()">+ New Budget</button>`:''}
    </div>
    <div id="budgetList"></div>`;
  renderBudgetList();
}

function renderBudgetList(){
  const container=document.getElementById('budgetList');
  if(!container)return;
  const isOff=_off();
  const statusFilter=document.getElementById('bud-status-filter')?.value||'';
  const filtered=(allBudgets||[]).filter(b=>!statusFilter||b.status===statusFilter);
  if(!filtered.length){
    container.innerHTML=`<div class="empty"><div class="empty-icon">📊</div><p>No budgets created yet.${isOff?' Click <strong>+ New Budget</strong> to create one.':''}</p></div>`;
    return;
  }
  container.innerHTML=filtered.map(b=>{
    const items=(allBudgetItems||[]).filter(i=>i.budget_id===b.id);
    const totalPlanned=items.reduce((s,i)=>s+parseFloat(i.planned_amount||0),0);
    const totalActual=items.reduce((s,i)=>s+parseFloat(i.actual_amount||0),0);
    const totalBudget=parseFloat(b.total_budget||totalPlanned||0);
    const pct=totalBudget>0?Math.min(100,Math.round((totalActual/totalBudget)*100)):0;
    const overBudget=totalActual>totalBudget&&totalBudget>0;
    const barColor=pct<70?'var(--accent2)':pct<90?'var(--accent3)':'var(--danger)';
    const completedItems=items.filter(i=>i.status==='completed').length;
    return `
      <div class="event-card" style="margin-bottom:16px;">
        <div class="event-card-header">
          <div>
            <div class="event-card-name">${esc(b.title)}</div>
            <div class="event-card-meta">
              <span>📅 ${fmtDate(b.start_date)} → ${fmtDate(b.end_date)}</span>
              <span class="badge ${b.status==='active'?'badge-paid':b.status==='completed'?'badge-monthly':'badge-unpaid'}">${b.status}</span>
              <span>🏷 ${esc(b.budget_type||'project')}</span>
              <span>${completedItems}/${items.length} tasks done</span>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" onclick="openBudgetDetail('${b.id}')">📊 Details</button>
            ${isOff?`
              <button class="btn btn-secondary btn-sm" onclick="openBudgetModal('${b.id}')">✏️ Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteBudget('${b.id}')">✕</button>
            `:''}
          </div>
        </div>
        <div style="margin-top:12px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;">
            <span style="color:var(--text-muted);">Spent vs Budget</span>
            <span style="color:${overBudget?'var(--danger)':'var(--accent2)'}">KES ${totalActual.toLocaleString()} / KES ${totalBudget.toLocaleString()} ${overBudget?'⚠️ OVER':''}</span>
          </div>
          <div class="progress-wrap"><div class="progress-bar" style="width:${pct}%;background:${barColor};"></div></div>
          <div style="text-align:right;font-size:11px;color:var(--text-muted);margin-top:4px;">${pct}% used</div>
        </div>
      </div>`;
  }).join('');
}

function openBudgetModal(id=null){
  document.getElementById('budgetModalOverlay')?.remove();
  const existing=id?(allBudgets||[]).find(b=>b.id===id):null;
  const html=`
    <div class="modal-overlay open" id="budgetModalOverlay">
      <div class="modal modal-wide">
        <div class="modal-title">${existing?'✏️ Edit Budget':'📊 New Budget / Project'}</div>
        <div class="field"><label>Title</label><input id="bud-title" type="text" placeholder="e.g. Community Hall Renovation" value="${esc(existing?.title||'')}"/></div>
        <div class="field"><label>Description</label><textarea id="bud-desc" placeholder="What is this budget for?">${esc(existing?.description||'')}</textarea></div>
        <div class="fields-row">
          <div class="field"><label>Total Budget (KES)</label><input id="bud-total" type="number" placeholder="0" value="${existing?.total_budget||''}"/></div>
          <div class="field"><label>Type</label>
            <select id="bud-type" class="filter-select" style="width:100%">
              <option value="project" ${existing?.budget_type==='project'?'selected':''}>Project</option>
              <option value="event" ${existing?.budget_type==='event'?'selected':''}>Event</option>
              <option value="operations" ${existing?.budget_type==='operations'?'selected':''}>Operations</option>
              <option value="welfare" ${existing?.budget_type==='welfare'?'selected':''}>Welfare</option>
            </select>
          </div>
        </div>
        <div class="fields-row">
          <div class="field"><label>Start Date</label><input id="bud-start" type="date" value="${existing?.start_date||''}"/></div>
          <div class="field"><label>End Date</label><input id="bud-end" type="date" value="${existing?.end_date||''}"/></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="document.getElementById('budgetModalOverlay').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="saveBudget('${id||''}')">Save Budget</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend',html);
}

async function saveBudget(id){
  const title=document.getElementById('bud-title').value.trim();
  const description=document.getElementById('bud-desc').value.trim();
  const total_budget=parseFloat(document.getElementById('bud-total').value)||0;
  const budget_type=document.getElementById('bud-type').value;
  const start_date=document.getElementById('bud-start').value;
  const end_date=document.getElementById('bud-end').value;
  if(!title)return showToast('Title is required','error');
  try{
    if(id){
      await sb.from('group_budgets').update({title,description,total_budget,budget_type,start_date,end_date}).eq('id',id);
    }else{
      await sb.from('group_budgets').insert([{group_id:currentProfile.group_id,title,description,total_budget,budget_type,start_date,end_date,status:'active',created_by:currentProfile.id}]);
    }
    document.getElementById('budgetModalOverlay')?.remove();
    const[{data:budgets},{data:items}]=await Promise.all([
      sb.from('group_budgets').select('*').eq('group_id',currentProfile.group_id).order('created_at',{ascending:false}),
      sb.from('group_budget_items').select('*').eq('group_id',currentProfile.group_id)
    ]);
    allBudgets=budgets||[];allBudgetItems=items||[];
    renderBudgets();
    showToast('Budget saved!','success');
  }catch(e){showToast('Failed: '+e.message,'error');}
}

function openBudgetDetail(id){
  document.getElementById('budgetDetailOverlay')?.remove();
  const b=(allBudgets||[]).find(x=>x.id===id);
  if(!b)return;
  const items=(allBudgetItems||[]).filter(i=>i.budget_id===id);
  const isOff=_off();
  const html=`
    <div class="modal-overlay open" id="budgetDetailOverlay">
      <div class="modal modal-wide">
        <div class="modal-title">📊 ${esc(b.title)}</div>
        <div class="modal-sub">${esc(b.description||'')} · Total Budget: KES ${parseFloat(b.total_budget||0).toLocaleString()}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
          <span style="font-size:13px;color:var(--text-muted);">${items.length} budget item(s)</span>
          ${isOff?`<button class="btn btn-primary btn-sm" onclick="openBudgetItemModal('${id}')">+ Add Item</button>`:''}
        </div>
        <div id="budgetItemsList">
          ${items.length?`
            <div style="border:1px solid var(--border);border-radius:10px;overflow:hidden;overflow-x:auto;">
              <table style="width:100%;border-collapse:collapse;min-width:500px;">
                <thead><tr>
                  <th style="padding:10px 14px;font-size:11px;font-weight:800;color:var(--text-muted);text-align:left;border-bottom:1px solid var(--border);">Description</th>
                  <th style="padding:10px 14px;font-size:11px;font-weight:800;color:var(--text-muted);text-align:left;border-bottom:1px solid var(--border);">Category</th>
                  <th style="padding:10px 14px;font-size:11px;font-weight:800;color:var(--text-muted);text-align:left;border-bottom:1px solid var(--border);">Planned</th>
                  <th style="padding:10px 14px;font-size:11px;font-weight:800;color:var(--text-muted);text-align:left;border-bottom:1px solid var(--border);">Actual</th>
                  <th style="padding:10px 14px;font-size:11px;font-weight:800;color:var(--text-muted);text-align:left;border-bottom:1px solid var(--border);">Status</th>
                  ${isOff?`<th style="padding:10px 14px;border-bottom:1px solid var(--border);"></th>`:''}
                </tr></thead>
                <tbody>
                  ${items.map(item=>{
                    const diff=parseFloat(item.actual_amount||0)-parseFloat(item.planned_amount||0);
                    return `<tr>
                      <td style="padding:12px 14px;font-size:13px;">${esc(item.description)}</td>
                      <td style="padding:12px 14px;font-size:12px;color:var(--text-muted);">${esc(item.category||'—')}</td>
                      <td style="padding:12px 14px;font-size:13px;">KES ${parseFloat(item.planned_amount||0).toLocaleString()}</td>
                      <td style="padding:12px 14px;font-size:13px;color:${diff>0?'var(--danger)':'var(--accent2)'}">KES ${parseFloat(item.actual_amount||0).toLocaleString()} ${diff>0?'↑':diff<0?'↓':''}</td>
                      <td style="padding:12px 14px;"><span class="badge ${item.status==='completed'?'badge-paid':item.status==='in_progress'?'badge-monthly':'badge-inactive'}">${item.status||'pending'}</span></td>
                      ${isOff?`<td style="padding:12px 14px;"><button class="btn btn-xs btn-secondary" onclick="openBudgetItemModal('${id}','${item.id}')">✏️</button></td>`:''}
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>`:`<div class="empty"><div class="empty-icon">📋</div><p>No budget items yet.${isOff?' Click <strong>+ Add Item</strong> to start tracking expenses.':''}</p></div>`}
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="document.getElementById('budgetDetailOverlay').remove()">Close</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend',html);
}

function openBudgetItemModal(budgetId,itemId=null){
  document.getElementById('budgetItemModalOverlay')?.remove();
  const existing=itemId?(allBudgetItems||[]).find(i=>i.id===itemId):null;
  const html=`
    <div class="modal-overlay open" id="budgetItemModalOverlay" style="z-index:1100;">
      <div class="modal">
        <div class="modal-title">${existing?'✏️ Edit Item':'➕ Add Budget Item'}</div>
        <div class="field"><label>Description</label><input id="bi-desc" type="text" placeholder="e.g. Cement bags (50 bags)" value="${esc(existing?.description||'')}"/></div>
        <div class="fields-row">
          <div class="field"><label>Category</label>
            <select id="bi-cat" class="filter-select" style="width:100%">
              <option value="materials" ${existing?.category==='materials'?'selected':''}>Materials</option>
              <option value="labour" ${existing?.category==='labour'?'selected':''}>Labour</option>
              <option value="transport" ${existing?.category==='transport'?'selected':''}>Transport</option>
              <option value="equipment" ${existing?.category==='equipment'?'selected':''}>Equipment</option>
              <option value="food" ${existing?.category==='food'?'selected':''}>Food & Drinks</option>
              <option value="other" ${existing?.category==='other'?'selected':''}>Other</option>
            </select>
          </div>
          <div class="field"><label>Status</label>
            <select id="bi-status" class="filter-select" style="width:100%">
              <option value="pending" ${!existing||existing?.status==='pending'?'selected':''}>Pending</option>
              <option value="in_progress" ${existing?.status==='in_progress'?'selected':''}>In Progress</option>
              <option value="completed" ${existing?.status==='completed'?'selected':''}>Completed</option>
            </select>
          </div>
        </div>
        <div class="fields-row">
          <div class="field"><label>Planned Amount (KES)</label><input id="bi-planned" type="number" placeholder="0" value="${existing?.planned_amount||''}"/></div>
          <div class="field"><label>Actual Amount Spent (KES)</label><input id="bi-actual" type="number" placeholder="0" value="${existing?.actual_amount||''}"/></div>
        </div>
        <div class="field"><label>Notes</label><textarea id="bi-notes" placeholder="Any additional notes...">${esc(existing?.notes||'')}</textarea></div>
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="document.getElementById('budgetItemModalOverlay').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="saveBudgetItem('${budgetId}','${itemId||''}')">Save Item</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend',html);
}

async function saveBudgetItem(budgetId,itemId){
  const description=document.getElementById('bi-desc').value.trim();
  const category=document.getElementById('bi-cat').value;
  const status=document.getElementById('bi-status').value;
  const planned_amount=parseFloat(document.getElementById('bi-planned').value)||0;
  const actual_amount=parseFloat(document.getElementById('bi-actual').value)||0;
  const notes=document.getElementById('bi-notes').value.trim();
  if(!description)return showToast('Description is required','error');
  try{
    if(itemId){
      await sb.from('group_budget_items').update({description,category,status,planned_amount,actual_amount,notes}).eq('id',itemId);
    }else{
      await sb.from('group_budget_items').insert([{budget_id:budgetId,group_id:currentProfile.group_id,description,category,status,planned_amount,actual_amount,notes}]);
    }
    document.getElementById('budgetItemModalOverlay')?.remove();
    const[{data:budgets},{data:items}]=await Promise.all([
      sb.from('group_budgets').select('*').eq('group_id',currentProfile.group_id).order('created_at',{ascending:false}),
      sb.from('group_budget_items').select('*').eq('group_id',currentProfile.group_id)
    ]);
    allBudgets=budgets||[];allBudgetItems=items||[];
    document.getElementById('budgetDetailOverlay')?.remove();
    openBudgetDetail(budgetId);
    showToast('Item saved!','success');
  }catch(e){showToast('Failed: '+e.message,'error');}
}

async function deleteBudget(id){
  if(!confirm('Delete this budget and all its items?'))return;
  await sb.from('group_budget_items').delete().eq('budget_id',id);
  await sb.from('group_budgets').delete().eq('id',id);
  const[{data:budgets},{data:items}]=await Promise.all([
    sb.from('group_budgets').select('*').eq('group_id',currentProfile.group_id).order('created_at',{ascending:false}),
    sb.from('group_budget_items').select('*').eq('group_id',currentProfile.group_id)
  ]);
  allBudgets=budgets||[];allBudgetItems=items||[];
  renderBudgets();
  showToast('Budget deleted','info');
}

// ═══════════════════════════════════════════════════════════════
//  7. DOCUMENT VAULT
// ═══════════════════════════════════════════════════════════════
function renderDocumentVault(){
  const content=document.getElementById('documentsContent');
  if(!content)return;
  const isOff=_off();
  content.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
      <select class="filter-select" id="doc-cat-filter" onchange="renderDocumentList()">
        <option value="">All Categories</option>
        <option value="constitution">📜 Constitution</option>
        <option value="minutes">📝 Meeting Minutes</option>
        <option value="financial">💰 Financial</option>
        <option value="legal">⚖️ Legal</option>
        <option value="general">📄 General</option>
      </select>
      ${isOff?`<button class="btn btn-primary btn-sm" onclick="openDocumentUpload()">+ Add Document</button>`:''}
    </div>
    <div id="documentList"></div>`;
  renderDocumentList();
}

function renderDocumentList(){
  const container=document.getElementById('documentList');
  if(!container)return;
  const isOff=_off();
  const catFilter=document.getElementById('doc-cat-filter')?.value||'';
  const mm=Object.fromEntries((allMembers||[]).map(m=>[m.id,m]));
  const filtered=(allDocuments||[]).filter(d=>!catFilter||d.category===catFilter);
  if(!filtered.length){
    container.innerHTML=`<div class="empty"><div class="empty-icon">🗄️</div><p>No documents uploaded yet.${isOff?' Click <strong>+ Add Document</strong> to add one.':''}</p></div>`;
    return;
  }
  const catIcons={constitution:'📜',minutes:'📝',financial:'💰',legal:'⚖️',general:'📄'};
  container.innerHTML=`
    <div class="table-card">
      <div style="overflow-x:auto;">
        <table>
          <thead><tr><th>Document</th><th>Category</th><th>Uploaded By</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            ${filtered.map(d=>`
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div style="font-size:24px;">${catIcons[d.category]||'📄'}</div>
                    <div>
                      <div style="font-weight:600;font-size:13px;">${esc(d.name)}</div>
                      <div style="font-size:11px;color:var(--text-muted);">${esc(d.file_type||'Document')}</div>
                    </div>
                  </div>
                </td>
                <td><span class="badge badge-admin">${esc(d.category||'general')}</span></td>
                <td style="font-size:13px;">${esc(mm[d.uploaded_by]?.full_name||'Unknown')}</td>
                <td style="font-size:12px;color:var(--text-muted);">${fmtDate(d.created_at)}</td>
                <td>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    ${d.file_url?`<a href="${d.file_url}" target="_blank" class="btn btn-xs btn-primary">⬇ Open</a>`:'<span style="font-size:11px;color:var(--text-muted);">No link</span>'}
                    ${isOff?`<button class="btn btn-xs btn-danger" onclick="deleteDocument('${d.id}')">✕</button>`:''}
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function openDocumentUpload(){
  document.getElementById('docUploadOverlay')?.remove();
  const html=`
    <div class="modal-overlay open" id="docUploadOverlay">
      <div class="modal">
        <div class="modal-title">📄 Add Document</div>
        <div class="modal-sub">Upload a file or save a link to an important group document</div>
        <div class="field"><label>Document Name</label><input id="doc-name" type="text" placeholder="e.g. Group Constitution 2024"/></div>
        <div class="field"><label>Category</label>
          <select id="doc-category" class="filter-select" style="width:100%">
            <option value="constitution">📜 Constitution</option>
            <option value="minutes">📝 Meeting Minutes</option>
            <option value="financial">💰 Financial Report</option>
            <option value="legal">⚖️ Legal Document</option>
            <option value="general">📄 General</option>
          </select>
        </div>
        <div class="field">
          <label>Upload Method</label>
          <div style="display:flex;gap:10px;margin-top:6px;">
            <button class="btn btn-secondary btn-sm" id="methodFileBtn" onclick="switchDocMethod('file')" style="flex:1;border:2px solid var(--accent);">📁 Upload File</button>
            <button class="btn btn-secondary btn-sm" id="methodUrlBtn" onclick="switchDocMethod('url')" style="flex:1;">🔗 Paste URL</button>
          </div>
        </div>
        <div id="doc-file-section" class="field">
          <label>Select File (PDF, Word, Excel, etc.)</label>
          <input id="doc-file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg" style="width:100%;padding:8px;background:var(--input);border:1px solid var(--border);border-radius:8px;color:var(--text);"/>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Max 10MB</div>
        </div>
        <div id="doc-url-section" class="field" style="display:none;">
          <label>Document URL / Link</label>
          <input id="doc-url" type="url" placeholder="https://drive.google.com/... or any shareable link"/>
        </div>
        <div class="field"><label>File Type <span style="color:var(--text-muted);font-size:11px;">(optional label)</span></label><input id="doc-type" type="text" placeholder="e.g. PDF, Word, Excel"/></div>
        <div id="doc-upload-progress" style="display:none;margin-top:8px;">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">Uploading...</div>
          <div style="background:var(--border);border-radius:999px;height:6px;"><div id="doc-upload-bar" style="background:var(--accent);height:6px;border-radius:999px;width:0%;transition:width 0.3s;"></div></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="document.getElementById('docUploadOverlay').remove()">Cancel</button>
          <button class="btn btn-primary" id="saveDocBtn" onclick="saveDocument()">Save Document</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend',html);
}

function switchDocMethod(method){
  const isFile=method==='file';
  document.getElementById('doc-file-section').style.display=isFile?'block':'none';
  document.getElementById('doc-url-section').style.display=isFile?'none':'block';
  document.getElementById('methodFileBtn').style.border=isFile?'2px solid var(--accent)':'';
  document.getElementById('methodUrlBtn').style.border=isFile?'':'2px solid var(--accent)';
}

async function saveDocument(){
  const name=document.getElementById('doc-name').value.trim();
  const category=document.getElementById('doc-category').value;
  const file_type=document.getElementById('doc-type').value.trim();
  const fileInput=document.getElementById('doc-file');
  const urlInput=document.getElementById('doc-url');
  const isFileMethod=document.getElementById('doc-file-section').style.display!=='none';

  if(!name)return showToast('Document name is required','error');

  const btn=document.getElementById('saveDocBtn');
  btn.disabled=true;btn.innerHTML='<span class="spinner"></span>';

  try{
    let file_url='';

    if(isFileMethod){
      const file=fileInput?.files?.[0];
      if(!file)return showToast('Please select a file','error');
      if(file.size>10*1024*1024)return showToast('File too large. Max 10MB','error');

      // Show progress
      document.getElementById('doc-upload-progress').style.display='block';
      document.getElementById('doc-upload-bar').style.width='40%';

      const ext=file.name.split('.').pop();
      const filePath=`${currentProfile.group_id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;

      const{data:uploadData,error:uploadErr}=await sb.storage
        .from('group-documents')
        .upload(filePath,file,{cacheControl:'3600',upsert:false});

      if(uploadErr)throw uploadErr;

      document.getElementById('doc-upload-bar').style.width='80%';

      const{data:urlData}=sb.storage.from('group-documents').getPublicUrl(filePath);
      file_url=urlData.publicUrl;

      document.getElementById('doc-upload-bar').style.width='100%';

    }else{
      file_url=urlInput?.value.trim()||'';
      if(!file_url)return showToast('Please enter a document URL','error');
    }

    await sb.from('group_documents').insert([{
      group_id:currentProfile.group_id,
      name,
      category,
      file_url,
      file_type:file_type||(isFileMethod?fileInput.files[0]?.name.split('.').pop().toUpperCase():'Link'),
      uploaded_by:currentProfile.id
    }]);

    document.getElementById('docUploadOverlay')?.remove();
    const{data}=await sb.from('group_documents').select('*').eq('group_id',currentProfile.group_id).order('created_at',{ascending:false});
    allDocuments=data||[];
    renderDocumentVault();
    showToast('Document saved!','success');

  }catch(e){
    showToast('Failed: '+e.message,'error');
  }finally{
    btn.disabled=false;btn.innerHTML='Save Document';
    document.getElementById('doc-upload-progress')?.style && (document.getElementById('doc-upload-progress').style.display='none');
  }
}

async function deleteDocument(id){
  if(!confirm('Remove this document?'))return;
  await sb.from('group_documents').delete().eq('id',id);
  const{data}=await sb.from('group_documents').select('*').eq('group_id',currentProfile.group_id).order('created_at',{ascending:false});
  allDocuments=data||[];
  renderDocumentVault();
  showToast('Removed','info');
}

// ═══════════════════════════════════════════════════════════════
//  INIT — called from initApp() after loadAllData()
// ═══════════════════════════════════════════════════════════════
function initFeaturesModule(){
  initTheme();
  applyLanguage();
}