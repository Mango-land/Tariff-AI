let tariffs = [];
let slots = [null, null, null];
let targetSlot = null;

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

const INF_GB = 100;
const INF_MIN = 2000;
const INF_SMS = 1200;

const ROWS = [
    { sec: 'Основные параметры' },
    { lbl: 'Цена в месяц', key: 'price', fmt: v => v + ' ₽', best: 'min' },
    { lbl: 'Интернет', key: 'gb', fmt: v => v >= INF_GB ? '∞ ГБ' : v + ' ГБ', best: 'max' },
    { lbl: 'Минуты', key: 'minutes', fmt: v => v >= INF_MIN ? '∞' : v, best: 'max' },
    { lbl: 'SMS', key: 'sms', fmt: v => v >= INF_SMS ? '∞' : (v || '—'), best: 'max' },
    { sec: 'Безлимиты' },
    { lbl: '💬 Мессенджеры', u: 'messengers' },
    { lbl: '📱 Соцсети', u: 'social' },
    { lbl: '▶️ Видеохостинги', u: 'video' },
    { lbl: '🎵 Музыка', u: 'music' },
];

async function loadTariffs() {
    try {
        const response = await fetch('/api/get/all_tariffs');
        const result = await response.json();

        if (!result.success) {
            return false;
        }

        tariffs = result.tariffs.map(item => ({
            ...item,
            c: getOperatorColor(item.operator)
        }));

        render();
        return true;
    } catch (error) {
        return false;
    }
}

function render() {
    const el = document.getElementById('cmpContent');
    const filled = slots.filter(Boolean);
    if (!filled.length) {
        el.innerHTML = `<div class="empty-state">
            <div class="empty-icon">⊞</div>
            <h2>Добавь тарифы для сравнения</h2>
            <p>Выбери до 3 тарифов и сравни их параметры бок о бок</p>
            <div class="empty-slots">
                ${slots.map((_, i) => `<div class="empty-slot" onclick="openModal(${i})">
                    <div style="font-size:26px;color:var(--muted);margin-bottom:7px">+</div>
                    <div style="font-size:13px;color:var(--muted)">Добавить тариф</div>
                </div>`).join('')}
            </div>
        </div>`;
        return;
    }

    const bp = Math.min(...filled.map(t => t.price));
    const bg = Math.max(...filled.map(t => t.gb));
    const bm = Math.max(...filled.map(t => t.minutes));
    const bs = Math.max(...filled.map(t => t.sms));

    const thead = `<tr>
        <th class="sh-cell" style="width:160px"></th>
        ${slots.map((t, i) => t
            ? `<th class="sh-cell">
                <div class="slot-card">
                    <button class="slot-rm" onclick="rmSlot(${i})">×</button>
                    <div class="slot-op-logo" style="background:${t.c}">${t.operator === 'МегаФон' ? 'МФ' : t.operator.slice(0, 2)}</div>
                    <div class="slot-op-nm">${t.operator}</div>
                    <div class="slot-name">${t.name}</div>
                    <div class="slot-price">${t.price}</div>
                    <div class="slot-per">₽ в месяц</div>
                </div>
               </th>`
            : `<th class="sh-cell">
                <div class="slot-card empty" onclick="openModal(${i})">
                    <div class="slot-plus">+</div>
                    <div class="slot-add-txt">Добавить тариф</div>
                </div>
               </th>`
        ).join('')}
    </tr>`;

    const tbody = ROWS.map(row => {
        if (row.sec) {
            return `<tr class="row-sec"><td colspan="4"><div class="row-sec-lbl">${row.sec}</div></td></tr>`;
        }
        return `<tr class="row-data">
            <td class="row-lbl">${row.lbl}</td>
            ${slots.map(t => {
                if (!t) return `<td class="val-cell empty-v">—</td>`;
                if (row.u !== undefined) {
                    const unlimitedField = `unlimited_${row.u}`;
                    const hasUnlimited = !!t[unlimitedField];
                    return `<td class="val-cell">${hasUnlimited ? '<span class="chk-y">✓</span>' : '<span class="chk-n">×</span>'}</td>`;
                }
                const v = t[row.key];
                let best = false;
                if (filled.length > 1 && row.best) {
                    if (row.best === 'min' && row.key === 'price') best = v === bp;
                    if (row.best === 'max' && row.key === 'gb') best = v === bg;
                    if (row.best === 'max' && row.key === 'minutes') best = v === bm;
                    if (row.best === 'max' && row.key === 'sms') best = v === bs;
                }
                return `<td class="val-cell ${best ? 'best' : ''}">${row.fmt(v)}</td>`;
            }).join('')}
        </tr>`;
    }).join('');

    el.innerHTML = `<table class="cmp-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
}

function openModal(i) {
    targetSlot = i;
    document.getElementById('modalOv').classList.add('open');
    document.getElementById('mSearch').value = '';
    renderModal('');
    setTimeout(() => document.getElementById('mSearch').focus(), 80);
}

function closeModal() {
    document.getElementById('modalOv').classList.remove('open');
}

function outsideClose(e) {
    if (e.target === document.getElementById('modalOv')) closeModal();
}

function renderModal(q) {
    const used = slots.filter(Boolean).map(t => t.id);
    const list = tariffs.filter(t => !used.includes(t.id) && (!q || t.name.toLowerCase().includes(q.toLowerCase()) || t.operator.toLowerCase().includes(q.toLowerCase())));
    const el = document.getElementById('mList');
    if (!list.length) {
        el.innerHTML = '<div style="padding:22px;text-align:center;color:var(--muted);font-size:13px">Ничего не найдено</div>';
        return;
    }
    el.innerHTML = list.map(t => {
        const init = t.operator === 'МегаФон' ? 'МФ' : t.operator.slice(0, 2);
        return `<div class="m-item" onclick="pickTariff(${t.id})">
            <div class="m-logo" style="background:${t.c}">${init}</div>
            <div class="m-info">
                <div class="m-name">${t.name}</div>
                <div class="m-specs">${t.operator} · ${t.gb >= INF_GB ? '∞' : t.gb + 'ГБ'} · ${t.minutes >= INF_MIN ? '∞' : t.minutes} мин</div>
            </div>
            <div class="m-price">${t.price} ₽</div>
        </div>`;
    }).join('');
}

function filterM(q) {
    renderModal(q);
}

function pickTariff(id) {
    const t = tariffs.find(x => x.id === id);
    if (!t || targetSlot === null) return;
    if (slots[targetSlot] !== null) {
        const empty = slots.findIndex(s => s === null);
        if (empty !== -1) slots[empty] = t;
    } else {
        slots[targetSlot] = t;
    }
    closeModal();
    render();
}

function rmSlot(i) {
    slots[i] = null;
    render();
}

function clearAll() {
    slots = [null, null, null];
    render();
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadTariffs();

    render();
});

window.openModal = openModal;
window.closeModal = closeModal;
window.outsideClose = outsideClose;
window.filterM = filterM;
window.pickTariff = pickTariff;
window.rmSlot = rmSlot;
window.clearAll = clearAll;