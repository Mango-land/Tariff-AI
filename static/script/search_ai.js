const TARIFFS = [
  {id:1, name:'Мой МТС',     op:'МТС',     c:'#e7011a', price:299,  gb:10,  min:200,  sms:50,  u:['messengers']},
  {id:2, name:'МТС Smart',   op:'МТС',     c:'#e7011a', price:449,  gb:20,  min:300,  sms:100, u:['messengers','music']},
  {id:3, name:'МТС Premium', op:'МТС',     c:'#e7011a', price:699,  gb:50,  min:1000, sms:500, u:['messengers','social','music','video']},
  {id:4, name:'МТС Безлимит',op:'МТС',     c:'#e7011a', price:999,  gb:100, min:1000, sms:500, u:['messengers','social','music','video']},
  {id:5, name:'Всё',         op:'Билайн',  c:'#222222', price:390,  gb:15,  min:300,  sms:50,  u:['social']},
  {id:6, name:'Всё+ за 550', op:'Билайн',  c:'#222222', price:550,  gb:30,  min:600,  sms:100, u:['social','messengers']},
  {id:7, name:'Много',       op:'Билайн',  c:'#222222', price:850,  gb:60,  min:1000, sms:200, u:['social','messengers','music']},
  {id:8, name:'Мой разговор',op:'Теле2',   c:'#00b0e6', price:199,  gb:5,   min:100,  sms:0,   u:[]},
  {id:9, name:'Мой онлайн',  op:'Теле2',   c:'#00b0e6', price:299,  gb:12,  min:200,  sms:50,  u:['messengers']},
  {id:10,name:'Мой онлайн+', op:'Теле2',   c:'#00b0e6', price:499,  gb:30,  min:500,  sms:100, u:['messengers','video']},
  {id:11,name:'Мой безлимит',op:'Теле2',   c:'#00b0e6', price:799,  gb:60,  min:1000, sms:200, u:['messengers','social','video','music']},
  {id:12,name:'Включайся',   op:'МегаФон', c:'#009f6b', price:350,  gb:10,  min:200,  sms:100, u:['messengers']},
  {id:13,name:'Слушай',      op:'МегаФон', c:'#009f6b', price:500,  gb:20,  min:400,  sms:150, u:['messengers','music']},
  {id:14,name:'Смотри',      op:'МегаФон', c:'#009f6b', price:650,  gb:40,  min:600,  sms:200, u:['messengers','music','video']},
  {id:15,name:'Говори',      op:'МегаФон', c:'#009f6b', price:900,  gb:70,  min:1000, sms:500, u:['messengers','music','video','social']},
  {id:16,name:'Yota',        op:'Yota',    c:'#6c63ff', price:350,  gb:10,  min:200,  sms:50,  u:['messengers','social']},
  {id:17,name:'Yota+',       op:'Yota',    c:'#6c63ff', price:500,  gb:25,  min:500,  sms:100, u:['messengers','social','music','video']},
  {id:18,name:'Yota MAX',    op:'Yota',    c:'#6c63ff', price:750,  gb:100, min:1000, sms:500, u:['messengers','social','music','video']},
];

let history = [], busy = false;

const SYS = `Ты — умный помощник по подбору мобильных тарифов TariffAI.

Доступные тарифы: ${JSON.stringify(TARIFFS)}
unlimits: messengers=мессенджеры, social=соцсети, video=видеохостинги, music=музыка.

Когда понял потребности, добавь в конец:
RECOMMENDATIONS_JSON:[{"id":1,"match":95},{"id":2,"match":82}]

Правила:
- Отвечай по-русски, кратко и дружелюбно
- Задавай уточняющие вопросы про бюджет и потребности
- Предлагай 2–4 тарифа с % совпадения
- Используй только тарифы из базы`;

