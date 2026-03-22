const TARIFFS = [];

const UL = {messengers: '💬 Мессенджеры ∞', social: '📱 Соцсети ∞', video: '▶️ Видео ∞', music: '🎵 Музыка ∞'};
const BC = {messengers: 'cb-blue', social: 'cb-blue', video: 'cb-red', music: 'cb-green'};
let compareList = [];

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

function initRange(minId, maxId, fillId, minLblId, maxLblId, unit, infinityLabel) {
    const lo = document.getElementById(minId);
    const hi = document.getElementById(maxId);
    const fill = document.getElementById(fillId);
    const loLbl = document.getElementById(minLblId);
    const hiLbl = document.getElementById(maxLblId);

    function update() {
        const min = +lo.min, max = +lo.max;
        let vLo = +lo.value, vHi = +hi.value;

        if (vLo > vHi) {
            lo.value = vHi;
            vLo = vHi;
        }
        if (vHi < vLo) {
            hi.value = vLo;
            vHi = vLo;
        }

        const pLo = (vLo - min) / (max - min) * 100;
        const pHi = (vHi - min) / (max - min) * 100;
        fill.style.left = pLo + '%';
        fill.style.width = (pHi - pLo) + '%';

        loLbl.innerHTML = vLo + ' <span>' + unit + '</span>';
        hiLbl.innerHTML = (infinityLabel && vHi >= max) ? infinityLabel : vHi + ' <span>' + unit + '</span>';
        render();
    }

    lo.addEventListener('input', update);
    hi.addEventListener('input', update);
    update();
    return update;
}

const resets = [];
resets.push(initRange('priceMin', 'priceMax', 'priceFill', 'priceMinLbl', 'priceMaxLbl', '₽', null));
resets.push(initRange('gbMin', 'gbMax', 'gbFill', 'gbMinLbl', 'gbMaxLbl', 'ГБ', '∞'));
resets.push(initRange('minMin', 'minMax', 'minFill', 'minMinLbl', 'minMaxLbl', 'мин', '∞'));
resets.push(initRange('smsMin', 'smsMax', 'smsFill', 'smsMinLbl', 'smsMaxLbl', 'SMS', '∞'));

document.querySelectorAll('.toggle-chip').forEach(b => b.addEventListener('click', () => {
    b.classList.toggle('on');
    render();
}));
document.querySelectorAll('.op-btn').forEach(b => b.addEventListener('click', () => {
    b.classList.toggle('on');
    render();
}));

async function loadTariffs() {
    try {
        const response = await fetch('/api/get/all_tariffs');
        const result = await response.json();

        if (!result.success) {
            console.error('Failed to load tariffs:', result.error);
            return false;
        }

        result.tariffs.forEach(data => {
            TARIFFS.push(data);
        });

        render();
        return true;
    } catch (error) {
        console.error('Error loading tariffs:', error);
        return false;
    }
}

function getFilters() {
    return {
        priceMin: +document.getElementById('priceMin').value,
        priceMax: +document.getElementById('priceMax').value,
        gbMin: +document.getElementById('gbMin').value,
        gbMax: +document.getElementById('gbMax').value,
        minMin: +document.getElementById('minMin').value,
        minMax: +document.getElementById('minMax').value,
        smsMin: +document.getElementById('smsMin').value,
        smsMax: +document.getElementById('smsMax').value,
        unlimits: [...document.querySelectorAll('.toggle-chip.on')].map(b => b.dataset.key),
        operators: [...document.querySelectorAll('.op-btn.on')].map(b => b.dataset.op),
        sort: document.getElementById('sortSel').value,
    };
}

