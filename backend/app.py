import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__)
CORS(app)

db_config = {
    'host': 'localhost',
    'user': 'screenless_user',
    'password': 'screenless',
    'database': 'screenless'
}

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

    except mysql.connector.IntegrityError:
        return jsonify({"erro": "Usuário ou CPF já existe"}), 400

    except Exception as e:
        return jsonify({"erro": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

# Rota de login
@app.route("/api/login", methods=["POST"])
def login_usuario():
    data = request.json
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        sql = "SELECT * FROM USUARIO WHERE usuario = %s"
        cursor.execute(sql, (data['usuario'],))
        user = cursor.fetchone()

        if user and check_password_hash(user["senha"], data["senha"]):
            return jsonify({
                "mensagem": "Login bem-sucedido",
                "usuario": user["usuario"],
                "nome": user["nome"]
            }), 200
        else:
            return jsonify({"erro": "Usuário ou senha inválidos"}), 401

    except Exception as e:
        return jsonify({"erro": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# Rota para criar evento
@app.route("/api/criar_evento", methods=["POST"])
def criar_evento():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        titulo = request.form['titulo']
        organizador = request.form['organizador']
        endereco = request.form['endereco']
        data = request.form['data']
        hora = request.form['hora']
        descricao = request.form['descricao']
        foto = request.files.get('foto')
        nome_arquivo = None
        nome_seguro = None 

        if foto and allowed_file(foto.filename):
            nome_seguro = secure_filename(foto.filename)
            nome_arquivo = os.path.join(app.config['UPLOAD_FOLDER'], nome_seguro)
            foto.save(nome_arquivo)

        data_hora_evento = f"{data} {hora}:00"

        sql = """
        INSERT INTO EVENTO (titulo, organizador, endereco, data_hora, descricao, foto )
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        values = (titulo, organizador, endereco, data_hora_evento, descricao, nome_seguro)
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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)