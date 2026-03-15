function createDualSlider(minId, maxId, trackId, minValId, maxValId, unit, infinityAt) {
    const minInp = document.getElementById(minId);
    const maxInp = document.getElementById(maxId);
    const track = document.getElementById(trackId);
    const minShow = document.getElementById(minValId);
    const maxShow = document.getElementById(maxValId);
    const wrapper = minInp.parentElement;

    let isDragging = false;

    minInp.style.zIndex = '3';
    maxInp.style.zIndex = '2';

    function update(e) {
        let v1 = parseInt(minInp.value);
        let v2 = parseInt(maxInp.value);

        if (v1 > v2) {
            if (e && e.target === minInp) {
                minInp.value = v2;
                v1 = v2;
            } else {
                maxInp.value = v1;
                v2 = v1;
            }
        }

        minShow.innerText = v1 >= infinityAt ? 'Безлимит' : `${v1} ${unit}`;
        maxShow.innerText = v2 >= infinityAt ? 'Безлимит' : `${v2} ${unit}`;

        const p1 = (v1 / minInp.max) * 100;
        const p2 = (v2 / maxInp.max) * 100;
        track.style.left = p1 + '%';
        track.style.width = (p2 - p1) + '%';
    }

    function preventTrackClick(input) {
        input.addEventListener('mousedown', (e) => {
            const rect = input.getBoundingClientRect();
            if (rect.width === 0) return;
            const min = parseFloat(input.min);
            const max = parseFloat(input.max);
            const val = parseFloat(input.value);
            const percent = (val - min) / (max - min);
            const thumbX = rect.left + percent * rect.width;
            const clickX = e.clientX;
            const threshold = 15;
            if (Math.abs(clickX - thumbX) > threshold) {
                e.preventDefault();
            }
        });
    }

    preventTrackClick(minInp);
    preventTrackClick(maxInp);

    wrapper.addEventListener('mousemove', (e) => {
        if (isDragging) return;
        const rect = wrapper.getBoundingClientRect();
        const mouseX = e.clientX;
        const minVal = parseFloat(minInp.value);
        const maxVal = parseFloat(maxInp.value);
        const minPercent = (minVal - minInp.min) / (minInp.max - minInp.min);
        const maxPercent = (maxVal - maxInp.min) / (maxInp.max - maxInp.min);
        const minX = rect.left + minPercent * rect.width;
        const maxX = rect.left + maxPercent * rect.width;
        const distToMin = Math.abs(mouseX - minX);
        const distToMax = Math.abs(mouseX - maxX);
        const threshold = 20;
        if (distToMin < threshold && distToMin <= distToMax) {
            minInp.style.zIndex = '3';
            maxInp.style.zIndex = '2';
        } else if (distToMax < threshold && distToMax < distToMin) {
            minInp.style.zIndex = '2';
            maxInp.style.zIndex = '3';
        }
    });

    wrapper.addEventListener('mouseleave', () => {
        if (!isDragging) {
            minInp.style.zIndex = '3';
            maxInp.style.zIndex = '2';
        }
    });

    minInp.addEventListener('mousedown', () => { isDragging = true; });
    maxInp.addEventListener('mousedown', () => { isDragging = true; });
    document.addEventListener('mouseup', () => { isDragging = false; });

    minInp.addEventListener('touchstart', () => { isDragging = true; });
    maxInp.addEventListener('touchstart', () => { isDragging = true; });
    document.addEventListener('touchend', () => { isDragging = false; });

    minInp.addEventListener('input', (e) => {
        minInp.style.zIndex = '3';
        maxInp.style.zIndex = '2';
        update(e);
    });

    maxInp.addEventListener('input', (e) => {
        maxInp.style.zIndex = '3';
        minInp.style.zIndex = '2';
        update(e);
    });

    const restoreZIndex = () => {
        if (!isDragging) {
            minInp.style.zIndex = '3';
            maxInp.style.zIndex = '2';
        }
    };

    minInp.addEventListener('mouseup', restoreZIndex);
    maxInp.addEventListener('mouseup', restoreZIndex);
    minInp.addEventListener('touchend', restoreZIndex);
    maxInp.addEventListener('touchend', restoreZIndex);

    update();
}

async function fetchFilteredTariffs() {
    const filterData = getFilterData();

    const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(filterData)
    });

    const data = await response.json();

    if (data.success) {
        render(data.data);
    }
    else {
        console.log(data.error);
    }
}

