let heightChart;
let heightLiveMode = true;

// Função para buscar leituras de altura com base em filtros
async function fetchHeightReadingsLive(filter = 'live', minute = '') {
    let query = `/api/leituras_altura?filter=${filter}`;
    if (minute) query += `&minute=${minute}`;

    try {
        const response = await fetch(query);
        if (!response.ok) throw new Error(`Erro ao buscar leituras: ${response.statusText}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching height readings:", error);
        return [];
    }
}

// Função para calcular média móvel de altura
function calcularMediaMovelAltura(data, janela = 3) {
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

// Função para definir linhas de segurança para altura
function getSafetyLinesHeight() {
    return [
        {
            type: 'line',
            yMin: 2,
            yMax: 2,
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
            yMin: 5,
            yMax: 5,
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
            yMin: 8,
            yMax: 8,
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
document.getElementById('specificMinuteHeightBtn').addEventListener('click', async () => {
    const specificMinuteInput = document.getElementById('specificMinuteHeightInput').value;
    if (specificMinuteInput) {
        const minute = specificMinuteInput.slice(0, 16);
        await renderHeightLiveChart(minute);
        await fillHeightLiveTable(minute);
        heightLiveMode = false;
    } else {
        alert('Por favor, selecione um minuto específico.');
    }
});

// Evento para remover o filtro de minuto e voltar ao modo ao vivo
document.getElementById('removeHeightMinuteFilter').addEventListener('click', async () => {
    await renderHeightLiveChart();
    await fillHeightLiveTable();
    heightLiveMode = true;
});

// Função para renderizar o gráfico de altura ao vivo
async function renderHeightLiveChart(minute = null) {
    const scrollPosition = window.scrollY;

    const leituras = minute ? await fetchHeightReadingsLive('minute', minute) : await fetchHeightReadingsLive('live');

    if (leituras.length === 0) {
        alert('Nenhum dado disponível para o filtro aplicado.');
        return;
    }

    const labels = leituras.map(leitura => leitura.data);
    const data = leituras.map(leitura => leitura.altura);

    const last12Data = data.slice(-12);
    const last12Labels = labels.slice(-12);

    const ctx = document.getElementById('heightLiveChart').getContext('2d');

    if (heightChart) heightChart.destroy();

    const showSafetyLines = document.getElementById('toggleHeightLiveSafetyLines').checked;
    const annotations = showSafetyLines ? getSafetyLinesHeight() : [];

    heightChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last12Labels,
            datasets: [
                {
                    label: 'Altura ao Vivo (m)',
                    data: last12Data,
                    borderColor: 'blue',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 1,
                    fill: false
                },
                {
                    label: 'Média Móvel',
                    data: calcularMediaMovelAltura(last12Data, 3),
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
                        text: 'Altura em metros'
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

    await fillHeightLiveTable(minute);

    // Restaura a posição do scroll
    window.scrollTo(0, scrollPosition);
}

// Função para preencher a tabela com leituras de altura
async function fillHeightLiveTable(minute = null) {
    const leituras = minute ? await fetchHeightReadingsLive('minute', minute) : await fetchHeightReadingsLive('live');

    const tableBody = document.querySelector('#heightLiveTable tbody');
    tableBody.innerHTML = ''; // Limpa a tabela antes de preencher

    const last12Leituras = minute ? leituras : leituras.slice(-12);

    last12Leituras.forEach(leitura => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${leitura.id_leitura}</td>
            <td>${leitura.altura}</td>
            <td>${leitura.data}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Atualiza automaticamente o gráfico ao vivo se o modo ao vivo estiver ativado
setInterval(async () => {
    if (heightLiveMode) {
        await renderHeightLiveChart();
    }
}, 5000);

// Renderiza o gráfico inicial com os dados ao vivo
window.onload = async function() {
    await renderHeightLiveChart();
};
