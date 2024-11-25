from flask import Flask, request, render_template, jsonify, session, redirect, url_for
import db  # Certifique-se de que db.py tenha as funções necessárias
from datetime import datetime
import csv
from io import StringIO

app = Flask(__name__)
app.secret_key = 'sua_chave_secreta_aqui'

@app.route('/')
def index():
    # Verifica se o usuário está logado
    if 'user_email' not in session:
        return redirect(url_for('login'))  # Redireciona para a página de login
    current_year = datetime.now().year
    return render_template('index.html', current_year=current_year)

@app.route('/login', methods=['GET'])
def login():
    # Se o usuário já estiver logado, redireciona para a página inicial
    if 'user_email' in session:
        return redirect(url_for('index'))
    # Renderiza a página de login se não estiver logado
    return render_template('login.html')

@app.route('/api/login', methods=['POST'])
def login_user():
    identificador = request.form.get('identificador')  # Nome ou email
    senha = request.form.get('senha')

    # Buscar o usuário pelo nome ou email
    usuario = db.buscar_usuario_por_nome_ou_email(identificador)

    if usuario and usuario['Senha'] == senha:
        session['user_email'] = usuario['Email']
        return redirect(url_for('index'))  # Redireciona para a página inicial após login bem-sucedido

    return render_template('login.html', error_message="Credenciais inválidas!")

@app.route('/logout')
def logout():
    session.pop('user_email', None)  # Remove o email da sessão
    return redirect(url_for('login'))  # Redireciona para a página de login

@app.route('/api/leituras', methods=['GET'])
def get_leituras():
    filter_type = request.args.get('filter', 'live')
    data_type = request.args.get('type', 'vazao')  # Tipo: 'altura' ou 'vazao'

    try:
        # Log de entrada
        print(f"Recebido filtro: {filter_type}, tipo de dado: {data_type}")

        if filter_type == 'live':
            leituras = db.listar_leituras(limit=10)
        elif filter_type == 'minute':
            minute = request.args.get('minute')
            print(f"Filtrando por minuto: {minute}")  # Log do minuto
            leituras = db.filtrar_por_minuto(minute)
        else:
            leituras = db.listar_leituras(filter_type=filter_type)

        if data_type == 'altura':
            leituras = [{'id_leitura': l['id_leitura'], 'data': l['data'], 'altura': l['altura']} for l in leituras]
        else:
            leituras = [{'id_leitura': l['id_leitura'], 'data': l['data'], 'vazao': l['vazao']} for l in leituras]

        print(f"Leituras retornadas: {leituras}")  # Log do retorno
        return jsonify(leituras)

    except Exception as e:
        print(f"Erro no backend: {str(e)}")  # Log de erro
        return jsonify({'error': str(e)}), 500



@app.route('/download', methods=['GET'])
def download_data():
    date = request.args.get('date')  # Captura a data dos parâmetros de URL

    if not date:
        return jsonify({'error': 'Data não fornecida!'}), 400

    try:
        # Chama a função para buscar as leituras do dia específico
        leituras = db.listar_leituras(filter_type='dia', date=date)

        # Preparar os dados para exportação em CSV
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['ID', 'Data', 'Hora', 'Altura (m)', 'Vazão (m³/s)'])  # Cabeçalhos do CSV

        # Preencher os dados, separando data e hora
        for leitura in leituras:
            data_hora = datetime.strptime(leitura['data'], '%d/%m/%Y %H:%M:%S')  # Converte para datetime
            data = data_hora.strftime('%d/%m/%Y')  # Extrai a data
            hora = data_hora.strftime('%H:%M:%S')  # Extrai a hora
            writer.writerow([leitura['id_leitura'], data, hora, leitura['altura'], leitura['vazao']])

        output.seek(0)  # Retorna o cursor ao início para leitura
        return app.response_class(
            output,
            mimetype='text/csv',
            headers={'Content-Disposition': f'attachment; filename=dados_{date}.csv'}
        )
    except Exception as e:
        return jsonify({'error': f'Erro ao gerar download: {str(e)}'}), 500


@app.route('/receive', methods=['POST'])
def receber_dados():
    try:
        # Captura os dados do formulário
        altura = request.form.get('altura')
        vazao = request.form.get('vazao')
        data_hora = request.form.get('data_hora')  # Captura data e hora juntos no formato ISO

        if not altura or not vazao or not data_hora:
            return '''
                <script>
                    alert("Erro: Altura, vazão e data/hora são obrigatórios!");
                    window.history.back();
                </script>
            '''

        # Insere os dados no banco
        db.inserir_leitura(
            altura=float(altura),
            vazao=float(vazao),
            data=data_hora
        )

        return '''
            <script>
                alert("Dados recebidos com sucesso!");
                window.location.href = "/";
            </script>
        '''
    except Exception as e:
        return f'''
            <script>
                alert("Erro ao processar a requisição: {str(e)}");
                window.history.back();
            </script>
        '''




if __name__ == '__main__':
    db.criacao_tabela_leituras()  # Criação da tabela ao iniciar a aplicação
    app.run(host='127.0.0.1', port=5000)
