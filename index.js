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
    detailMode: 'basic'
  };

  let draftPreviewSettings = {...defaultPreviewSettings};
  let lockedPreviewSettings = {...defaultPreviewSettings};

  function roundByRule(value, rule){
    if (!Number.isFinite(value)) return 0;
    if (rule === 'up') return Math.ceil(value);
    if (rule === 'down') return Math.floor(value);
    return Math.round(value);
  }

  // Central breakdown builder to avoid duplicated logic in UI.
  function buildBreakdown(settings = lockedPreviewSettings){
    const inputs = {
      paragraphCount: getParaCount(),
      wordCount: getWordCount(),
      selectedReads: getReadSet().size,
      selectedFrames: getFrameSet().size,
      imageCount: getImageSet().size,
      toggles: {...settings}
    };

    const assumptions = {
      wordsPerMinute: settings.conservativeTime ? 180 : 220,
      minutesPerReadMarker: 0.45,
      minutesPerFrameMarker: 0.35,
      minutesPerImage: 0.3,
      roundingStrategy: settings.rounding,
      detailMode: settings.detailMode,
      rationale: settings.conservativeTime
        ? 'Konservativ modus bruker lavere lesehastighet for tryggere estimat.'
        : 'Standard modus bruker normal lesehastighet for balansert estimat.'
    };

    const readingMinutes = inputs.wordCount / assumptions.wordsPerMinute;
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
          ['Modus', lockedPreviewSettings.conservativeTime ? 'Konservativ' : 'Standard'],
          ['Bilder', lockedPreviewSettings.includeImages ? 'Inkludert' : 'Ekskludert']
        ])}
      </div>
      <div class="vt-section-spacer">
        <button class="vt-btn vt-btn--ghost" id="vt-open-preview-inline">Forklar beregning</button>
      </div>
    `;

    const badge = $('#vt-lock-badge');
    if (badge) badge.textContent = `Låst: ${bd.result.formatted} (${lockedPreviewSettings.conservativeTime ? 'konservativ' : 'standard'})`;

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

        <div class="vt-section-spacer vt-row" style="flex-wrap:wrap; align-items:center;">
          <div class="vt-tabs" id="vt-detail-tabs">
            <button class="vt-tab is-active" data-mode="basic">Basic</button>
            <button class="vt-tab" data-mode="advanced">Advanced</button>
          </div>
          <div>
            <label class="vt-chip-toggle"><input type="checkbox" id="vt-toggle-images" checked><span>Inkluder bilder</span></label>
            <label class="vt-chip-toggle"><input type="checkbox" id="vt-toggle-conservative"><span>Konservativ tid</span></label>
          </div>
          <div>
            <label for="vt-rounding" class="vt-subtitle">Avrunding</label>
            <select id="vt-rounding" class="vt-select vt-btn">
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
    $('#vt-toggle-conservative')?.addEventListener('change', (e)=>{
      draftPreviewSettings.conservativeTime = !!e.target.checked;
      renderPreviewSections();
    });
    $('#vt-rounding')?.addEventListener('change', (e)=>{
      draftPreviewSettings.rounding = e.target.value;
      renderPreviewSections();
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
    $('#vt-toggle-conservative').checked = !!draftPreviewSettings.conservativeTime;
    $('#vt-rounding').value = draftPreviewSettings.rounding;
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
  function applyAll(){
    ensureProfessionalLayout();
    ensurePreviewModal();
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
