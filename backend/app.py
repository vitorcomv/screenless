import jwt
import datetime
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from functools import wraps
from dotenv import load_dotenv
load_dotenv()

# Definindo a chave secreta para o JWT
SECRET_KEY = 'screenlesskey'

# Decorador para verificar se o token JWT é válido
def token_obrigatorio(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].replace("Bearer ", "")
        if not token:
            return jsonify({'erro': 'Token não fornecido'}), 401
        try:
            dados = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            request.usuario_id = dados['id']
            request.usuario_nome = dados['usuario']
            request.nome = dados['nome']
            request.sobrenome = dados['sobrenome']
        except jwt.ExpiredSignatureError:
            return jsonify({'erro': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'erro': 'Token inválido'}), 401
        return f(*args, **kwargs)
    return decorator

app = Flask(__name__)
CORS(app)


# Configuração do banco de dados usando variáveis de ambiente
db_config = {
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT")),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASS"),
    "database": os.getenv("DB_NAME")
}

print("Conectando ao banco:", db_config['host'])

# Configuração do diretório de upload
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route("/api/mensagem")
def mensagem():
    return jsonify({"mensagem": "API rodando!"})

# Rota de cadastro
@app.route("/api/registro", methods=["POST"])
def registrar_usuario():
    data = request.json
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        hashed_password = generate_password_hash(data['senha'])

        sql = """
        INSERT INTO USUARIO (nome, sobrenome, CPF, telefone, usuario, senha, email)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            data['nome'], data['sobrenome'], data['cpf'], data['telefone'],
            data['usuario'], hashed_password, data['email']
        )
        cursor.execute(sql, values)
        conn.commit()
        return jsonify({"mensagem": "Usuário registrado com sucesso!"}), 201

    except mysql.connector.IntegrityError as e:
        error_message = str(e).lower()

        if "for key 'usuario.cpf'" in error_message:
            return jsonify({"erro": "CPF já cadastrado"}), 400
        elif "for key 'usuario.usuario'" in error_message:
            return jsonify({"erro": "Nome de usuário já está em uso"}), 400
        elif "for key 'usuario.email'" in error_message:
            return jsonify({"erro": "Email já cadastrado"}), 400
        elif "for key 'usuario.telefone'" in error_message:
            return jsonify({"erro": "Telefone já cadastrado"}), 400
        else:
            return jsonify({"erro": "Erro ao registrar usuário: " + str(e)}), 400

    except Exception as e:
        return jsonify({"erro": "Erro no servidor: " + str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# Rota de login
@app.route("/api/login", methods=["POST"])
def login_usuario():
    data = request.json
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        sql = "SELECT Id_USUARIO AS id, nome, sobrenome, usuario, senha FROM USUARIO WHERE usuario = %s"
        cursor.execute(sql, (data['usuario'],))
        user = cursor.fetchone()

        if user and check_password_hash(user["senha"], data["senha"]):
            token = jwt.encode({
                'id': user["id"],
                'usuario': user["usuario"],
                'nome': user["nome"],
                'sobrenome': user["sobrenome"],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
            }, SECRET_KEY, algorithm="HS256")
            return jsonify({
                "mensagem": "Login bem-sucedido",
                "usuario": user["usuario"],
                "nome": user["nome"],
                "token": token
            }), 200
        else:
            return jsonify({"erro": "Usuário ou senha inválidos"}), 401

    except Exception as e:
        return jsonify({"erro": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# Rota para criar evento
@app.route("/api/criar_evento", methods=["POST"])
@token_obrigatorio
def criar_evento():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        titulo = request.form['titulo']
        organizador = f"{request.nome} {request.sobrenome}"  # Substitui o input do frontend
        endereco = request.form['endereco']
        data = request.form['data']
        hora = request.form['hora']
        descricao = request.form['descricao']
        foto = request.files.get('foto')
        nome_arquivo = None
        nome_seguro = None
        id_usuario = request.usuario_id     # Para preencher a FK

        if foto and allowed_file(foto.filename):
            nome_seguro = secure_filename(foto.filename)
            nome_arquivo = os.path.join(app.config['UPLOAD_FOLDER'], nome_seguro)
            foto.save(nome_arquivo)

        data_hora_evento = f"{data} {hora}:00"

        sql = """
        INSERT INTO EVENTO (titulo, organizador, endereco, data_hora, descricao, foto, ID_USUARIO_CRIADOR)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        values = (titulo, organizador, endereco, data_hora_evento, descricao, nome_seguro, id_usuario)
        cursor.execute(sql, values)
        conn.commit()
        return jsonify({"mensagem": "Evento criado com sucesso!"}), 201

    except Exception as e:
        return jsonify({"erro": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

# Rota para obter todos os eventos
@app.route("/api/eventos", methods=["GET"])
def obter_eventos():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        sql = "SELECT ID_EVENTO, titulo, organizador, endereco, DATE_FORMAT(data_hora, '%d/%m/%Y às %H:%i') AS data_hora, descricao, foto FROM EVENTO"
        cursor.execute(sql)
        eventos = cursor.fetchall()

        return jsonify(eventos), 200

    except Exception as e:
        return jsonify({"erro": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

# Rota para criar desafio
@app.route("/api/criar_desafio", methods=["POST"])
@token_obrigatorio
def criar_desafio():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        # Obter os dados do formulário
        nome_usuario = request.usuario_nome
        titulo = request.form['titulo']
        descricao = request.form['descricao']
        xp = int(request.form['xp'])
        foto = request.files.get('foto')
        nome_arquivo = None
        nome_seguro = None 

        # Salvar a foto se for fornecida
        if foto and allowed_file(foto.filename):
            nome_seguro = secure_filename(foto.filename)
            nome_arquivo = os.path.join(app.config['UPLOAD_FOLDER'], nome_seguro)
            foto.save(nome_arquivo)

        id_usuario = request.usuario_id

        # Inserir o desafio na tabela DESAFIOS
        sql = """
        INSERT INTO DESAFIOS (ID_USUARIO, nome_usuario, Titulo, Descricao, XP, foto)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        values = (id_usuario, nome_usuario, titulo, descricao, xp, nome_seguro)
        cursor.execute(sql, values)
        conn.commit()

        return jsonify({"mensagem": "Desafio criado com sucesso!"}), 201

    except Exception as e:
        return jsonify({"erro": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

# Rota para obter todos os desafios
@app.route("/api/desafios", methods=["GET"])
def obter_desafios():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Buscar todos os desafios
        sql = """
        SELECT ID_DESAFIO, nome_usuario, Titulo, Descricao, XP, foto 
        FROM DESAFIOS
        """
        cursor.execute(sql)
        desafios = cursor.fetchall()

        return jsonify(desafios), 200

    except Exception as e:
        return jsonify({"erro": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()
            
# Rota para inscrever o usuário em um evento
@app.route("/api/inscrever_evento", methods=["POST"])
@token_obrigatorio
def inscrever_evento():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        id_usuario = request.usuario_id  # Vem do token
        evento_id = request.form.get('evento_id')

        if not evento_id:
            return jsonify({"erro": "ID do evento é obrigatório"}), 400

        sql = """
        INSERT INTO HISTORICO_EVENTO (ID_USUARIO, ID_EVENTO)
        VALUES (%s, %s)
        """
        cursor.execute(sql, (id_usuario, evento_id))
        conn.commit()

        return jsonify({"mensagem": "Inscrição realizada com sucesso!"}), 201

    except mysql.connector.IntegrityError as e:
        # Código 1062 = entrada duplicada (violação de UNIQUE)
        if e.errno == 1062:
            return jsonify({"erro": "Você já está inscrito neste evento."}), 409
        return jsonify({"erro": "Erro de integridade ao tentar se inscrever."}), 400

    except Exception as e:
        return jsonify({"erro": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

@app.route("/api/meus_eventos", methods=["GET"])
@token_obrigatorio
def meus_eventos():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        id_usuario = request.usuario_id

        query = """
        SELECT ID_EVENTO
        FROM HISTORICO_EVENTO
        WHERE ID_USUARIO = %s
        """
        cursor.execute(query, (id_usuario,))
        inscritos = cursor.fetchall()

        # Retorna apenas uma lista de IDs de eventos
        eventos_ids = [item["ID_EVENTO"] for item in inscritos]
        return jsonify(eventos_ids)

    except Exception as e:
        return jsonify({"erro": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

#Rotas para Meus Eventos
@app.route("/api/eventos_criados", methods=["GET"])
@token_obrigatorio
def eventos_criados():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        sql = "SELECT * FROM EVENTO WHERE ID_USUARIO_CRIADOR = %s"
        cursor.execute(sql, (request.usuario_id,))
        eventos = cursor.fetchall()
        return jsonify(eventos)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

@app.route("/api/eventos_inscritos", methods=["GET"])
@token_obrigatorio
def eventos_inscritos():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        sql = """
        SELECT E.*
        FROM EVENTO E
        JOIN HISTORICO_EVENTO H ON E.ID_EVENTO = H.ID_EVENTO
        WHERE H.ID_USUARIO = %s
        """
        cursor.execute(sql, (request.usuario_id,))
        eventos = cursor.fetchall()
        return jsonify(eventos)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

@app.route('/api/cancelar_inscricao', methods=['DELETE'])
@token_obrigatorio
def cancelar_inscricao():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        user_id = request.usuario_id
        evento_id = request.args.get("evento_id")

        if not evento_id:
            return jsonify({"erro": "ID do evento não fornecido"}), 400

        cursor.execute("DELETE FROM HISTORICO_EVENTO WHERE ID_USUARIO = %s AND ID_EVENTO = %s", (user_id, evento_id))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"erro": "Inscrição não encontrada"}), 404

        return jsonify({"mensagem": "Inscrição cancelada com sucesso"}), 200

    except Exception as e:
        print("Erro ao cancelar inscrição:", e)
        return jsonify({"erro": "Erro interno"}), 500

    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

@app.route('/api/editar_evento/<int:evento_id>', methods=['PUT'])
@token_obrigatorio
def editar_evento(evento_id):
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        user_id = request.usuario_id

        titulo = request.form.get("titulo")
        descricao = request.form.get("descricao")
        endereco = request.form.get("endereco")
        data_hora = request.form.get("data_hora")
        foto = request.files.get("foto")
        nome_foto = None

        if not all([titulo, descricao, endereco, data_hora]):
            return jsonify({"erro": "Todos os campos são obrigatórios"}), 400

        if foto and allowed_file(foto.filename):
            nome_seguro = secure_filename(foto.filename)
            nome_foto = os.path.join(app.config['UPLOAD_FOLDER'], nome_seguro)
            foto.save(nome_foto)
            nome_foto = nome_seguro  # Apenas o nome salvo no DB

            cursor.execute("""
                UPDATE EVENTO
                SET TITULO = %s, DESCRICAO = %s, ENDERECO = %s, DATA_HORA = %s, FOTO = %s
                WHERE ID_EVENTO = %s AND ID_USUARIO_CRIADOR = %s
            """, (titulo, descricao, endereco, data_hora, nome_foto, evento_id, user_id))
        else:
            cursor.execute("""
                UPDATE EVENTO
                SET TITULO = %s, DESCRICAO = %s, ENDERECO = %s, DATA_HORA = %s
                WHERE ID_EVENTO = %s AND ID_USUARIO_CRIADOR = %s
            """, (titulo, descricao, endereco, data_hora, evento_id, user_id))

        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"erro": "Evento não encontrado ou sem permissão"}), 404

        return jsonify({"mensagem": "Evento atualizado com sucesso"}), 200

    except Exception as e:
        print("Erro ao editar evento:", e)
        return jsonify({"erro": "Erro interno"}), 500

    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

# Rota para criar um relato (modificado)
@app.route("/api/criar_relato", methods=["POST"])
def criar_relato():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        titulo = request.json.get('titulo')  
        relato_texto = request.json.get('relato')
        user_id = request.json.get('user_id') 

        if not all([titulo, relato_texto, user_id]):
            return jsonify({"erro": "Dados incompletos para criar o relato."}), 400

        sql = """
        INSERT INTO RELATO (ID_USUARIO, titulo, texto, data_criacao)
        VALUES (%s, %s, %s, NOW())
        """
        values = (user_id, titulo, relato_texto)
        cursor.execute(sql, values)
        conn.commit()
        return jsonify({"mensagem": "Relato criado com sucesso!"}), 201

    except Exception as e:
        return jsonify({"erro": "Erro ao criar relato: " + str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

# Rota para obter todos os relatos
@app.route("/api/relatos", methods=["GET"])
def obter_relatos():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        sql = """
        SELECT r.ID_RELATO, r.titulo, r.texto, r.data_criacao, u.usuario AS nome_usuario
        FROM RELATO r
        JOIN USUARIO u ON r.ID_USUARIO = u.ID_USUARIO
        ORDER BY r.data_criacao DESC
        """
        cursor.execute(sql)
        relatos = cursor.fetchall()

        # Formatar a data para exibição
        for relato in relatos:
            if relato['data_criacao']:
                relato['data_criacao'] = relato['data_criacao'].strftime('%d/%m/%Y')

        return jsonify(relatos), 200

    except Exception as e:
        return jsonify({"erro": "Erro ao obter relatos: " + str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

            
@app.route("/")
def index():
    return jsonify({"mensagem": "Backend da API Screenless ativo!"})

# CORREÇÃO PARA ELASTIC BEANSTALK
application = app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv('PORT', 5000)), debug=False)