async function callAI(msg) {
  history.push({role:'user', content:msg});

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({model:'claude-sonnet-4-20250514', max_tokens:1000, system:SYS, messages:history})
    });

    const d = await r.json();

    const full = d.content.map(b=>b.text||'').join('');
    const m = full.match(/RECOMMENDATIONS_JSON:(\[.*?\])/s);

    let recs = [];

    if (m) { try { recs = JSON.parse(m[1]); } catch(e){} }

    const clean = full.replace(/RECOMMENDATIONS_JSON:\[.*?\]/s,'').trim();
    history.push({role:'assistant', content:full});
    return {text:clean, recs};
  } catch(e) {
    return {text:'Ошибка соединения. Попробуй ещё раз.', recs:[]};
  }
}

function addMsg(text, role, qrs=[]) {
  const wrap = document.getElementById('chatMsgs');
  const t = new Date().toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'});
  const d = document.createElement('div');
  d.className = `msg ${role}`;
  const qrHtml = qrs.length ? `<div class="qr-row">${qrs.map(q=>`<button class="qr" onclick="sendQuick(this)">${q}</button>`).join('')}</div>` : '';
  d.innerHTML = `<div class="msg-ava">${role==='ai'?'✦':'👤'}</div><div class="msg-body"><div class="msg-bubble">${text.replace(/\n/g,'<br>')}</div>${qrHtml}<div class="msg-time">${t}</div></div>`;
  wrap.appendChild(d);
  wrap.scrollTop = wrap.scrollHeight;
}

function showTyping(v) {
  const ti = document.getElementById('typing');
  const wrap = document.getElementById('chatMsgs');
  ti.classList.toggle('show', v);
  if (v) wrap.appendChild(ti);
  wrap.scrollTop = wrap.scrollHeight;
}

function updateRecs(recs) {
  if (!recs.length) return;
  document.getElementById('recBadge').textContent = recs.length;
  document.getElementById('recList').innerHTML = recs.map((r,i) => {
    const t = TARIFFS.find(x=>x.id===r.id); if (!t) return '';
    const m = r.match||80;
    return `<div class="rec-card" style="animation-delay:${i*.07}s">
      <div class="rc-top">
        <div class="rc-op"><div class="rc-op-dot" style="background:${t.c}"></div><div class="rc-op-name">${t.op}</div></div>
        <div class="rc-price">${t.price} <small>₽/мес</small></div>
      </div>
      <div class="rc-name">${t.name}</div>
      <div class="rc-specs">
        <div><strong>${t.gb===100?'∞':t.gb+'ГБ'}</strong> инет</div>
        <div><strong>${t.min===1000?'∞':t.min}</strong> мин</div>
        <div><strong>${t.sms===500?'∞':(t.sms||'—')}</strong> SMS</div>
      </div>
      <div class="match-row">
        <div class="match-lbl">Совпадение</div>
        <div class="match-track"><div class="match-bar" style="width:${m}%"></div></div>
        <div class="match-pct">${m}%</div>
      </div>
      <div class="rc-actions">
        <button class="rc-btn-p">Выбрать тариф</button>
        <button class="rc-btn-s">+ Сравнить</button>
      </div>
    </div>`;
  }).join('');
}

async function send() {
  const inp = document.getElementById('inp');
  const text = inp.value.trim();

  if (!text || busy) return;

  inp.value = ''; inp.style.height = 'auto';
  addMsg(text, 'user');

  busy = true;
  document.getElementById('sendBtn').disabled = true;

  showTyping(true);

  const {text:aiText, recs} = await callAI(text);

  showTyping(false);
  busy = false;
  document.getElementById('sendBtn').disabled = false;
  addMsg(aiText, 'ai');

  if (recs.length) updateRecs(recs);
}

function sendQuick(btn) {
  document.getElementById('inp').value = btn.textContent.trim();
  btn.closest('.qr-row').style.display = 'none';
  send();
}
function onKey(e) { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); } }
function autoH(el) { el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,120)+'px'; }