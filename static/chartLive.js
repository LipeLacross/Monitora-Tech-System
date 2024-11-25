let liveChart; // Gráfico ao vivo
let liveMode = true; // Controle do modo ao vivo
let currentLiveType = 'vazao'; // Tipo atual do gráfico (vazao ou altura)

// Função para buscar leituras ao vivo ou filtradas
async function fetchLiveReadings(filter = 'live', minute = '', type = 'vazao') {
    let query = `/api/leituras?filter=${filter}&type=${type}`;
    if (minute) query += `&minute=${minute}`;

    try {
        const response = await fetch(query);
        if (!response.ok) throw new Error(`Erro ao buscar leituras (${type}): ${response.statusText}`);
        const data = await response.json();
        return data.map(item => ({ ...item, value: type === 'altura' ? item.altura : item.vazao }));
    } catch (error) {
        console.error(`Erro ao buscar leituras (${type}):`, error);
        return [];
    }
}

// Função para definir linhas de segurança ao vivo
function getLiveSafetyLines(type) {
    if (type === 'altura') {
        return [
            { yMin: 2, yMax: 2, borderColor: 'blue', label: { content: 'Limite Inferior', enabled: true } },
            { yMin: 5, yMax: 5, borderColor: 'green', label: { content: 'Limite Superior', enabled: true } },
            { yMin: 8, yMax: 8, borderColor: 'red', label: { content: 'Limite Crítico', enabled: true } }
        ];
    } else if (type === 'vazao') {
        return [
            { yMin: 5, yMax: 5, borderColor: 'blue', label: { content: 'Limite Inferior', enabled: true } },
            { yMin: 10, yMax: 10, borderColor: 'green', label: { content: 'Limite Superior', enabled: true } },
            { yMin: 15, yMax: 15, borderColor: 'red', label: { content: 'Limite Crítico', enabled: true } }
        ];
    }
    return [];
}

// Função para calcular média móvel
function calcularMediaMovelLive(data, janela = 3) {
    return data.map((_, i, arr) => {
        const slice = arr.slice(Math.max(0, i - janela + 1), i + 1);
        return slice.reduce((a, b) => a + b, 0) / slice.length;
    });
}

// Função para renderizar gráfico ao vivo
async function renderLiveChart(minute = null, type = 'vazao') {
    const filter = minute ? 'minute' : 'live';
    const readings = await fetchLiveReadings(filter, minute, type);

    if (readings.length === 0) {
        alert('Nenhum dado disponível para o filtro aplicado.');
        return;
    }

    const labels = readings.map(item => item.data);
    const data = readings.map(item => item.value);

    const ctx = document.getElementById('liveChart').getContext('2d');

    if (liveChart) liveChart.destroy();

    const showSafetyLines = document.getElementById('toggleLiveSafetyLines').checked;
    const annotations = showSafetyLines ? getLiveSafetyLines(type) : [];

    liveChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.slice(-10), // Exibe os últimos 10 dados
            datasets: [
                {
                    label: `${type === 'altura' ? 'Altura' : 'Vazão'} ao Vivo`,
                    data: data.slice(-10), // Exibe os últimos 10 dados
                    borderColor: type === 'altura' ? 'orange' : 'blue',
                    backgroundColor: type === 'altura' ? 'rgba(255, 165, 0, 0.2)' : 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 1,
                    fill: false,
                },
                {
                    label: 'Média Móvel',
                    data: calcularMediaMovelLive(data.slice(-10), 3),
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderWidth: 1,
                    fill: false,
                },
            ],
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: type === 'altura' ? 'Altura (m)' : 'Vazão (m³/s)',
                    },
                },
                x: {
                    title: { display: true, text: 'Data' },
                },
            },
            plugins: {
                annotation: {
                    annotations: annotations.reduce((acc, line, index) => {
                        acc[`line${index}`] = {
                            type: 'line',
                            yMin: line.yMin,
                            yMax: line.yMax,
                            borderColor: line.borderColor,
                            borderWidth: 2,
                            label: line.label,
                        };
                        return acc;
                    }, {}),
                },
            },
        },
    });

    await fillLiveTable(minute, type);
}

// Função para preencher tabela ao vivo
async function fillLiveTable(minute = null, type = 'vazao') {
    const filter = minute ? 'minute' : 'live';
    const readings = await fetchLiveReadings(filter, minute, type);

    const tableBody = document.querySelector('#liveTable tbody');
    tableBody.innerHTML = ''; // Limpa a tabela

    readings.slice(-10).forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.id_leitura}</td>
            <td>${item.value}</td>
            <td>${item.data}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Alternar entre gráficos ao vivo
document.getElementById('liveSwitchToHeight').addEventListener('click', async () => {
    currentLiveType = 'altura';
    liveMode = true;
    await renderLiveChart(null, currentLiveType);
});

document.getElementById('liveSwitchToVazao').addEventListener('click', async () => {
    currentLiveType = 'vazao';
    liveMode = true;
    await renderLiveChart(null, currentLiveType);
});

// Aplicar filtro de minuto
document.getElementById('applyMinuteFilter').addEventListener('click', async () => {
    const minute = document.getElementById('specificMinuteInput').value;

    if (!minute) {
        alert('Selecione um minuto válido.');
        return;
    }

    // Converte o minuto para o formato HH:MM
    const formattedMinute = new Date(minute).toTimeString().slice(0, 5);

    liveMode = false; // Pausa o modo ao vivo
    await renderLiveChart(formattedMinute, currentLiveType);
});

// Remover filtro de minuto
document.getElementById('removeMinuteFilter').addEventListener('click', async () => {
    liveMode = true;
    await renderLiveChart(null, currentLiveType);
});

// Atualização automática no modo ao vivo
setInterval(async () => {
    if (liveMode) await renderLiveChart(null, currentLiveType);
}, 5000);

// Inicializar gráfico ao vivo
window.onload = async function () {
    await renderLiveChart(null, currentLiveType);
};
