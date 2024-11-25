let liveChart;
let liveMode = true;

// Função para buscar leituras de vazao com base em filtros
async function fetchLeiturasLive(filter = 'live', minute = '') {
    let query = `/api/leituras?filter=${filter}`;
    if (minute) query += `&minute=${minute}`;

    try {
        const response = await fetch(query);
        if (!response.ok) throw new Error(`Erro ao buscar leituras: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

// Função para calcular média móvel
function calcularMediaMovelLive(data, janela = 3) {
    const media = [];
    for (let i = 0; i < data.length; i++) {
        if (i < janela - 1) {
            media.push(null);
        } else {
            const avg = data.slice(i - janela + 1, i + 1).reduce((a, b) => a + b, 0) / janela;
            media.push(avg);
        }
    }
    return media;
}

// Função para definir linhas de segurança
function getSafetyLinesLive() {
    return [
        {
            type: 'line',
            yMin: 5,
            yMax: 5,
            borderColor: 'blue',
            borderWidth: 2,
            label: {
                content: 'Limite Inferior de Segurança',
                enabled: true,
                position: 'start'
            }
        },
        {
            type: 'line',
            yMin: 10,
            yMax: 10,
            borderColor: 'green',
            borderWidth: 2,
            label: {
                content: 'Limite Superior de Segurança',
                enabled: true,
                position: 'start'
            }
        },
        {
            type: 'line',
            yMin: 15,
            yMax: 15,
            borderColor: 'red',
            borderWidth: 2,
            label: {
                content: 'Limite de Transbordamento',
                enabled: true,
                position: 'start'
            }
        }
    ];
}

// Evento para selecionar um minuto específico
document.getElementById('specificMinuteBtn').addEventListener('click', async () => {
    const specificMinuteInput = document.getElementById('specificMinuteInput').value;
    if (specificMinuteInput) {
        const minute = specificMinuteInput.slice(0, 16);
        await renderLiveChartLive(minute);
        await fillLiveTableLive(minute);
        liveMode = false;
    } else {
        alert('Por favor, selecione um minuto específico.');
    }
});

// Evento para remover o filtro de minuto e voltar ao modo ao vivo
document.getElementById('removeMinuteFilter').addEventListener('click', async () => {
    await renderLiveChartLive();
    await fillLiveTableLive();
    liveMode = true;
});

// Função para renderizar o gráfico ao vivo
async function renderLiveChartLive(minute = null) {
    // Salva a posição atual do scroll
    const scrollPosition = window.scrollY;

    const leituras = minute ? await fetchLeiturasLive('minute', minute) : await fetchLeiturasLive('live');

    if (leituras.length === 0) {
        alert('Nenhum dado disponível para o filtro aplicado.');
        return;
    }

    const labels = leituras.map(leitura => leitura.data);
    const data = leituras.map(leitura => leitura.valor);

    const last12Data = data.slice(-12);
    const last12Labels = labels.slice(-12);

    const ctx = document.getElementById('liveChart').getContext('2d');

    if (liveChart) liveChart.destroy();

    const showSafetyLines = document.getElementById('toggleLiveSafetyLines').checked;
    const annotations = showSafetyLines ? getSafetyLinesLive() : [];

    liveChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last12Labels,
            datasets: [
                {
                    label: 'Vazão ao Vivo (m³/s) ou Minuto Específico',
                    data: last12Data,
                    borderColor: 'blue',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 1,
                    fill: false
                },
                {
                    label: 'Média Móvel',
                    data: calcularMediaMovelLive(last12Data, 3),
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderWidth: 1,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Vazão em m³/s'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Data'
                    },
                    ticks: {
                        autoSkip: false
                    }
                }
            },
            plugins: {
                annotation: {
                    annotations: annotations
                }
            }
        }
    });

    await fillLiveTableLive(minute);

    // Restaura a posição do scroll
    window.scrollTo(0, scrollPosition);
}


// Função para preencher a tabela com leituras de vazao
async function fillLiveTableLive(minute = null) {
    const leituras = minute ? await fetchLeiturasLive('minute', minute) : await fetchLeiturasLive('live');

    const tableBody = document.querySelector('#liveTable tbody');
    tableBody.innerHTML = ''; // Limpa a tabela antes de preencher

    const last12Leituras = minute ? leituras : leituras.slice(-12);

    last12Leituras.forEach(leitura => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${leitura.id_leitura}</td>
            <td>${leitura.valor}</td>
            <td>${leitura.data}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Atualiza automaticamente o gráfico ao vivo se o modo ao vivo estiver ativado
setInterval(async () => {
    if (liveMode) {
        await renderLiveChartLive();
    }
}, 5000);

// Renderiza o gráfico inicial com os dados ao vivo
window.onload = async function() {
    await renderLiveChartLive();
};
