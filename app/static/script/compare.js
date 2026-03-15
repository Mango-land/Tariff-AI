async function initComparison() {
    const response = await fetch('/api/tariffs');
    const data = await response.json();

    const ctx = document.getElementById('compareChart').getContext('2d');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(t => t.name),
            datasets: [{
                label: 'Price ($)',
                data: data.map(t => t.price),
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                borderColor: 'rgba(37, 99, 235, 1)',
                borderWidth: 2
            }, {
                label: 'Data (GB)',
                data: data.map(t => t.data_gb === 999 ? 200 : t.data_gb),
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
        }
    });

    const list = document.getElementById('comparisonList');
    list.innerHTML = data.map(t => `
        <div class="p-4 bg-white rounded shadow-sm border-l-4 border-blue-500">
            <p class="font-bold">${t.name}</p>
            <p class="text-sm text-slate-500">${t.provider} — ${t.speed_mbps}Mbps</p>
        </div>
    `).join('');
}

initComparison();