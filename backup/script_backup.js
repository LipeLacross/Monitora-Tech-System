let chart;  // Gráfico principal
let liveChart;  // Gráfico ao vivo
let liveMode = true;  // Controle para modo ao vivo

// Função para buscar leituras com base em filtros
async function fetchLeituras(filter = 'dia', date = '', startDate = '', endDate = '', month = '', year = '', limit = 12, page = 1, minute = '') {
    let query = `/api/leituras?filter=${filter}&limit=${limit}&page=${page}`;

    if (date) query += `&date=${date}`;
    if (startDate) query += `&start_date=${startDate}`;
    if (endDate) query += `&end_date=${endDate}`;
    if (month) query += `&month=${month}`;
    if (year) query += `&year=${year}`;
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

// Função para formatar data e hora no padrão brasileiro
function formatDateToBR(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
}

// Função para calcular média móvel
function calcularMediaMovel(data, janela) {
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

// Função para renderizar o gráfico principal
async function renderChart(filter = 'dia', date = '', startDate = '', endDate = '', month = '', year = '', minute = '') {
    const leituras = await fetchLeituras(filter, date, startDate, endDate, month, year, 12);

    if (leituras.length === 0) {
        console.warn('Nenhum dado disponível para o filtro aplicado.');
        return;
    }

    const labels = leituras.map(leitura => formatDateToBR(leitura.data));
    const data = leituras.map(leitura => leitura.valor);
    const movingAverage = calcularMediaMovel(data, 3);  // Janela de 3

    const ctx = document.getElementById('leiturasChart').getContext('2d');
    const showSafetyLines = document.getElementById('toggleSafetyLines').checked;

    // Destruir gráfico anterior, se existir
    if (chart) {
        chart.destroy();
    }

    const annotations = showSafetyLines ? getSafetyLines() : [];

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Vazão (m³/s)',
                    data: data,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 1,
                },
                {
                    label: 'Média Móvel',
                    data: movingAverage,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderWidth: 1,
                    fill: false,
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

// Função para definir linhas de segurança
function getSafetyLines() {
    return [
        {
            type: 'line',
            yMin: 5,  // Limite inferior de segurança
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
            yMin: 10,  // Limite superior de segurança
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
            yMin: 15,  // Limite de transbordamento
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

// Função para renderizar o gráfico ao vivo ou específico
async function renderLiveChart(minute = null) {
    let leituras;
    if (minute) {
        leituras = await fetchLeituras('minute', '', '', '', '', '', 12, 1, minute);
        liveMode = false;
    } else {
        leituras = await fetchLiveLeituras();
        liveMode = true;
    }

    const labels = leituras.map(leitura => formatDateToBR(leitura.data));
    const data = leituras.map(leitura => leitura.valor);
    const movingAverage = calcularMediaMovel(data, 3); // Janela de 3

    const ctx = document.getElementById('liveChart').getContext('2d');

    // Destruir gráfico anterior, se existir
    if (liveChart) {
        liveChart.destroy();
    }

    liveChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Vazão ao Vivo (m³/s)',
                    data: data,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 1,
                },
                {
                    label: 'Média Móvel',
                    data: movingAverage,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderWidth: 1,
                    fill: false,
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
                    }
                }
            },
            plugins: {
                annotation: {
                    annotations: []
                }
            }
        }
    });

    // Atualiza a tabela
    fillLiveTable(minute);
}

// Função para preencher a tabela com leituras
async function fillLiveTable(minute = null) {
    let leituras;
    if (minute) {
        leituras = await fetchLeituras('minute', '', '', '', '', '', 12, 1, minute);
    } else {
        leituras = await fetchLiveLeituras();
    }

    const tableBody = document.querySelector('#liveTable tbody');
    tableBody.innerHTML = ''; // Limpa a tabela antes de preencher

    leituras.forEach(leitura => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${leitura.id_leitura}</td>
            <td>${leitura.valor}</td>
            <td>${formatDateToBR(leitura.data)}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Funções para dados ao vivo
async function fetchLiveLeituras() {
    return await fetchLeituras('live', '', '', '', '', '', 12);
}

// Função para iniciar a atualização ao vivo
async function startLiveUpdate() {
    if (liveMode) {
        await renderLiveChart(); // Renderiza o gráfico ao vivo
    }

    // Atualiza os gráficos e a tabela a cada 5 segundos, apenas em modo ao vivo
    setInterval(async () => {
        if (liveMode) {
            await renderLiveChart();
        }
    }, 5000);
}

// Função para aplicar filtro de minuto específico
document.getElementById('specificMinuteBtn').addEventListener('click', async () => {
    const specificMinuteInput = document.getElementById('specificMinuteInput').value;
    if (specificMinuteInput) {
        const minute = new Date(specificMinuteInput).toISOString();
        await renderLiveChart(minute);
    } else {
        alert('Por favor, selecione um minuto específico.');
    }
});

// Função para remover filtro de minuto e voltar ao modo ao vivo
document.getElementById('removeMinuteFilter').addEventListener('click', async () => {
    await renderLiveChart();  // Volta ao modo ao vivo
});

// Função para enviar nova leitura
document.getElementById('sendButton').addEventListener('click', function () {
    const vazaoValue = document.getElementById('vazaoInput').value;
    const dataValue = document.getElementById('dataInput').value;
    const horaValue = document.getElementById('horaInput').value;

    if (vazaoValue && dataValue && horaValue) {
        const dataHora = `${dataValue}T${horaValue}:00`;  // Combina data e hora para o padrão ISO
        sendVazao(parseFloat(vazaoValue), dataHora);  // Envia a vazão e a data/hora
    }
});

// Função para enviar a vazão ao servidor
async function sendVazao(number, dataHora) {
    try {
        const response = await fetch('/receive', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ valor: number, data: dataHora })
        });

        if (response.ok) {
            alert('Leitura enviada com sucesso!');
            // Atualiza gráficos e tabelas após o envio
            await renderLiveChart();
        } else {
            alert('Erro ao enviar leitura.');
        }
    } catch (error) {
        console.error('Erro ao enviar leitura:', error);
        alert('Erro ao enviar leitura.');
    }
}

// Função para download dos dados
document.getElementById('downloadButton').addEventListener('click', async () => {
    const downloadDate = document.getElementById('downloadDate').value;

    if (downloadDate) {
        window.location.href = `/download?date=${downloadDate}`;
    } else {
        alert('Por favor, selecione uma data para download.');
    }
});

// Função para aplicar filtro no gráfico principal
document.getElementById('applyFilter').addEventListener('click', async () => {
    const filter = document.getElementById('filter').value;
    const date = document.getElementById('date').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const month = document.getElementById('month').value;
    const year = document.getElementById('year').value;

    await renderChart(filter, date, startDate, endDate, month, year);
});

// Função para remover filtro no gráfico principal
document.getElementById('removeFilter').addEventListener('click', async () => {
    await renderChart('dia'); // Restaura o gráfico com filtro padrão
});

// Inicia o sistema de monitoramento ao carregar a página
window.onload = async function () {
    await startLiveUpdate();
    await renderChart('dia'); // Renderiza o gráfico padrão
};
