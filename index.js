// index-addon.js — v2.0
// UI polish + calculation preview panel while keeping existing timeline logic intact.

(function(){
  /* ========== CSS / design tokens ========== */
  (function ensureCSS(){
    if (document.querySelector('style[data-index-addon]')) return;
    const style = document.createElement('style');
    style.setAttribute('data-index-addon','');
    style.textContent = `
      :root{
        --vt-bg:#f4f6fb;
        --vt-surface:#ffffff;
        --vt-surface-muted:#f8fafc;
        --vt-text:#0f172a;
        --vt-text-muted:#475569;
        --vt-border:#dbe2ea;
        --vt-primary:#1d4ed8;
        --vt-primary-strong:#1e40af;
        --vt-danger:#dc2626;
        --vt-danger-strong:#b91c1c;
        --vt-success:#15803d;

        --vt-tone-light:#eaf4ee;
        --vt-tone-dark:#cfe7d6;

        --vt-radius-sm:8px;
        --vt-radius-md:12px;
        --vt-radius-lg:16px;
        --vt-shadow-sm:0 1px 2px rgba(15,23,42,.06);
        --vt-shadow-md:0 8px 24px rgba(15,23,42,.08);

        --vt-fs-xs:.75rem;
        --vt-fs-sm:.875rem;
        --vt-fs-md:1rem;
        --vt-fs-lg:1.125rem;
        --vt-fs-xl:1.5rem;

        --vt-space-1:4px;
        --vt-space-2:8px;
        --vt-space-3:12px;
        --vt-space-4:16px;
        --vt-space-5:24px;
        --vt-space-6:32px;
      }

      @media (prefers-color-scheme: dark){
        :root{
          --vt-bg:#0b1220;
          --vt-surface:#111b2e;
          --vt-surface-muted:#0f1729;
          --vt-text:#e2e8f0;
          --vt-text-muted:#94a3b8;
          --vt-border:#23344f;
          --vt-primary:#3b82f6;
          --vt-primary-strong:#2563eb;
          --vt-shadow-sm:none;
          --vt-shadow-md:none;
        }
      }

      body.vt-app{
        margin:0;
        background:var(--vt-bg);
        color:var(--vt-text);
        font-family:Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        line-height:1.5;
      }
      body.vt-app *{ box-sizing:border-box; }
      .vt-topbar{
        position:sticky; top:0; z-index:20;
        background:color-mix(in oklab, var(--vt-surface) 88%, transparent);
        backdrop-filter: blur(6px);
        border-bottom:1px solid var(--vt-border);
      }
      .vt-topbar-inner{
        max-width:1200px; margin:0 auto;
        padding:var(--vt-space-3) var(--vt-space-4);
        display:flex; justify-content:space-between; align-items:center; gap:var(--vt-space-3);
      }
      .vt-title{ margin:0; font-size:var(--vt-fs-xl); line-height:1.2; }
      .vt-subtitle{ margin:0; font-size:var(--vt-fs-sm); color:var(--vt-text-muted); }
      .vt-main{
        max-width:1200px;
        margin:0 auto;
        padding:var(--vt-space-5) var(--vt-space-4) var(--vt-space-6);
        display:grid;
        grid-template-columns:1fr;
        gap:var(--vt-space-4);
      }
      @media (min-width: 960px){
        .vt-main{ grid-template-columns: 1.2fr .8fr; align-items:start; }
      }
      .vt-col{ display:grid; gap:var(--vt-space-4); }
      .vt-card{
        background:var(--vt-surface);
        border:1px solid var(--vt-border);
        border-radius:var(--vt-radius-lg);
        box-shadow:var(--vt-shadow-sm);
        padding:var(--vt-space-4);
      }
      .vt-card h2{ margin:0 0 var(--vt-space-2); font-size:var(--vt-fs-lg); }
      .vt-card p{ margin:0; color:var(--vt-text-muted); font-size:var(--vt-fs-sm); }
      .vt-input,
      .vt-textarea,
      .vt-select{
        width:100%;
        border:1px solid var(--vt-border);
        background:var(--vt-surface-muted);
        color:var(--vt-text);
        border-radius:var(--vt-radius-md);
        padding:10px 12px;
        font:inherit;
      }
      .vt-textarea{ min-height:170px; resize:vertical; }
      .vt-field{ display:grid; gap:6px; margin-bottom:10px; }
      .vt-field label{ font-size:var(--vt-fs-sm); font-weight:600; }
      .vt-grid-2{ display:grid; gap:12px; grid-template-columns:1fr; }
      @media (min-width: 720px){ .vt-grid-2{ grid-template-columns:1fr 1fr; } }
      .vt-actions{ display:flex; flex-wrap:wrap; gap:10px; }
      .vt-json-preview{
        margin-top:12px;
        background:var(--vt-surface-muted);
        border:1px solid var(--vt-border);
        border-radius:var(--vt-radius-md);
        padding:12px;
        max-height:280px;
        overflow:auto;
        font-size:12px;
        font-family:ui-monospace, SFMono-Regular, Menlo, monospace;
        white-space:pre-wrap;
      }
      .vt-section-spacer{ margin-top:var(--vt-space-4); }

      .vt-btn{
        border-radius:var(--vt-radius-md);
        border:1px solid var(--vt-border);
        background:var(--vt-surface-muted);
        color:var(--vt-text);
        padding:10px 14px;
        font-size:var(--vt-fs-sm);
        font-weight:600;
        cursor:pointer;
        transition:all .15s ease;
      }
      .vt-btn:hover{ filter:brightness(.98); transform:translateY(-1px); }
      .vt-btn:focus-visible,
      .vt-input:focus-visible,
      .vt-select:focus-visible,
      .vt-chip-toggle input:focus-visible + span{
        outline:3px solid color-mix(in oklab, var(--vt-primary) 35%, transparent);
        outline-offset:2px;
      }
      .vt-btn--primary{ background:var(--vt-primary); border-color:var(--vt-primary); color:#fff; }
      .vt-btn--primary:hover{ background:var(--vt-primary-strong); border-color:var(--vt-primary-strong); }
      .vt-btn--ghost{ background:transparent; }
      .vt-btn--destructive{ background:var(--vt-danger); border-color:var(--vt-danger); color:#fff; }
      .vt-btn--destructive:hover{ background:var(--vt-danger-strong); border-color:var(--vt-danger-strong); }

      .vt-badge{ display:inline-flex; padding:3px 8px; border-radius:999px; font-size:var(--vt-fs-xs); font-weight:700; }
      .vt-badge--success{ background:color-mix(in oklab, var(--vt-success) 15%, transparent); color:var(--vt-success); }
      .vt-chip-toggle{ display:inline-flex; align-items:center; margin-right:var(--vt-space-2); margin-bottom:var(--vt-space-2); }
      .vt-chip-toggle input{ position:absolute; opacity:0; pointer-events:none; }
      .vt-chip-toggle span{
        border:1px solid var(--vt-border);
        border-radius:999px;
        padding:6px 10px;
        font-size:var(--vt-fs-xs);
        cursor:pointer;
        background:var(--vt-surface-muted);
      }
      .vt-chip-toggle input:checked + span{ background:var(--vt-primary); color:white; border-color:var(--vt-primary); }

      .vt-row{ display:flex; align-items:center; justify-content:space-between; gap:var(--vt-space-3); }
      .vt-kv{ display:grid; grid-template-columns:1.4fr 1fr; gap:var(--vt-space-2) var(--vt-space-3); margin-top:var(--vt-space-2); }
      .vt-kv div:nth-child(odd){ color:var(--vt-text-muted); font-size:var(--vt-fs-sm); }
      .vt-kv div:nth-child(even){ font-weight:600; text-align:right; }
      .vt-empty{ margin-top:var(--vt-space-2); color:var(--vt-text-muted); font-style:italic; }

      .vt-tabs{ display:inline-flex; padding:4px; border-radius:999px; background:var(--vt-surface-muted); border:1px solid var(--vt-border); }
      .vt-tab{ border:0; background:transparent; padding:7px 10px; border-radius:999px; font-size:var(--vt-fs-xs); font-weight:700; cursor:pointer; color:var(--vt-text-muted); }
      .vt-tab.is-active{ background:var(--vt-surface); color:var(--vt-text); box-shadow:var(--vt-shadow-sm); }

      .vt-modal-backdrop{
        position:fixed; inset:0; z-index:40;
        background:rgba(2,6,23,.45);
        display:none;
        align-items:center;
        justify-content:center;
        padding:var(--vt-space-4);
      }
      .vt-modal-backdrop.open{ display:flex; }
      .vt-modal{
        width:min(880px, 100%);
        max-height:90vh;
        overflow:auto;
        background:var(--vt-surface);
        border:1px solid var(--vt-border);
        border-radius:var(--vt-radius-lg);
        box-shadow:var(--vt-shadow-md);
        padding:var(--vt-space-4);
      }
      .vt-modal-grid{ display:grid; grid-template-columns:1fr; gap:var(--vt-space-4); }
      @media (min-width:860px){ .vt-modal-grid{ grid-template-columns:.9fr 1.1fr; } }

      #timeline .para-slot{
        background-color:var(--vt-tone-light) !important;
        background-image:none !important;
        font-size:12px;
        line-height:1.2;
        font-variant-numeric:tabular-nums;
      }
      #timeline .para-slot.alt{ background-color:var(--vt-tone-dark) !important; background-image:none !important; }
      #timeline .para-slot *{ font-size:inherit !important; line-height:inherit; }
      #timeline .para-slot.active,
      #timeline .para-slot.current,
      #timeline .para-slot.selected,
      #timeline .para-slot.is-active{ background-color:inherit !important; background-image:none !important; }
      #timeline .para-slot::before,
      #timeline .para-slot::after{ background:none !important; }
      #timeline .para-slot i.frame-pin{
        position:absolute; left:50%; transform:translateX(-50%);
        top:-14px; bottom:auto; width:12px; height:12px;
        background:url('./img/box-icon.png') center/contain no-repeat; pointer-events:none;
      }
      #timeline .para-slot i.read-pin{
        position:absolute; left:50%; transform:translateX(-50%);
        bottom:-14px; top:auto; width:16px; height:16px;
        background:url('./img/read-icon.png') center/contain no-repeat; pointer-events:none;
      }
      .vt-stats{ display:flex; gap:12px; align-items:center; font-size:.95em; opacity:.95; flex-wrap:wrap; margin-top:var(--vt-space-2); }
      .vt-stats b{ font-weight:600 }
      .vt-stats .ic{ width:14px; height:14px; vertical-align:middle; margin-right:6px; }
    `;
    document.head.appendChild(style);
  })();

  /* ========== utils ========== */
  const $ = (sel, root=document)=> root.querySelector(sel);
  const $$ = (sel, root=document)=> Array.from(root.querySelectorAll(sel));
  const nf = new Intl.NumberFormat('nb-NO', {maximumFractionDigits: 2});

  function formatMinutes(value){
    if (!Number.isFinite(value)) return '0 min';
    const rounded = Math.max(0, value);
    if (rounded >= 60) {
      const h = Math.floor(rounded / 60);
      const m = Math.round(rounded % 60);
      return `${h} t ${m} min`;
    }
    return `${Math.round(rounded)} min`;
  }

  function parseGroupsString(str){
    if (!str || typeof str !== 'string') return [];
    return str.split(',').map(s=>s.trim()).flatMap(tok=>{
      const m = tok.match(/^(\d+)(?:-(\d+))?$/); if(!m) return [];
      const a=+m[1], b=m[2]?+m[2]:a; const arr=[]; for(let i=a;i<=b;i++) arr.push(i);
      return [arr];
    });
  }
  function getGroups(){
    if (Array.isArray(window.__VT_GROUPS)) return window.__VT_GROUPS;
    const it = window.currentItem || window.ITEM || null;
    if (it && typeof it.groups === 'string') return parseGroupsString(it.groups);
    return [];
  }
  function rangeLabel(nums){
    const s=[...new Set(nums)].sort((a,b)=>a-b);
    if (s.length===1) return `Avsnitt ${s[0]}`;
    if (s.length===2 && s[1]===s[0]+1) return `Avsnittene ${s[0]} og ${s[1]}`;
    return `Avsnittene ${s[0]}–${s[s.length-1]}`;
  }

  /* ========== two-tone with groups as one block ========== */
  function applyTwoToneWithGroups(){
    const tl = $('#timeline'); if(!tl) return;
    const slots = $$('.para-slot', tl); if(!slots.length) return;

    slots.forEach(el=>{
      el.className = el.className
        .replace(/\b(alt-alt|group-alt|grp|group|galt|tone-a|tone-b|tone-c|tone-d)\b/g,'')
        .trim();
      el.classList.remove('alt');
      el.style.background=''; el.style.backgroundImage=''; el.style.backgroundColor='';
    });

    const groups = getGroups();
    const starts = new Map(); groups.forEach(g=>{ if (g && g.length) starts.set(g[0], g); });

    let dark = false;
    let i = 1;
    while (i <= slots.length){
      if (starts.has(i)){
        const g = starts.get(i);
        g.forEach(p => { const el = slots[p-1]; if (el && dark) el.classList.add('alt'); });
        dark = !dark;
        i = g[g.length-1] + 1;
      } else {
        const el = slots[i-1]; if (el && dark) el.classList.add('alt');
        dark = !dark;
        i++;
      }
    }
  }

  /* ========== base data access (existing + small helpers) ========== */
  const getReadSet  = ()=> window.__VT_READ_SET2 instanceof Set ? window.__VT_READ_SET2 : (window.readSet || new Set());
  const getFrameSet = ()=> window.__VT_FRAME_SET instanceof Set ? window.__VT_FRAME_SET : new Set();
  const getOrd      = ()=> window.__VT_ORD instanceof Map ? window.__VT_ORD : new Map();

  function expandRefsWithOrder(refs){
    const set = new Set();
    if (!Array.isArray(refs)) return {set};
    refs.forEach(v=>{
      if (typeof v === 'number' && Number.isFinite(v)){ set.add(v); return; }
      if (typeof v !== 'string') return;
      const s = v.trim();
      let m = s.match(/^(\d+)[\-–](\d+)([abc])?$/i);
      if (m){ const a=+m[1], b=+m[2]; for(let i=Math.min(a,b); i<=Math.max(a,b); i++) set.add(i); return; }
      m = s.match(/^(\d+)&(\d+)([abc])?$/i);
      if (m){ set.add(+m[1]); set.add(+m[2]); return; }
      m = s.match(/^(\d+)([abc])?$/i);
      if (m){ set.add(+m[1]); }
    });
    return {set};
  }

  function getCurrentItem(){
    return window.currentItem || window.ITEM || null;
  }

  function getImageSet(){
    if (window.__VT_IMAGE_SET instanceof Set) return window.__VT_IMAGE_SET;
    const it = getCurrentItem();
    if (it && Array.isArray(it.images)) return expandRefsWithOrder(it.images).set;
    return new Set();
  }

  function getWordCount(){
    const it = getCurrentItem();
    if (!it) return 0;
    if (Array.isArray(it.words)) return it.words.reduce((sum, n)=> sum + (Number(n) || 0), 0);
    if (Array.isArray(it.para_lengths)) return it.para_lengths.reduce((sum, n)=> sum + (Number(n) || 0), 0);
    return 0;
  }

  function getParaCount(){
    const it = getCurrentItem();
    if (it && Array.isArray(it.words)) return it.words.length;
    if (it && Array.isArray(it.para_lengths)) return it.para_lengths.length;
    const tl = $('#timeline'); if (tl) return $$('.para-slot', tl).length;
    return 0;
  }

  /* ========== messages ========== */
  function buildSingleMsg(p){
    const ord=getOrd(), frames=getFrameSet(), reads=getReadSet();
    const o=ord.get(p)||{}, hasF=frames.has(p), hasR=reads.has(p);
    if (!hasF && !hasR) return rangeLabel([p]);
    if (hasF && hasR){
      const f=o.frame ?? 1, r=o.read ?? 2;
      return ((f ?? 99) <= (r ?? 99))
        ? `${rangeLabel([p])} + Ramme og Les-skriftsted`
        : `${rangeLabel([p])} + Les-skriftsted og Ramme`;
    }
    return hasF ? `${rangeLabel([p])} + Ramme` : `${rangeLabel([p])} + Les-skriftsted`;
  }
  function buildGroupMsg(g){
    const frames=getFrameSet(), reads=getReadSet();
    const hasFrameAny = g.some(p => frames.has(p));
    const hasReadAny  = g.some(p => reads.has(p));
    let label = rangeLabel(g);
    if (hasFrameAny && hasReadAny) label += ' + Ramme og Les-skriftsted';
    else if (hasFrameAny)          label += ' + Ramme';
    else if (hasReadAny)           label += ' + Les-skriftsted';
    return label;
  }
  function buildMsgFor(p){
    const groups=getGroups();
    for (const g of groups){ if (g.includes(p)) return buildGroupMsg(g); }
    return buildSingleMsg(p);
  }

  /* ========== pins ========== */
  function layoutPins(){
    const tl = $('#timeline'); if(!tl) return;
    const slots = $$('.para-slot', tl); if(!slots.length) return;
    const ord=getOrd(), frames=getFrameSet(), reads=getReadSet();

    slots.forEach((slot, idx)=>{
      const p=idx+1, hasF=frames.has(p), hasR=reads.has(p);
      $$('.read-pin,.frame-pin', slot).forEach(n=>n.remove());
      if (!hasF && !hasR) return;

      const items=[];
      if (hasF) items.push({type:'frame', order:(ord.get(p)||{}).frame ?? 1});
      if (hasR) items.push({type:'read',  order:(ord.get(p)||{}).read  ?? 2});
      items.sort((a,b)=>(a.order??99)-(b.order??99));

      const gap=14, base=-((items.length-1)/2)*gap;
      items.forEach((it,i)=>{
        const el=document.createElement('i');
        el.className = it.type==='frame' ? 'frame-pin' : 'read-pin';
        el.style.left = `calc(50% + ${base + i*gap}px)`;
        slot.appendChild(el);
      });
    });
  }

  /* ========== info panel counts ========== */
  function findInfoPanel(){
    const candidates = [
      '#article-info','#articleInfo','#article-panel','#articlePanel',
      '.article-info','.article-meta','.article-details','#info'
    ];
    for (const sel of candidates){ const el = $(sel); if (el) return el; }
    return null;
  }

  function ensureStats(panel){
    if ($('#vt-stats', panel)) return;
    const div = document.createElement('div');
    div.className = 'vt-stats';
    div.id = 'vt-stats';
    div.innerHTML = `
      <span><b>Avsnitt:</b> <span id="vt-paras">0</span></span>
      <span>📖 <b>Les-skriftsteder:</b> <span id="vt-reads">0</span></span>
      <span><img class="ic" src="./img/box-icon.png" alt=""> <b>Rammer:</b> <span id="vt-frames">0</span></span>
      <span><img class="ic" src="./img/image-icon.png" alt=""> <b>Bilder:</b> <span id="vt-images">0</span></span>
    `;
    panel.appendChild(div);
  }

  function updateStats(){
    const panel = findInfoPanel(); if (!panel) return;
    const paraCount = getParaCount();
    const readCount = getReadSet().size;
    const frameCount= getFrameSet().size;
    const imageCount= getImageSet().size;

    const setText = (sel, text)=>{
      const el = $(sel, panel);
      if (el) el.textContent = text;
      return !!el;
    };

    const updated =
      setText('#paraCount', String(paraCount)) |
      setText('#readCount', String(readCount)) |
      setText('#frameCount', String(frameCount)) |
      setText('#imageCount', String(imageCount));

    if (!updated) ensureStats(panel);
    const stats = {
      '#vt-paras': String(paraCount),
      '#vt-reads': String(readCount),
      '#vt-frames': String(frameCount),
      '#vt-images': String(imageCount)
    };
    Object.entries(stats).forEach(([sel, value])=>{ const el = $(sel, panel); if (el) el.textContent = value; });
  }

  const modelDefaults = {
    week_start: '',
    title: '',
    groups: '',
    frames: '',
    reads: '',
    para_lengths: [],
    images: ''
  };

  const monthMap = {
    JANUAR: 0, FEBRUAR: 1, MARS: 2, APRIL: 3, MAI: 4, JUNI: 5,
    JULI: 6, AUGUST: 7, SEPTEMBER: 8, OKTOBER: 9, NOVEMBER: 10, DESEMBER: 11
  };

  let detectedArticleData = {...modelDefaults};
  let editableArticleData = {...modelDefaults};
  let parseDebugInfo = null;
  let jsonPreviewMode = 'pretty';

  function parseNumberList(value){
    const result = [];
    String(value || '').split(',').map((v)=> v.trim()).filter(Boolean).forEach((token)=>{
      const m = token.match(/^(\d+)(?:\s*[\-–]\s*(\d+))?$/);
      if (!m) return;
      const a = Number(m[1]);
      const b = m[2] ? Number(m[2]) : a;
      const min = Math.min(a, b);
      const max = Math.max(a, b);
      for (let i=min; i<=max; i+=1) result.push(i);
    });
    return [...new Set(result)].sort((a,b)=> a-b);
  }

  function normalizeArticleData(data = {}){
    return {
      week_start: String(data.week_start || ''),
      title: String(data.title || ''),
      groups: String(data.groups || ''),
      frames: Array.isArray(data.frames) ? data.frames.join(', ') : String(data.frames || ''),
      reads: Array.isArray(data.reads) ? data.reads.join(', ') : String(data.reads || ''),
      para_lengths: Array.isArray(data.para_lengths)
        ? data.para_lengths.map((n)=> Number(n) || 0).filter((n)=> n > 0)
        : (typeof data.para_lengths === 'string'
            ? data.para_lengths.split(/[\n,]+/).map((v)=> Number(v.trim()) || 0).filter((n)=> n > 0)
            : []),
      images: Array.isArray(data.images) ? data.images.join(', ') : String(data.images || '')
    };
  }

  function getEditablePayload(){
    return {
      week_start: editableArticleData.week_start,
      title: editableArticleData.title,
      groups: editableArticleData.groups,
      frames: parseNumberList(editableArticleData.frames),
      reads: parseNumberList(editableArticleData.reads),
      para_lengths: editableArticleData.para_lengths,
      images: parseNumberList(editableArticleData.images)
    };
  }

  function detectWeekHeader(lines){
    return lines.find((line)=> /\d{1,2}\.\s*[–-]\s*\d{1,2}\.\s*[A-ZÆØÅ]+\s+\d{4}/.test(line)) || '';
  }

  function parseWeekStart(weekHeader){
    const m = String(weekHeader || '').toUpperCase().match(/(\d{1,2})\.\s*[–-]\s*(\d{1,2})\.\s*([A-ZÆØÅ]+)\s+(\d{4})/);
    if (!m) return '';
    const day = Number(m[1]);
    const monthName = m[3];
    const year = Number(m[4]);
    const monthIndex = monthMap[monthName];
    if (!Number.isInteger(monthIndex)) return '';
    const d = new Date(Date.UTC(year, monthIndex, day));
    return d.toISOString().slice(0, 10);
  }

  function splitArticleIntoLogicalBlocks(rawText){
    const rawLines = String(rawText || '').split(/\r?\n/);
    return rawLines
      .map((line, idx)=> ({line: idx + 1, text: String(line || '').trim()}))
      .filter((entry)=> entry.text);
  }

  function detectTitle(lines){
    const skip = /^(\d{1,2}\.\s*[–-]\s*\d{1,2}\.\s*[A-ZÆØÅ]+\s+\d{4}|SANG\b.*|FOKUS\b.*|«.*»\s*[–-]|Svaret ditt)$/i;
    for (const entry of lines){
      const line = entry.text || '';
      if (skip.test(line)) continue;
      if (/^\d+(?:\s*,\s*\d+)*(?:[.,]|\s)/.test(line)) continue;
      if (/^[A-ZÆØÅ0-9 ?!.,:–-]{8,}$/.test(line)) continue;
      return line;
    }
    return '';
  }

  function stripFrontMatter(lines){
    return [...lines];
  }

  function classifyLines(lines, title){
    const classified = [];
    let focusTextNext = false;
    lines.forEach((entry)=>{
      const text = entry.text;
      let type = 'ignore';
      if (/^\d{1,2}\.\s*[–-]\s*\d{1,2}\.\s*[A-ZÆØÅ]+\s+\d{4}$/i.test(text)) type = 'week_header';
      else if (/^SANG\b/i.test(text)) type = 'song_line';
      else if (/^«.+»\s*[–-]\s*[A-Z0-9\s:.,–-]+$/i.test(text)) type = 'theme_scripture';
      else if (text === title) type = 'title';
      else if (/^FOKUS$/i.test(text)) { type = 'focus_header'; focusTextNext = true; }
      else if (focusTextNext) { type = 'focus_text'; focusTextNext = false; }
      else if (/^Svaret ditt$/i.test(text)) type = 'answer_marker';
      else if (/^(Bildeserie:|Bilde:|Bildetekst:)/i.test(text) || /\(Se avsnittene?\s+\d+\s+og\s+\d+\)/i.test(text)) type = 'image_caption';
      else if (/^[A-ZÆØÅ0-9 ?!.,:–-]{8,}$/.test(text)) type = 'section_header';
      else if (/^\d+(?:\s*,\s*\d+)\./.test(text)) type = 'question_header';
      else if (/^\d+\.\s+.*\?/.test(text)) type = 'question_header';
      else if (/^\d+\.\s*\(?(?:[A-ZÆØÅ].*)?\bLes\b.+\d+[:.\d–-]/i.test(text) && !/^\d+\s+/.test(text)) type = 'question_header';
      else if (/^\d+\s+/.test(text)) type = 'body_paragraph';
      else if (/^\d+\.\s+/.test(text)) type = 'question_header';
      classified.push({...entry, type});
    });
    return classified;
  }

  function detectQuestionHeaders(classified){
    return classified
      .filter((entry)=> entry.type === 'question_header')
      .map((entry)=>{
        const m = entry.text.match(/^(\d+(?:\s*,\s*\d+)*)\./);
        const numbers = m ? m[1].split(',').map((v)=> Number(v.trim())).filter(Boolean) : [];
        return {...entry, numbers};
      });
  }

  function buildGroupsFromCombinedHeaders(combinedHeaders){
    const tokens = [];
    combinedHeaders.forEach((group)=>{
      if (!group.length) return;
      const sorted = [...group].sort((a,b)=> a-b);
      const consecutive = sorted.every((n, idx)=> idx === 0 || n === sorted[idx-1] + 1);
      tokens.push(consecutive && sorted.length > 1 ? `${sorted[0]}-${sorted[sorted.length-1]}` : sorted.join('-'));
    });
    return [...new Set(tokens)].join(',');
  }

  function detectReadReferences(paragraphItems, questionHeaders){
    const reads = [];
    const reasons = [];
    questionHeaders.forEach((q)=>{
      if (!/\bles\b/i.test(q.text) || !/\d+[:.]\d+/.test(q.text)) return;
      const target = q.numbers.length > 1 ? Math.max(...q.numbers) : q.numbers[0];
      if (!target) return;
      reads.push(target);
      reasons.push({paragraph: target, source: 'question_header', evidence: q.text});
    });
    paragraphItems.forEach((p)=>{
      if (!/\bles\b/i.test(p.text) || !/\d+[:.]\d+/.test(p.text)) return;
      reads.push(p.number);
      reasons.push({paragraph: p.number, source: 'body_paragraph', evidence: p.text.match(/([^.!?]*\bles\b[^.!?]*\d+[:.]\d+[^.!?]*)/i)?.[1]?.trim() || p.text.slice(0, 160)});
    });
    return {reads: [...new Set(reads)].sort((a,b)=> a-b), reasons};
  }

  function detectImageReferences(rawText){
    const images = new Set();
    const text = String(rawText || '');
    const patterns = [
      /Se avsnittene\s+(\d+)\s+og\s+(\d+)/gi,
      /avsnitt(?:ene)?\s+(\d+)\s*[–-]\s*(\d+)/gi
    ];
    patterns.forEach((re)=>{
      let m;
      while ((m = re.exec(text)) !== null){
        const a = Number(m[1]);
        const b = Number(m[2]);
        if (!a || !b) continue;
        for (let i=Math.min(a,b); i<=Math.max(a,b); i+=1) images.add(i);
      }
    });
    return [...images].sort((a,b)=> a-b);
  }

  function splitCombinedParagraphText(text, count){
    if (count <= 1) return [text];
    const normalized = text.trim();
    const qIndex = normalized.indexOf('?');
    if (qIndex > -1){
      const qPart = normalized.slice(0, qIndex + 1).trim();
      const ansPart = normalized.slice(qIndex + 1).trim();
      if (ansPart) return [qPart, ansPart, ...Array(Math.max(0, count - 2)).fill(ansPart)].slice(0, count);
    }
    const words = normalized.split(/\s+/).filter(Boolean);
    const size = Math.max(1, Math.floor(words.length / count));
    const parts = [];
    for (let i=0; i<count; i+=1){
      const start = i * size;
      const end = i === count - 1 ? words.length : (i + 1) * size;
      parts.push(words.slice(start, end).join(' '));
    }
    return parts;
  }

  function groupQuestionHeaderWithAnswerBlocks(classified, questionHeaders){
    const questionMap = new Map(questionHeaders.map((q)=> [q.line, q]));
    const mappings = [];
    let active = null;
    let expectedIdx = 0;
    classified.forEach((entry)=>{
      if (entry.type === 'question_header'){
        active = questionMap.get(entry.line) || null;
        expectedIdx = 0;
        return;
      }
      if (!active) return;
      if (entry.type === 'body_paragraph'){
        const explicit = entry.text.match(/^(\d+)\s+/);
        const inferredNumber = active.numbers[expectedIdx];
        mappings.push({
          line: entry.line,
          bodyText: entry.text,
          headerLine: active.line,
          headerText: active.text,
          explicitNumber: explicit ? Number(explicit[1]) : null,
          inferredNumber: inferredNumber || null
        });
        expectedIdx += 1;
      }
    });
    return mappings;
  }

  function buildLogicalParagraphs(classified, answerMappings){
    const mappingByLine = new Map(answerMappings.map((m)=> [m.line, m]));
    const paragraphItems = classified
      .filter((entry)=> entry.type === 'body_paragraph')
      .map((entry)=>{
        const m = entry.text.match(/^(\d+)\s+(.+)$/);
        const map = mappingByLine.get(entry.line);
        const number = m ? Number(m[1]) : (map?.inferredNumber || 0);
        const clean = (m ? m[2] : entry.text).replace(/\bSvaret ditt\b/gi, '').trim();
        const words = clean.split(/\s+/).filter(Boolean);
        return {
          number,
          text: clean,
          length: words.length,
          sourceLine: entry.line,
          mappedFromQuestion: map ? {headerLine: map.headerLine, headerText: map.headerText} : null
        };
      })
      .filter((p)=> p.number > 0)
      .sort((a,b)=> a.number - b.number);

    const ordered = [];
    const seen = new Set();
    paragraphItems.forEach((p)=>{
      if (seen.has(p.number)) return;
      seen.add(p.number);
      ordered.push(p);
    });
    return {paragraphItems: ordered, para_lengths: ordered.map((p)=> p.length)};
  }

  function buildArticleItem(parts){
    return normalizeArticleData({
      week_start: parts.week_start,
      title: parts.title,
      groups: parts.groups,
      frames: parts.frames,
      reads: parts.reads,
      para_lengths: parts.para_lengths,
      images: parts.images
    });
  }

  function parseArticleText(rawText){
    const lines = splitArticleIntoLogicalBlocks(rawText);
    const weekHeader = detectWeekHeader(lines.map((entry)=> entry.text));
    const week_start = parseWeekStart(weekHeader);
    const title = detectTitle(lines);
    const strippedLines = stripFrontMatter(lines);
    const classified = classifyLines(strippedLines, title);
    const questionHeaders = detectQuestionHeaders(classified);
    const answerMappings = groupQuestionHeaderWithAnswerBlocks(classified, questionHeaders);
    const combinedHeaders = questionHeaders.map((q)=> q.numbers).filter((nums)=> nums.length > 1);
    const groups = buildGroupsFromCombinedHeaders(combinedHeaders);
    const {paragraphItems, para_lengths} = buildLogicalParagraphs(classified, answerMappings);
    const readResult = detectReadReferences(paragraphItems, questionHeaders);
    const images = detectImageReferences(classified.filter((entry)=> entry.type === 'image_caption').map((entry)=> entry.text).join('\n'));
    const frames = [];
    const ignored = classified.filter((entry)=> !['question_header', 'body_paragraph'].includes(entry.type));

    parseDebugInfo = {
      weekHeader,
      titleLine: title,
      questionHeaders: questionHeaders.map((q)=> ({line: q.line, text: q.text, numbers: q.numbers})),
      bodyParagraphs: paragraphItems.map((p)=> ({line: p.sourceLine, paragraph: p.number, preview: p.text.slice(0, 140)})),
      ignored: ignored.map((entry)=> ({line: entry.line, text: entry.text, reason: entry.type})),
      paragraphMappings: answerMappings,
      paragraphBlocks: paragraphItems.map((p)=> ({paragraph: p.number, sourceLine: p.sourceLine, preview: p.text.slice(0, 120)})),
      readReasons: readResult.reasons,
      groupReasons: combinedHeaders.map((nums)=> ({numbers: nums, group: buildGroupsFromCombinedHeaders([nums])})),
      groups
    };

    return buildArticleItem({
      week_start,
      title,
      groups,
      frames,
      reads: readResult.reads,
      para_lengths,
      images
    });
  }

  function renderParseDebug(){
    const host = $('#vt-parse-debug');
    if (!host) return;
    host.textContent = parseDebugInfo ? JSON.stringify(parseDebugInfo, null, 2) : 'Ingen parser-debug enda.';
  }

  function syncJsonPreview(){
    const payload = getEditablePayload();
    const jsonHost = $('#vt-json-preview');
    if (!jsonHost) return;
    jsonHost.textContent = jsonPreviewMode === 'compact'
      ? JSON.stringify(payload)
      : JSON.stringify(payload, null, 2);
  }

  function syncJsonModeTabs(){
    $$('#vt-json-mode-tabs .vt-tab').forEach((tab)=>{
      tab.classList.toggle('is-active', tab.getAttribute('data-json-mode') === jsonPreviewMode);
    });
  }

  function setDetectedAndEditableData(data){
    detectedArticleData = normalizeArticleData(data);
    editableArticleData = normalizeArticleData(data);
    window.__VT_DETECTED_ARTICLE_DATA = {...detectedArticleData};
    window.__VT_EDITABLE_ARTICLE_DATA = {...editableArticleData};
    syncEditableForm();
    syncDataBindings();
  }

  function syncEditableForm(){
    const setVal = (id, value)=>{ const el = $(id); if (el) el.value = value; };
    setVal('#vt-edit-week-start', editableArticleData.week_start);
    setVal('#vt-edit-title', editableArticleData.title);
    setVal('#vt-edit-groups', editableArticleData.groups);
    setVal('#vt-edit-frames', editableArticleData.frames);
    setVal('#vt-edit-reads', editableArticleData.reads);
    setVal('#vt-edit-para-lengths', editableArticleData.para_lengths.join('\n'));
    setVal('#vt-edit-images', editableArticleData.images);
  }

  function syncDataBindings(){
    const payload = getEditablePayload();
    syncJsonPreview();
    syncJsonModeTabs();
    renderParseDebug();
    window.__VT_EXPORT_DATA = payload;
    window.__VT_EDITABLE_ARTICLE_DATA = {...editableArticleData};
    renderLockedResult();
    renderPreviewSections();
  }

  function handleEditableFieldChange(field, rawValue){
    if (field === 'para_lengths') {
      editableArticleData.para_lengths = String(rawValue || '')
        .split(/[\n,]+/)
        .map((v)=> Number(v.trim()) || 0)
        .filter((n)=> n > 0);
    } else {
      editableArticleData[field] = String(rawValue || '');
    }
    syncDataBindings();
  }

  function copyEditableJson(){
    const payload = getEditablePayload();
    const json = jsonPreviewMode === 'compact' ? JSON.stringify(payload) : JSON.stringify(payload, null, 2);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(json).catch(()=>{});
    }
  }

  function downloadEditableJson(){
    const payload = getEditablePayload();
    const json = jsonPreviewMode === 'compact' ? JSON.stringify(payload) : JSON.stringify(payload, null, 2);
    const blob = new Blob([json], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'study-analyzer-resultat.json';
    a.click();
    setTimeout(()=> URL.revokeObjectURL(a.href), 400);
  }

  function runParserExampleTest(){
    const sample = `9.–15. MARS 2026
SANG 32
Hva kan vi gjøre for å overvinne negative følelser?
FOKUS
Hvordan vi kan takle negative følelser.
1, 2. Hvorfor hadde Paulus negative følelser? (Les Romerne 7:21–24.) Svaret ditt
3. Hvordan ble Paulus hjulpet?
4. Vanlig avsnitt.
5. Vanlig avsnitt.
6. Vanlig avsnitt.
7. (Les Romerne 7:18, 19.)
8. Vanlig avsnitt.
Bildeserie: Se avsnittene 9 og 10.
9. Vanlig avsnitt.
10. Les Romerne 8:1.
11. Vanlig avsnitt.
12. Vanlig avsnitt.
13, 14. Kombinert avsnitt.
15. Vanlig avsnitt.
16. Vanlig avsnitt.
17. Vanlig avsnitt.
18. Vanlig avsnitt.
19. Vanlig avsnitt.
20. Vanlig avsnitt.`;
    const parsed = parseArticleText(sample);
    const payload = {
      week_start: parsed.week_start,
      title: parsed.title,
      reads: parseNumberList(parsed.reads),
      frames: parseNumberList(parsed.frames),
      paraCount: parsed.para_lengths.length
    };
    return payload;
  }
  function hydrateDetectedFromCurrentItem(){
    const current = getCurrentItem();
    if (!current) return;
    const data = {
      week_start: current.week_start || '',
      title: current.title || current.name || '',
      groups: current.groups || '',
      frames: Array.isArray(current.frames) ? current.frames : '',
      reads: Array.isArray(current.reads) ? current.reads : '',
      para_lengths: Array.isArray(current.para_lengths) ? current.para_lengths : (Array.isArray(current.words) ? current.words : []),
      images: Array.isArray(current.images) ? current.images : ''
    };
    setDetectedAndEditableData(data);
  }

  /* ========== professional layout shell ========== */
  function ensureProfessionalLayout(){
    document.body.classList.add('vt-app');

    if (!$('#vt-topbar')) {
      const topbar = document.createElement('header');
      topbar.className = 'vt-topbar';
      topbar.id = 'vt-topbar';
      topbar.innerHTML = `
        <div class="vt-topbar-inner">
          <div>
            <h1 class="vt-title">Study Analyzer</h1>
            <p class="vt-subtitle">Ryddig oversikt over avsnitt, markeringer og beregningsgrunnlag</p>
          </div>
          <div class="vt-row">
            <span id="vt-lock-badge" class="vt-badge vt-badge--success">Ingen låste innstillinger</span>
            <button id="vt-open-preview" class="vt-btn vt-btn--primary">Forhåndsvis beregning</button>
          </div>
        </div>
      `;
      document.body.prepend(topbar);
    }

    if ($('#vt-main')) return;

    const main = document.createElement('main');
    main.id = 'vt-main';
    main.className = 'vt-main';
    main.innerHTML = `
      <section class="vt-col" id="vt-col-main">
        <article class="vt-card" id="vt-card-analyze">
          <h2>Lim inn artikkeltekst her</h2>
          <p>Lim inn hele artikkelen eller rådata som skal analyseres.</p>
          <div class="vt-section-spacer vt-field">
            <textarea id="vt-article-text" class="vt-textarea" placeholder="Lim inn tekst som skal analyseres..."></textarea>
          </div>
          <div class="vt-actions">
            <button id="vt-analyze-btn" class="vt-btn vt-btn--primary">Analyser tekst</button>
          </div>
        </article>
        <article class="vt-card" id="vt-card-adjust">
          <h2>Juster analyseresultat</h2>
          <p>Overstyr feltene under. JSON-preview, beregning og eksport oppdateres live.</p>
          <div class="vt-section-spacer vt-grid-2">
            <div class="vt-field"><label for="vt-edit-week-start">week_start</label><input id="vt-edit-week-start" class="vt-input" type="date"></div>
            <div class="vt-field"><label for="vt-edit-title">title</label><input id="vt-edit-title" class="vt-input" type="text"></div>
            <div class="vt-field"><label for="vt-edit-groups">groups</label><input id="vt-edit-groups" class="vt-input" type="text"></div>
            <div class="vt-field"><label for="vt-edit-frames">frames</label><input id="vt-edit-frames" class="vt-input" type="text"></div>
            <div class="vt-field"><label for="vt-edit-reads">reads</label><input id="vt-edit-reads" class="vt-input" type="text"></div>
            <div class="vt-field"><label for="vt-edit-images">images</label><input id="vt-edit-images" class="vt-input" type="text"></div>
          </div>
          <div class="vt-field">
            <label for="vt-edit-para-lengths">para_lengths (ett tall per linje)</label>
            <textarea id="vt-edit-para-lengths" class="vt-textarea" style="min-height:110px"></textarea>
          </div>
          <div class="vt-actions">
            <button id="vt-copy-json" class="vt-btn">Kopier JSON</button>
            <button id="vt-export-json" class="vt-btn">Eksporter JSON</button>
            <div class="vt-tabs" id="vt-json-mode-tabs" aria-label="JSON-format">
              <button class="vt-tab is-active" data-json-mode="pretty">Pretty</button>
              <button class="vt-tab" data-json-mode="compact">Compact</button>
            </div>
          </div>
          <pre id="vt-json-preview" class="vt-json-preview" aria-live="polite"></pre>
          <h3 style="margin:12px 0 6px">Advanced parse preview</h3>
          <pre id="vt-parse-debug" class="vt-json-preview" aria-live="polite"></pre>
        </article>
        <article class="vt-card" id="vt-card-timeline">
          <h2>Tidslinje</h2>
          <p>Visuell gjennomgang av avsnitt og markeringer.</p>
          <div class="vt-section-spacer" id="vt-timeline-slot"></div>
        </article>
        <article class="vt-card" id="vt-card-message">
          <h2>Valgt avsnitt</h2>
          <p id="vt-message-help">Klikk et avsnitt i tidslinjen for å vise detaljer.</p>
          <div class="vt-section-spacer" id="vt-message-slot"></div>
        </article>
      </section>
      <aside class="vt-col" id="vt-col-side">
        <article class="vt-card" id="vt-card-summary">
          <h2>Resultat</h2>
          <p>Låste innstillinger brukes i hovedresultatet under.</p>
          <div class="vt-section-spacer" id="vt-locked-result" aria-live="polite"></div>
        </article>
        <article class="vt-card" id="vt-card-info">
          <h2>Datagrunnlag</h2>
          <p>Oppsummering av tilgjengelige inputverdier.</p>
          <div class="vt-section-spacer" id="vt-info-slot"></div>
        </article>
      </aside>
    `;
    const rootChildren = Array.from(document.body.children).filter((el)=> el.id !== 'vt-topbar' && el.id !== 'vt-preview-modal');
    document.body.appendChild(main);

    const timeline = $('#timeline');
    if (timeline) $('#vt-timeline-slot').appendChild(timeline);
    else $('#vt-timeline-slot').innerHTML = '<p class="vt-empty">Ingen tidslinje funnet ennå.</p>';

    const msg = $('#message');
    if (msg) $('#vt-message-slot').appendChild(msg);
    else $('#vt-message-slot').innerHTML = '<p class="vt-empty">Ingen melding tilgjengelig før data er lastet.</p>';

    const infoPanel = findInfoPanel();
    if (infoPanel) $('#vt-info-slot').appendChild(infoPanel);
    else $('#vt-info-slot').innerHTML = '<p class="vt-empty">Ingen informasjonsfelt funnet i denne visningen.</p>';

    rootChildren.forEach((el)=>{
      if (!main.contains(el)) {
        el.style.display = 'none';
        el.setAttribute('data-vt-hidden', 'true');
      }
    });
  }

  /* ========== calculation preview / breakdown ========== */
  const defaultPreviewSettings = {
    includeImages: true,
    conservativeTime: false,
    rounding: 'nearest',
    detailMode: 'basic',
    wordsPerMinute: 220,
    minutesPerReadMarker: 0.45,
    minutesPerFrameMarker: 0.35,
    minutesPerImage: 0.3
  };

  let draftPreviewSettings = {...defaultPreviewSettings};
  let lockedPreviewSettings = {...defaultPreviewSettings};

  function roundByRule(value, rule){
    if (!Number.isFinite(value)) return 0;
    if (rule === 'up') return Math.ceil(value);
    if (rule === 'down') return Math.floor(value);
    return Math.round(value);
  }

  function getPreviewInputs(){
    const wordCount = editableArticleData.para_lengths.reduce((sum, n)=> sum + (Number(n) || 0), 0);
    const paragraphCount = editableArticleData.para_lengths.length;
    const selectedReads = editableArticleData.reads
      ? editableArticleData.reads.split(',').map((s)=> s.trim()).filter(Boolean).length
      : 0;
    const selectedFrames = editableArticleData.frames
      ? editableArticleData.frames.split(',').map((s)=> s.trim()).filter(Boolean).length
      : 0;
    const imageCount = editableArticleData.images
      ? editableArticleData.images.split(',').map((s)=> s.trim()).filter(Boolean).length
      : 0;
    return {paragraphCount, wordCount, selectedReads, selectedFrames, imageCount};
  }

  // Central breakdown builder to avoid duplicated logic in UI.
  function buildBreakdown(settings = lockedPreviewSettings){
    const inputs = {...getPreviewInputs(), toggles: {...settings}};

    const assumptions = {
      wordsPerMinute: Number(settings.wordsPerMinute) || 220,
      minutesPerReadMarker: Number(settings.minutesPerReadMarker) || 0,
      minutesPerFrameMarker: Number(settings.minutesPerFrameMarker) || 0,
      minutesPerImage: Number(settings.minutesPerImage) || 0,
      roundingStrategy: settings.rounding,
      detailMode: settings.detailMode,
      rationale: settings.conservativeTime
        ? 'Konservativ modus er aktivert.'
        : 'Standard modus er aktivert.'
    };

    const readingMinutes = assumptions.wordsPerMinute > 0 ? (inputs.wordCount / assumptions.wordsPerMinute) : 0;
    const readMarkerMinutes = inputs.selectedReads * assumptions.minutesPerReadMarker;
    const frameMarkerMinutes = inputs.selectedFrames * assumptions.minutesPerFrameMarker;
    const imageMinutes = settings.includeImages ? inputs.imageCount * assumptions.minutesPerImage : 0;

    const rawTotal = readingMinutes + readMarkerMinutes + frameMarkerMinutes + imageMinutes;
    const roundedTotal = roundByRule(rawTotal, assumptions.roundingStrategy);

    const steps = [
      {label:'Leseestimat', value:readingMinutes, formula:`${inputs.wordCount} ord / ${assumptions.wordsPerMinute} ord/min`},
      {label:'Les-skriftsteder', value:readMarkerMinutes, formula:`${inputs.selectedReads} × ${assumptions.minutesPerReadMarker} min`},
      {label:'Rammer', value:frameMarkerMinutes, formula:`${inputs.selectedFrames} × ${assumptions.minutesPerFrameMarker} min`},
      {label:'Bilder', value:imageMinutes, formula: settings.includeImages
        ? `${inputs.imageCount} × ${assumptions.minutesPerImage} min`
        : 'Ekskludert fra beregning'}
    ];

    const result = {
      rawTotalMinutes: rawTotal,
      roundedMinutes: roundedTotal,
      formatted: formatMinutes(roundedTotal)
    };

    return {inputs, assumptions, steps, result};
  }

  function buildKvRows(rows){
    return rows.map(([k,v])=>`<div>${k}</div><div>${v}</div>`).join('');
  }

  function renderLockedResult(){
    const host = $('#vt-locked-result');
    if (!host) return;
    const bd = buildBreakdown(lockedPreviewSettings);
    host.innerHTML = `
      <div class="vt-kv">
        ${buildKvRows([
          ['Totalt estimat', bd.result.formatted],
          ['Rundet tid', `${bd.result.roundedMinutes} min`],
          ['Avrunding', lockedPreviewSettings.rounding],
          ['Bilder', lockedPreviewSettings.includeImages ? 'Inkludert' : 'Ekskludert']
        ])}
      </div>
      <div class="vt-section-spacer">
        <button class="vt-btn vt-btn--ghost" id="vt-open-preview-inline">Forklar beregning</button>
      </div>
    `;

    const badge = $('#vt-lock-badge');
    if (badge) badge.textContent = `Låst: ${bd.result.formatted} (${lockedPreviewSettings.rounding})`;

    const inlineBtn = $('#vt-open-preview-inline');
    if (inlineBtn) inlineBtn.addEventListener('click', openPreviewModal);
  }

  function ensurePreviewModal(){
    if ($('#vt-preview-modal')) return;
    const backdrop = document.createElement('div');
    backdrop.id = 'vt-preview-modal';
    backdrop.className = 'vt-modal-backdrop';
    backdrop.innerHTML = `
      <div class="vt-modal" role="dialog" aria-modal="true" aria-labelledby="vt-preview-title">
        <div class="vt-row">
          <h2 id="vt-preview-title" style="margin:0">Forklar beregning</h2>
          <button class="vt-btn vt-btn--ghost" id="vt-close-preview">Lukk</button>
        </div>
        <p class="vt-subtitle" style="margin-top:8px">Se inputs, antakelser og mellomregning før du låser inn resultatet.</p>

        <div class="vt-section-spacer vt-row" style="flex-wrap:wrap; align-items:flex-end;">
          <div class="vt-tabs" id="vt-detail-tabs">
            <button class="vt-tab is-active" data-mode="basic">Basic</button>
            <button class="vt-tab" data-mode="advanced">Advanced</button>
          </div>
          <div>
            <label class="vt-chip-toggle"><input type="checkbox" id="vt-toggle-images" checked><span>Inkluder bilder</span></label>
          </div>
          <div class="vt-grid-2" style="min-width:360px;">
            <div class="vt-field"><label for="vt-words-per-minute" class="vt-subtitle">Ord per minutt</label><input id="vt-words-per-minute" class="vt-input" type="number" min="1" step="1"></div>
            <div class="vt-field"><label for="vt-minutes-per-read" class="vt-subtitle">Tid per les-skriftsted</label><input id="vt-minutes-per-read" class="vt-input" type="number" min="0" step="0.05"></div>
            <div class="vt-field"><label for="vt-minutes-per-frame" class="vt-subtitle">Tid per ramme</label><input id="vt-minutes-per-frame" class="vt-input" type="number" min="0" step="0.05"></div>
            <div class="vt-field"><label for="vt-minutes-per-image" class="vt-subtitle">Tid per bilde</label><input id="vt-minutes-per-image" class="vt-input" type="number" min="0" step="0.05"></div>
          </div>
          <div>
            <label for="vt-rounding" class="vt-subtitle">Avrundingsmetode</label>
            <select id="vt-rounding" class="vt-select">
              <option value="nearest">Nærmeste minutt</option>
              <option value="up">Rund opp</option>
              <option value="down">Rund ned</option>
            </select>
          </div>
        </div>

        <div class="vt-modal-grid">
          <section class="vt-card" id="vt-preview-inputs"></section>
          <section class="vt-card" id="vt-preview-breakdown"></section>
        </div>

        <div class="vt-row vt-section-spacer" style="justify-content:flex-end;">
          <button class="vt-btn vt-btn--ghost" id="vt-cancel-preview">Avbryt</button>
          <button class="vt-btn vt-btn--primary" id="vt-apply-preview">Bruk disse innstillingene</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    $('#vt-close-preview')?.addEventListener('click', closePreviewModal);
    $('#vt-cancel-preview')?.addEventListener('click', closePreviewModal);
    backdrop.addEventListener('click', (e)=>{ if (e.target === backdrop) closePreviewModal(); });
    $('#vt-apply-preview')?.addEventListener('click', ()=>{
      lockedPreviewSettings = {...draftPreviewSettings};
      window.__VT_PREVIEW_SETTINGS = {...lockedPreviewSettings};
      renderLockedResult();
      closePreviewModal();
    });

    $('#vt-toggle-images')?.addEventListener('change', (e)=>{
      draftPreviewSettings.includeImages = !!e.target.checked;
      renderPreviewSections();
    });
    $('#vt-rounding')?.addEventListener('change', (e)=>{
      draftPreviewSettings.rounding = e.target.value;
      renderPreviewSections();
    });

    [['#vt-words-per-minute','wordsPerMinute'],['#vt-minutes-per-read','minutesPerReadMarker'],['#vt-minutes-per-frame','minutesPerFrameMarker'],['#vt-minutes-per-image','minutesPerImage']]
      .forEach(([sel, key])=>{
        $(sel)?.addEventListener('input', (e)=>{
          draftPreviewSettings[key] = Number(e.target.value) || 0;
          renderPreviewSections();
        });
      });

    $$('#vt-detail-tabs .vt-tab').forEach((tab)=>{
      tab.addEventListener('click', ()=>{
        $$('#vt-detail-tabs .vt-tab').forEach((el)=> el.classList.remove('is-active'));
        tab.classList.add('is-active');
        draftPreviewSettings.detailMode = tab.getAttribute('data-mode') || 'basic';
        renderPreviewSections();
      });
    });
  }

  function renderPreviewSections(){
    const bd = buildBreakdown(draftPreviewSettings);

    const inputRows = [
      ['Avsnitt', nf.format(bd.inputs.paragraphCount)],
      ['Ord', nf.format(bd.inputs.wordCount)],
      ['Les-skriftsteder', nf.format(bd.inputs.selectedReads)],
      ['Rammer', nf.format(bd.inputs.selectedFrames)],
      ['Bilder', nf.format(bd.inputs.imageCount)]
    ];

    const assumptionsRows = [
      ['Lesehastighet', `${bd.assumptions.wordsPerMinute} ord/min`],
      ['Tid per les-skriftsted', `${bd.assumptions.minutesPerReadMarker} min`],
      ['Tid per ramme', `${bd.assumptions.minutesPerFrameMarker} min`],
      ['Tid per bilde', `${bd.assumptions.minutesPerImage} min`],
      ['Rasjonale', bd.assumptions.rationale]
    ];

    const stepRows = bd.steps.map((step)=>[
      step.label,
      draftPreviewSettings.detailMode === 'advanced'
        ? `${nf.format(step.value)} min · ${step.formula}`
        : `${nf.format(step.value)} min`
    ]);

    const inputsEl = $('#vt-preview-inputs');
    if (inputsEl){
      inputsEl.innerHTML = `
        <h3 style="margin:0 0 8px">Inputs og antakelser</h3>
        <div class="vt-kv">${buildKvRows(inputRows)}</div>
        <h3 style="margin:16px 0 8px">Antakelser</h3>
        <div class="vt-kv">${buildKvRows(assumptionsRows)}</div>
      `;
    }

    const breakdownEl = $('#vt-preview-breakdown');
    if (breakdownEl){
      breakdownEl.innerHTML = `
        <h3 style="margin:0 0 8px">Mellomregning</h3>
        <div class="vt-kv">${buildKvRows(stepRows)}</div>
        <h3 style="margin:16px 0 8px">Output</h3>
        <div class="vt-kv">
          ${buildKvRows([
            ['Rå total', `${nf.format(bd.result.rawTotalMinutes)} min`],
            ['Rundet total', `${bd.result.roundedMinutes} min`],
            ['Visning', bd.result.formatted]
          ])}
        </div>
      `;
    }

    // Debug logging is limited to preview rendering.
    console.debug('[Study-Analyzer] buildBreakdown()', bd);
  }

  function syncPreviewControls(){
    $('#vt-toggle-images').checked = !!draftPreviewSettings.includeImages;
    $('#vt-rounding').value = draftPreviewSettings.rounding;
    $('#vt-words-per-minute').value = String(draftPreviewSettings.wordsPerMinute);
    $('#vt-minutes-per-read').value = String(draftPreviewSettings.minutesPerReadMarker);
    $('#vt-minutes-per-frame').value = String(draftPreviewSettings.minutesPerFrameMarker);
    $('#vt-minutes-per-image').value = String(draftPreviewSettings.minutesPerImage);
    $$('#vt-detail-tabs .vt-tab').forEach((tab)=>{
      tab.classList.toggle('is-active', tab.getAttribute('data-mode') === draftPreviewSettings.detailMode);
    });
  }

  function openPreviewModal(){
    ensurePreviewModal();
    draftPreviewSettings = {...lockedPreviewSettings};
    syncPreviewControls();
    renderPreviewSections();
    $('#vt-preview-modal')?.classList.add('open');
  }

  function closePreviewModal(){
    $('#vt-preview-modal')?.classList.remove('open');
  }

  /* ========== play/lock state (use page's own) ========== */
  let isPlaying = false;
  window.__VT_SET_PLAYING = (on)=>{ isPlaying = !!on; };

  const lockPanel = findInfoPanel();
  function panelLooksLocked(el){
    if (!el) return false;
    const cls = (el.className||'').toLowerCase();
    if (/(^|\s)(playing|is-playing|running|locked|disabled|dim|inactive)(\s|$)/.test(cls)) return true;
    const cs = getComputedStyle(el);
    if (cs.pointerEvents === 'none') return true;
    const f = cs.filter || '';
    if (/grayscale\(\s*(0\.[3-9]|[1-9]|\d+\.\d+)\s*\)/.test(f)) return true;
    return false;
  }
  if (lockPanel){
    const syncPlaying = ()=>{ isPlaying = panelLooksLocked(lockPanel); };
    const obs = new MutationObserver(syncPlaying);
    obs.observe(lockPanel, {attributes:true, attributeFilter:['class','style']});
    syncPlaying();
  }

  /* ========== timeline interaction ========== */
  function bindSlotClicks(){
    const tl = $('#timeline'); if(!tl) return;
    const slots = $$('.para-slot', tl); if(!slots.length) return;
    slots.forEach((slot, idx)=>{
      const p=idx+1;
      if (slot.__vtBound) return;
      slot.__vtBound = true;
      slot.addEventListener('click', ()=>{
        if (isPlaying) return;
        const msg = $('#message'); if (!msg) return;
        msg.textContent = buildMsgFor(p);
      });
    });
  }

  function bindUIActions(){
    const btn = $('#vt-open-preview');
    if (btn && !btn.__vtBound){
      btn.__vtBound = true;
      btn.addEventListener('click', openPreviewModal);
    }

    const analyzeBtn = $('#vt-analyze-btn');
    if (analyzeBtn && !analyzeBtn.__vtBound){
      analyzeBtn.__vtBound = true;
      analyzeBtn.addEventListener('click', ()=>{
        const parsed = parseArticleText($('#vt-article-text')?.value || '');
        setDetectedAndEditableData(parsed);
      });
    }

    const editableMap = [
      ['#vt-edit-week-start', 'week_start'],
      ['#vt-edit-title', 'title'],
      ['#vt-edit-groups', 'groups'],
      ['#vt-edit-frames', 'frames'],
      ['#vt-edit-reads', 'reads'],
      ['#vt-edit-para-lengths', 'para_lengths'],
      ['#vt-edit-images', 'images']
    ];
    editableMap.forEach(([sel, field])=>{
      const el = $(sel);
      if (!el || el.__vtBound) return;
      el.__vtBound = true;
      el.addEventListener('input', (e)=> handleEditableFieldChange(field, e.target.value));
    });


    $$('#vt-json-mode-tabs .vt-tab').forEach((tab)=>{
      if (tab.__vtBound) return;
      tab.__vtBound = true;
      tab.addEventListener('click', ()=>{
        jsonPreviewMode = tab.getAttribute('data-json-mode') || 'pretty';
        syncDataBindings();
      });
    });

    const copyBtn = $('#vt-copy-json');
    if (copyBtn && !copyBtn.__vtBound){
      copyBtn.__vtBound = true;
      copyBtn.addEventListener('click', copyEditableJson);
    }

    const exportBtn = $('#vt-export-json');
    if (exportBtn && !exportBtn.__vtBound){
      exportBtn.__vtBound = true;
      exportBtn.addEventListener('click', downloadEditableJson);
    }
  }

  /* ========== keep message stable ========== */
  function keepMessageStable(){
    const msg = $('#message'); if(!msg || msg.__vtStable) return;
    msg.__vtStable = true;
    const mo = new MutationObserver(()=>{
      const text = (msg.textContent || '').trim();
      const m = text.match(/^Avsnitt\s+(\d+)(?:\b|$)/);
      if (!m) return;
      const p = Number(m[1]);
      const desired = buildMsgFor(p);
      if (desired && text !== desired) msg.textContent = desired;
    });
    mo.observe(msg, {childList:true, characterData:true, subtree:true});
  }

  /* ========== apply & re-apply on timeline changes ========== */
  window.__VT_RUN_PARSER_EXAMPLE_TEST = runParserExampleTest;

  function applyAll(){
    ensureProfessionalLayout();
    ensurePreviewModal();
    if (!editableArticleData.title && !editableArticleData.para_lengths.length) hydrateDetectedFromCurrentItem();
    bindUIActions();
    applyTwoToneWithGroups();
    layoutPins();
    bindSlotClicks();
    keepMessageStable();
    updateStats();
    renderLockedResult();
  }

  function startObservers(){
    const tl = $('#timeline');
    if (!tl || tl.__vtObserved) return;
    tl.__vtObserved = true;
    const mo = new MutationObserver(()=> requestAnimationFrame(applyAll));
    mo.observe(tl, {childList:true, subtree:true});
  }

  const orig = window.drawTimeline;
  if (typeof orig === 'function'){
    window.drawTimeline = function(){
      const r = orig.apply(this, arguments);
      requestAnimationFrame(applyAll);
      requestAnimationFrame(startObservers);
      return r;
    };
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ()=>{ applyAll(); startObservers(); });
  } else {
    applyAll(); startObservers();
  }
})();
