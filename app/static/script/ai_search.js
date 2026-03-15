document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('aiSearchBtn');
    const queryInput = document.getElementById('aiQuery');
    const tariffGrid = document.getElementById('tariffGrid');
    const template = document.getElementById('tariff-template');
    const suggestionChips = document.querySelectorAll('.suggestion-chip');

    let allTariffs = [];

    async function loadTariffs() {
        try {
            const response = await fetch('/api/search');
            allTariffs = await response.json();
            displayTariffs(allTariffs);
        } catch (error) {
            console.error('Ошибка загрузки тарифов:', error);
            tariffGrid.innerHTML = '<p>Ошибка загрузки данных</p>';
        }
    }

    function displayTariffs(tariffsToDisplay) {
        tariffGrid.innerHTML = '';

        if (tariffsToDisplay.length === 0) {
            tariffGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-light);">Ничего не найдено по вашему запросу</p>';
        } else {
            tariffsToDisplay.forEach(t => {
                const clone = template.content.cloneNode(true);

                clone.querySelector('.js-operator').textContent = t.operator.toUpperCase();
                clone.querySelector('.js-name').textContent = t.name;
                clone.querySelector('.js-price').textContent = t.price;
                clone.querySelector('.js-description').textContent =
                    `${t.gb} ГБ, ${t.minutes} мин. ${t.description || ''}`;

                const compareLink = clone.querySelector('.js-compare-link');
                if (compareLink) {
                    compareLink.href = `/compare?id=${t.id}`;
                }

                tariffGrid.appendChild(clone);
            });
        }
        resultCount.textContent = `Найдено ${tariffsToDisplay.length} тарифов`;
    }

    function performSearch() {
        const query = queryInput.value.trim().toLowerCase();
        if (query === '') {
            displayTariffs(allTariffs);
            return;
        }

        const filtered = allTariffs.filter(t =>
            t.name.toLowerCase().includes(query) ||
            t.operator.toLowerCase().includes(query) ||
            (t.description && t.description.toLowerCase().includes(query))
        );
        displayTariffs(filtered);
    }

    searchBtn.addEventListener('click', performSearch);
    queryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => {
            queryInput.value = chip.textContent;
            performSearch();
        });
    });

    loadTariffs();
});