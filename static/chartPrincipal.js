let chart;
let currentType = 'vazao'; // Tipo padrão do gráfico (vazao ou altura)

async function fetchLeituras(filter = 'dia', date = '', startDate = '', endDate = '', month = '', year = '', type = 'vazao') {
    let query = `/api/leituras?filter=${filter}`;
    if (date) query += `&date=${date}`;
    if (startDate) query += `&start_date=${startDate}`;
    if (endDate) query += `&end_date=${endDate}`;
    if (month) query += `&month=${month}`;
    if (year) query += `&year=${year}`;
    query += `&type=${type}`;  // Adiciona o tipo ao endpoint

    try {
        const response = await fetch(query);
        if (!response.ok) throw new Error(`Erro ao buscar leituras: ${response.statusText}`);
        const data = await response.json();
        return data.map(item => ({
            ...item,
            value: type === 'altura' ? item.altura : item.vazao
        }));
    } catch (error) {
        console.error(error);
        return [];
    }
}

// Função para calcular a média dos dados dentro de intervalos específicos
function calcularMediaPorIntervalo(data, labels, intervalo) {
    const mediaData = [];
    const mediaLabels = [];

    for (let i = 0; i < data.length; i += intervalo) {
        const sliceData = data.slice(i, i + intervalo);
        const media = sliceData.reduce((acc, val) => acc + val, 0) / sliceData.length;
        mediaData.push(media);
        mediaLabels.push(labels[i]); // Pega o primeiro label do intervalo como representativo
    }

    return { mediaData, mediaLabels };
}

// Função para calcular média móvel
function calcularMediaMovel(data, janela = 3) {
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
function getSafetyLines(type) {
    if (type === 'altura') {
        return [
            { yMin: 5, yMax: 5, borderColor: 'blue', label: { content: 'Limite Inferior', enabled: true } },
            { yMin: 10, yMax: 10, borderColor: 'green', label: { content: 'Limite Superior', enabled: true } },
            { yMin: 15, yMax: 15, borderColor: 'red', label: { content: 'Limite Crítico', enabled: true } }
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

    await renderChart(filter, date, startDate, endDate, month, year, currentType);
});

// Evento para remover filtros e renderizar o gráfico com os dados do dia atual
document.getElementById('removeFilter').addEventListener('click', async () => {
    document.getElementById('date').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('month').value = '';
    document.getElementById('year').value = '';

    await renderChart('dia', '', '', '', '', '', currentType);
});

// Função para renderizar o gráfico principal
async function renderChart(filter, date, startDate, endDate, month, year, type = 'vazao') {
    const leituras = await fetchLeituras(filter, date, startDate, endDate, month, year, type);

    if (leituras.length === 0) {
        console.warn('Nenhum dado disponível para o filtro aplicado.');
        return;
    }

    const labels = leituras.map(leitura => leitura.data);
    const data = leituras.map(leitura => leitura.value);

    // Define o intervalo de amostragem com base no tipo de filtro e calcula a média
    let intervalo;
    if (filter === 'dia') {
        intervalo = 60; // Um ponto por hora
    } else if (filter === 'semana') {
        intervalo = 720; // Um ponto a cada 12 horas
    } else if (filter === 'mes') {
        intervalo = 1440; // Um ponto por dia
    } else {
        intervalo = 1;
    }

    const { mediaData, mediaLabels } = calcularMediaPorIntervalo(data, labels, intervalo);

    const ctx = document.getElementById('leiturasChart').getContext('2d');

    if (chart) chart.destroy();

    const showSafetyLines = document.getElementById('toggleSafetyLines').checked;
    const annotations = showSafetyLines ? getSafetyLines(type) : [];
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: mediaLabels,
            datasets: [
                {
                    label: `${type === 'altura' ? 'Altura (m)' : 'Vazão (m³/s)'}`,
                    data: mediaData,
                    borderColor: type === 'altura' ? 'orange' : 'blue',
                    backgroundColor: type === 'altura' ? 'rgba(255, 165, 0, 0.2)' : 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 1,
                    fill: false
                },
                {
                    label: 'Média Móvel',
                    data: calcularMediaMovel(mediaData, 3),
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
                        text: type === 'altura' ? 'Altura (m)' : 'Vazão (m³/s)'
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
                    annotations: annotations.reduce((acc, line, index) => {
                        acc[`line${index}`] = {
                            type: 'line',
                            yMin: line.yMin,
                            yMax: line.yMax,
                            borderColor: line.borderColor,
                            borderWidth: 2,
                            label: line.label
                        };
                        return acc;
                    }, {})
                }
            }
        }
    });

}

// Alternar entre gráficos
document.getElementById('switchToHeight').addEventListener('click', async () => {
    currentType = 'altura';
    await renderChart('dia', '', '', '', '', '', currentType);
});

document.getElementById('switchToVazao').addEventListener('click', async () => {
    currentType = 'vazao';
    await renderChart('dia', '', '', '', '', '', currentType);
});

// Configurar o valor padrão da data para hoje
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const localDate = new Date(today.getTime() - offset);
    const formattedDate = localDate.toISOString().split('T')[0];
    document.getElementById('date').value = formattedDate;

    // Renderiza o gráfico inicial com os dados do dia
    renderChart('dia', formattedDate, '', '', '', '', currentType);
});
