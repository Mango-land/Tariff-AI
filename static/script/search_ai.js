const tariffs = []
let compareList = [];

let history = [], busy = false;

let recs = [];

const SYS = `Ты — умный помощник по подбору мобильных тарифов TariffAI.

Доступные тарифы: ${JSON.stringify(tariffs)}
unlimits: messengers=мессенджеры, social=соцсети, video=видеохостинги, music=музыка.

Когда понял потребности, добавь в конец:
RECOMMENDATIONS_JSON:[{"id":1,"match":95},{"id":2,"match":82}]

Правила:
- Отвечай по-русски, кратко и дружелюбно
- Задавай уточняющие вопросы про бюджет и потребности
- Предлагай 2–4 тарифа с % совпадения
- Используй только тарифы из базы`;

function getOperatorColor(operator) {
    const colors = {
        'MTC': '#e30613',
        'Билайн': '#f8c300',
        'МегаФон': '#1d9c4a',
        'Теле2': '#1c1c1c',
        'Yota': '#3eb6e8'
    };
    return colors[operator] || '#666666';
}

async function callAI(msg) {
    history.push({role:'user', content:msg});

    try {
        const response = await fetch('/api/get/tariffs_by_response', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                system: SYS,
                messages: history
            })
        });

        const data = await response.json();

        history.push({role:'assistant', content:data.text});

        recs = data.tariffs_id;

        return data.text;
    } catch(e) {
        return `Ошибка соединения. Попробуй ещё раз.`;
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

function updateRecs() {
    if (!recs.length) return;

    document.getElementById('recBadge').textContent = recs.length;

    document.getElementById('recList').innerHTML = recs.map((r, i) => {
        const tariff = tariffs.find(x=>x.id===r); if (!tariff) return '';

        const inC = compareList.includes(tariff.id);

        return `
            <div class="rec-card">
                <div class="rc-top">
                    <div class="rc-op"><div class="rc-op-dot" style="background:${getOperatorColor(tariff.operator)}"></div><div class="rc-op-name">${tariff.operator}</div></div>
                    <div class="rc-price">${tariff.price} <small>₽/мес</small></div>
                </div>
                <div class="rc-name">${tariff.name}</div>
                <div class="rc-specs">
                    <div><strong>${tariff.gb === 100 ? '∞' : tariff.gb + 'ГБ'}</strong> инетернет</div>
                    <div><strong>${tariff.minutes === 1000 ? '∞' : tariff.minutes}</strong> минут</div>
                    <div><strong>${tariff.sms === 500 ? '∞' : (tariff.sms || '—')}</strong> SMS</div>
                </div>
                <div class="rc-actions">
                    <button class="btn-compare-tc ${inC ? 'added' : ''}" onclick="toggleCmp(event, ${tariff.id})">
                      ${inC ? '✓ Добавлен' : '+ Сравнить'}
                    </button>
                    <a class="rc-btn-p" href="${tariff.link || '#'}" target="_blank">Подробнее</a>
                </div>
            </div>`;
    }).join('');
}

function toggleCmp(event, id) {
    const i = compareList.indexOf(id);

    if (i === -1) {
        if (compareList.length >= 3) {
            return;
        }
        compareList.push(id);
    } else {
        compareList.splice(i, 1);
    }

    saveCompareToStorage();
    updateCmpBar();
    if (recs.length) updateRecs();
}

function saveCompareToStorage() {
    localStorage.setItem('compareTariffs', JSON.stringify(compareList));
}

function updateCmpBar() {
    const bar = document.getElementById('cmpBar');
    if (!compareList.length) {
        bar.classList.remove('show');
        return;
    }
    bar.classList.add('show');
    document.getElementById('cmpCount').textContent = `${compareList.length} из 3`;
    document.getElementById('cmpItems').innerHTML = compareList.map(id => {
        const t = tariffs.find(x => x.id === id);
        if (!t) return '';
        return `<div class="cmp-tag">${t.name} · ${t.operator}<button class="cmp-rm" onclick="toggleCmp(event, ${t.id})">×</button></div>`;
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

    const aiText = await callAI(text);

    showTyping(false);
    busy = false;
    document.getElementById('sendBtn').disabled = false;
    addMsg(aiText, 'ai');

    if (recs.length) updateRecs();
}

function sendQuick(btn) {
    document.getElementById('inp').value = btn.textContent.trim();
    btn.closest('.qr-row').style.display = 'none';
    send();
}

function onKey(e) { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); } }
function autoH(el) { el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,120)+'px'; }

async function loadTariffs() {
    try {
        const response = await fetch('/api/get/all_tariffs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();

        if (!data.success) {
            console.error('Failed to load tariffs:', data.error);
            return false;
        }

        data.tariffs.forEach(t => {
            tariffs.push(t);
        });

        return true;
    } catch (error) {
        console.error('Error loading tariffs:', error);
        return false;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadTariffs();
});