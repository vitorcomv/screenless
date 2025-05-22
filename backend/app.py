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
CORS(app,
     origins=["http://screenless-frontend.s3-website-us-east-1.amazonaws.com"],
     methods=["GET", "POST", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"])

# Configuração do banco de dados usando variáveis de ambiente
db_config = {
    'host': os.getenv('DB_HOST'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASS'),
    'database': os.getenv('DB_NAME'),
    'port': 40640
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
            
@app.route("/")
def index():
    return jsonify({"mensagem": "Backend da API Screenless ativo!"})

# CORREÇÃO PARA ELASTIC BEANSTALK
application = app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv('PORT', 5000)), debug=False)