function render() {
    const filters = getFilters();
    let list = TARIFFS.filter(t => {
        if (t.price < filters.priceMin || t.price > filters.priceMax) return false;
        if (t.gb < filters.gbMin || (filters.gbMax < 100 && t.gb > filters.gbMax)) return false;
        if (t.minutes < filters.minMin || (filters.minMax < 2000 && t.minutes > filters.minMax)) return false;
        if (t.sms < filters.smsMin || (filters.smsMax < 1200 && t.sms > filters.smsMax)) return false;
        if (!filters.operators.includes(t.operator)) return false;
        for (const k of filters.unlimits) {
            if (t.unlimited_messengers && k === 'messengers')
                return true;
            if (t.unlimited_social && k === 'social')
                return true;
            if (t.unlimited_video && k === 'video')
                return true;
            if (t.unlimited_music && k === 'music')
                return true;
        }

        return filters.unlimits.length === 0;
    });
    list.sort((a, b) => ({
        price_asc: a.price - b.price,
        price_desc: b.price - a.price,
        gb_desc: b.gb - a.gb,
        min_desc: b.minutes - a.minutes
    })[filters.sort] || 0);

    document.getElementById('resNum').textContent = list.length;
    const el = document.getElementById('tariffsList');

    if (!list.length) {
        el.innerHTML = `<div class="no-results"><div class="no-results-icon">◎</div><h3>Ничего не найдено</h3><p>Попробуй изменить параметры фильтра</p></div>`;
        return;
    }

    el.innerHTML = list.map(t => {
        const inC = compareList.includes(t.id);
        const operatorAbbr = t.operator === 'МегаФон' ? 'МФ' : t.operator.slice(0, 2);
        const operatorColor = getOperatorColor(t.operator);

        const badges = [];
        if (t.unlimited_messengers) badges.push(`<span class="cbadge ${BC.messengers}">${UL.messengers}</span>`);
        if (t.unlimited_social) badges.push(`<span class="cbadge ${BC.social}">${UL.social}</span>`);
        if (t.unlimited_video) badges.push(`<span class="cbadge ${BC.video}">${UL.video}</span>`);
        if (t.unlimited_music) badges.push(`<span class="cbadge ${BC.music}">${UL.music}</span>`);

        return `<div class="t-card">
            <div class="tc-op">
              <div class="tc-op-logo" style="background:${operatorColor}">${operatorAbbr}</div>
              <div class="tc-op-name">${t.operator}</div>
            </div>
            <div>
              <div class="tc-name">${t.name}</div>
              <div class="tc-specs">
                <div><div class="tc-sv">${t.gb >= 100 ? '∞' : t.gb + ' ГБ'}</div><div class="tc-sl">интернет</div></div>
                <div><div class="tc-sv">${t.minutes >= 2000 ? '∞' : t.minutes}</div><div class="tc-sl">минут</div></div>
                <div><div class="tc-sv">${t.sms >= 1200 ? '∞' : (t.sms || '—')}</div><div class="tc-sl">SMS</div></div>
              </div>
              <div class="tc-badges">${badges.join('')}</div>
            </div>
            <div class="tc-right">
              <div class="tc-price">${t.price} <span>₽/мес</span></div>
              <div class="tc-actions">
                <button class="btn-compare-tc ${inC ? 'added' : ''}" onclick="toggleCmp(event, ${t.id})">
                  ${inC ? '✓ Добавлен' : '+ Сравнить'}
                </button>
                <a class="btn-view-tc" href="${t.link || '#'}" target="_blank">Подробнее</a>
              </div>
            </div>
          </div>`;
        }
    ).join('');
}

function toggleCmp(event, id) {
    const i = compareList.indexOf(id);

    if (i === -1) {
        if (compareList.length >= 3) {
            return;
        }
        compareList.push(id);
    } else compareList.splice(i, 1);

    updateCmpBar();
    render();
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
        const t = TARIFFS.find(x => x.id === id);
        return `<div class="cmp-tag">${t.name} · ${t.operator}<button class="cmp-rm" onclick="toggleCmp(event,${t.id},'')">×</button></div>`;
    }).join('');
}

function resetAll() {
    document.getElementById('priceMin').value = 0;
    document.getElementById('priceMax').value = 2000;
    document.getElementById('gbMin').value = 0;
    document.getElementById('gbMax').value = 100;
    document.getElementById('minMin').value = 0;
    document.getElementById('minMax').value = 2000;
    document.getElementById('smsMin').value = 0;
    document.getElementById('smsMax').value = 1200;
    document.querySelectorAll('.toggle-chip').forEach(b => b.classList.remove('on'));
    document.querySelectorAll('.op-btn').forEach(b => b.classList.add('on'));
    resets.forEach(fn => fn());
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadTariffs();

    render();
});