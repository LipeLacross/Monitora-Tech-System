let chart;

// Função para buscar leituras de vazao com base em filtros
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
    console.log(leituras); // Log para verificar se as leituras estão sendo recebidas

    if (leituras.length === 0) {
        console.warn('Nenhum dado disponível para o filtro aplicado.');
        return;
    }

    const labels = leituras.map(leitura => leitura.data);
    const data = leituras.map(leitura => leitura.valor);

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

    // Calcula a média dos dados dentro de cada intervalo
    const { mediaData, mediaLabels } = calcularMediaPorIntervalo(data, labels, intervalo);

    const ctx = document.getElementById('leiturasChart').getContext('2d');

    if (chart) chart.destroy();

    const showSafetyLines = document.getElementById('toggleSafetyLines').checked;
    const annotations = showSafetyLines ? getSafetyLines() : [];

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: mediaLabels,
            datasets: [
                {
                    label: 'Vazão (m³/s)',
                    data: mediaData,
                    borderColor: 'blue',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
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

// Configurar o valor padrão da data para hoje
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000; // Calcula o offset em milissegundos
    const localDate = new Date(today.getTime() - offset); // Ajusta a data para o fuso horário local
    const formattedDate = localDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    document.getElementById('date').value = formattedDate; // Definir o valor do campo de data para hoje

    // Renderiza o gráfico inicial com os dados do dia
    renderChart('dia', formattedDate); // Passa a data de hoje para a função renderChart
});
