let chart;

// Função para buscar leituras com base em filtros
async function fetchLeituras(filter = 'dia', date = '', startDate = '', endDate = '', month = '', year = '') {
    let query = `/api/leituras?filter=${filter}`;
    if (date) query += `&date=${date}`;
    if (startDate) query += `&start_date=${startDate}`;
    if (endDate) query += `&end_date=${endDate}`;
    if (month) query += `&month=${month}`;
    if (year) query += `&year=${year}`;

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
function calcularMediaMovel(data, janela = 3) {
    const media = [];
    for (let i = 0; i < data.length; i++) {
        if (i < janela - 1) {
            media.push(null); // Sem média móvel para os primeiros elementos
        } else {
            const avg = data.slice(i - janela + 1, i + 1).reduce((a, b) => a + b, 0) / janela;
            media.push(avg);
        }
    }
    return media;
}

// Função para definir linhas de segurança
function getSafetyLines() {
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

// Função para amostrar os dados (downsampling) com base no tipo de filtro
function amostrarDados(data, labels, intervalo) {
    const sampledData = [];
    const sampledLabels = [];

    for (let i = 0; i < data.length; i += intervalo) {
        sampledData.push(data[i]);
        sampledLabels.push(labels[i]);
    }

    return { sampledData, sampledLabels };
}

// Evento para aplicar filtros
document.getElementById('applyFilter').addEventListener('click', async () => {
    const filter = document.getElementById('filter').value;
    const date = document.getElementById('date').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const month = document.getElementById('month').value;
    const year = document.getElementById('year').value;

    if (filter === 'dia' && !date) {
        alert('Por favor, selecione uma data.');
        return;
    } else if (filter === 'semana' && (!startDate || !endDate)) {
        alert('Por favor, selecione as datas de início e fim.');
        return;
    } else if (filter === 'mes' && (!month || !year)) {
        alert('Por favor, selecione o mês e o ano.');
        return;
    }

    await renderChart(filter, date, startDate, endDate, month, year);
});

// Evento para remover filtros e renderizar o gráfico com os dados do dia atual
document.getElementById('removeFilter').addEventListener('click', async () => {
    document.getElementById('date').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('month').value = '';
    document.getElementById('year').value = '';

    await renderChart('dia');
});

// Função para renderizar o gráfico principal
async function renderChart(filter, date, startDate, endDate, month, year) {
    const leituras = await fetchLeituras(filter, date, startDate, endDate, month, year);
    if (leituras.length === 0) {
        console.warn('Nenhum dado disponível para o filtro aplicado.');
        return;
    }

    const labels = leituras.map(leitura => leitura.data);
    const data = leituras.map(leitura => leitura.valor);

    // Define o intervalo de amostragem com base no tipo de filtro
    let intervalo;
    if (filter === 'dia') {
        intervalo = 60; // Um ponto por hora
    } else if (filter === 'semana') {
        intervalo = 720; // Um ponto a cada 12 horas
    } else if (filter === 'mes') {
        intervalo = 1440; // Um ponto por dia
    } else {
        intervalo = 1; // Sem amostragem adicional
    }

    // Amostra os dados para otimizar a visualização
    const { sampledData, sampledLabels } = amostrarDados(data, labels, intervalo);

    const ctx = document.getElementById('leiturasChart').getContext('2d');

    if (chart) chart.destroy();

    const showSafetyLines = document.getElementById('toggleSafetyLines').checked;
    const annotations = showSafetyLines ? getSafetyLines() : [];

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sampledLabels,
            datasets: [
                {
                    label: 'Vazão (m³/s)',
                    data: sampledData,
                    borderColor: 'blue',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 1,
                    fill: false
                },
                {
                    label: 'Média Móvel',
                    data: calcularMediaMovel(sampledData, 3),
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
}

// Renderiza o gráfico inicial com os dados do dia
window.onload = async function() {
    await renderChart('dia');
};
