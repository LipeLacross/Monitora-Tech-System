import sqlite3
from datetime import datetime
import random
import time
import threading

def get_db_connection():
    """Conexão com o banco de dados SQLite."""
    conn = sqlite3.connect('monitora.db')
    conn.row_factory = sqlite3.Row
    return conn

def criacao_tabela_leituras():
    """Criação da tabela de leituras."""
    try:
        with get_db_connection() as conn:
            conn.execute(''' 
                CREATE TABLE IF NOT EXISTS leituras (
                    id_leitura INTEGER PRIMARY KEY AUTOINCREMENT,
                    data DATETIME NOT NULL UNIQUE,
                    altura FLOAT NOT NULL,
                    vazao FLOAT NOT NULL
                )
            ''')
            conn.commit()
    except sqlite3.Error as e:
        print(f"Erro ao criar a tabela leituras: {e}")
        raise

def inserir_leitura(altura, vazao, data=None):
    """Insere uma nova leitura na tabela."""
    data = data or datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    try:
        with get_db_connection() as conn:
            conn.execute(''' 
                INSERT INTO leituras (data, altura, vazao)
                VALUES (?, ?, ?)
            ''', (data, altura, vazao))
            conn.commit()
    except sqlite3.IntegrityError:
        print(f"Leitura com data {data} já existe, ignorando...")
    except sqlite3.Error as e:
        print(f"Erro ao inserir leitura: {e}")
        raise

def listar_leituras(filter_type='all', date=None, start_date=None, end_date=None, month=None, year=None, limit=None):
    """Lista leituras da tabela com filtros opcionais."""
    with get_db_connection() as conn:
        query = 'SELECT * FROM leituras'
        params = []

        if filter_type == 'dia' and date:
            query += ' WHERE DATE(data) = ?'
            params.append(date)
        elif filter_type == 'semana' and start_date and end_date:
            query += ' WHERE DATE(data) BETWEEN ? AND ?'
            params.extend([start_date, end_date])
        elif filter_type == 'mes' and month and year:
            start_date = f"{year}-{int(month):02d}-01"
            next_month = int(month) + 1
            next_month_year = year
            if next_month > 12:
                next_month = 1
                next_month_year += 1
            end_date = f"{next_month_year}-{next_month:02d}-01"
            query += ' WHERE DATE(data) BETWEEN ? AND ?'
            params.extend([start_date, end_date])

        # Adiciona ordenação e limite
        query += ' ORDER BY data DESC'
        if limit:
            query += ' LIMIT ?'
            params.append(limit)

        leituras = conn.execute(query, params).fetchall()

        # Formata a data no padrão brasileiro
        return [
            {
                **dict(leitura),
                'data': datetime.strptime(leitura['data'], '%Y-%m-%d %H:%M:%S').strftime('%d/%m/%Y %H:%M:%S')
            }
            for leitura in leituras
        ]

def filtrar_por_minuto(minute):
    """Filtra leituras que ocorreram em um minuto específico."""
    try:
        with get_db_connection() as conn:
            start_time = f"{minute}:00"  # Início do minuto
            end_time = f"{minute}:59"  # Fim do minuto

            print(f"Filtrando leituras entre {start_time} e {end_time}")  # Log do intervalo

            query = '''
                SELECT * FROM leituras
                WHERE TIME(data) BETWEEN ? AND ?
                ORDER BY data ASC
            '''
            leituras = conn.execute(query, (start_time, end_time)).fetchall()

            print(f"Leituras encontradas: {leituras}")  # Log dos dados encontrados

            if not leituras:
                print(f"Nenhum dado encontrado para o minuto: {minute}")

            return [
                {
                    **dict(leitura),
                    'data': datetime.strptime(leitura['data'], '%Y-%m-%d %H:%M:%S').strftime('%d/%m/%Y %H:%M:%S')
                } for leitura in leituras
            ]
    except Exception as e:
        print(f"Erro ao filtrar por minuto: {str(e)}")
        raise

def buscar_usuario_por_nome_ou_email(identificador):
    """Busca um usuário pelo nome ou email."""
    with get_db_connection() as conn:
        return conn.execute(
            'SELECT * FROM Usuarios WHERE nome = ? OR Email = ?', (identificador, identificador)
        ).fetchone()

def gerar_dados_continuo(intervalo=10):
    """Gera e insere dados automaticamente na tabela a cada `intervalo` segundos."""
    while True:
        altura = round(random.uniform(1, 10), 2)
        vazao = round(random.uniform(5, 15), 2)
        data_atual = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        try:
            inserir_leitura(altura, vazao, data_atual)
            print(f"Dados gerados em {data_atual} - Altura: {altura} m, Vazão: {vazao} m³/s")
        except sqlite3.IntegrityError:
            print(f"Dados com data {data_atual} já existem, tentando novamente...")
        time.sleep(intervalo)

# Exemplo de uso
if __name__ == "__main__":
    criacao_tabela_leituras()
    while True:
        # Mantém o programa principal rodando
        time.sleep(1)

#gerar_dados_continuo()  # Inicia a geração de dados em segundo plano