function getFilterData() {
    const filterData = {
        min_price: parseInt(document.getElementById('price-min').value),
        max_price: parseInt(document.getElementById('price-max').value),
        min_gb: parseInt(document.getElementById('gb-min').value),
        max_gb: parseInt(document.getElementById('gb-max').value),
        min_minutes: parseInt(document.getElementById('min-min').value),
        max_minutes: parseInt(document.getElementById('min-max').value),
        min_sms: parseInt(document.getElementById('sms-min').value),
        max_sms: parseInt(document.getElementById('sms-max').value),
        operators: [],
        unlimited_messengers: false,
        unlimited_social: false,
        unlimited_video: false,
        unlimited_music: false
    };

    const activeOperators = document.querySelectorAll('.operator-btn.active');

    activeOperators.forEach(btn => {
        const op = btn.dataset.operator;
        if (op) {
            filterData.operators.push(op);
        }
    });

    const unlimitedTypes = ['messengers', 'social', 'video', 'music'];
    unlimitedTypes.forEach(type => {
        const checkbox = document.querySelector(`input[name="unlimited_${type}"]`);
        if (checkbox && checkbox.checked) {
            filterData[`unlimited_${type}`] = true;
        }
    });

    return filterData;
}

function render(data) {
    const tariffGrid = document.querySelector('.tariff-grid');
    const template = document.getElementById('tariff-template');

    if (!tariffGrid || !template) {
        return;
    }

    tariffGrid.innerHTML = '';

    const getOperatorLogo = (operator) => {
        const logos = {
            'mts': 'М',
            'beeline': 'Б',
            'megafon': 'М',
            'tele2': 'T2',
            'yota': 'Y'
        };
        return logos[operator] || operator.charAt(0).toUpperCase();
    };

    data.forEach(t => {
        const clone = template.content.cloneNode(true);

        const operatorNameEl = clone.querySelector('.js-operator-name');
        const nameEl = clone.querySelector('.js-name');
        const priceEl = clone.querySelector('.js-price');
        const operatorLogoEl = clone.querySelector('.js-operator-logo');

        if (nameEl) nameEl.textContent = t.name;
        if (priceEl) priceEl.textContent = t.price;

        if (operatorLogoEl) {
            operatorLogoEl.textContent = getOperatorLogo(t.operator);
            operatorLogoEl.className = `operator-logo js-operator-logo ${t.operator}`;
        }

        const gbEl = clone.querySelector('.js-gb-value');
        if (gbEl) {
            if (t.gb > 50) {
                gbEl.classList.add('unlimited');
            } else {
                gbEl.textContent = t.gb;
                gbEl.classList.remove('unlimited');
            }
        }

        const minutesEl = clone.querySelector('.js-minutes-value');
        if (minutesEl) {
            if (t.minutes > 2000) {
                minutesEl.classList.add('unlimited');
            } else {
                minutesEl.textContent = t.minutes;
                minutesEl.classList.remove('unlimited');
            }
        }

        const smsEl = clone.querySelector('.js-sms-value');
        if (smsEl) {
            if (t.sms > 1200) {
                smsEl.classList.add('unlimited');
            } else {
                smsEl.textContent = t.sms;
                smsEl.classList.remove('unlimited');
            }
        }

        const extrasContainer = clone.querySelector('.js-extras');
        if (extrasContainer) {
            extrasContainer.innerHTML = '';
            if (t.unlimited_messengers) {
                extrasContainer.innerHTML += '<span class="extra-tag">💬 Мессенджеры</span>';
            }
            if (t.unlimited_social) {
                extrasContainer.innerHTML += '<span class="extra-tag">📱 Соцсети</span>';
            }
            if (t.unlimited_video) {
                extrasContainer.innerHTML += '<span class="extra-tag">🎥 Видео</span>';
            }
            if (t.unlimited_music) {
                extrasContainer.innerHTML += '<span class="extra-tag">🎵 Музыка</span>';
            }
        }

        const link = clone.querySelector('.js-compare-link');
        if (link) link.href = `/compare?id=${t.id}`;

        tariffGrid.appendChild(clone);
    });
}

function initFilters() {
    const sliders = ['price-min', 'price-max', 'gb-min', 'gb-max', 'min-min', 'min-max', 'sms-min', 'sms-max'];
    sliders.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', async () => {
                await fetchFilteredTariffs();
            });
        }
    });

    const unlimitedCheckboxes = document.querySelectorAll('input[name^="unlimited_"]');
    unlimitedCheckboxes.forEach(cb => {
        cb.addEventListener('change', async () => {
            await fetchFilteredTariffs();
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    createDualSlider('price-min', 'price-max', 'price-track', 'price-min-val', 'price-max-val', '₽', 3100);
    createDualSlider('gb-min', 'gb-max', 'gb-track', 'gb-min-val', 'gb-max-val', 'ГБ', 51);
    createDualSlider('min-min', 'min-max', 'min-track', 'min-min-val', 'min-max-val', 'мин', 2010);
    createDualSlider('sms-min', 'sms-max', 'sms-track', 'sms-min-val', 'sms-max-val', 'шт', 1205);

    initFilters();

    await fetchFilteredTariffs();

    const operatorButtons = document.querySelectorAll('.operator-btn');
    operatorButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            btn.classList.toggle('active');
            await fetchFilteredTariffs();
        });
    });
});