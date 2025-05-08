import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Configuração do banco de dados (mantenha a sua)
db_config = {
    'host': 'localhost',
    'user': 'screenless_user',
    'password': 'screenless',
    'database': 'screenless'
}

# Pasta para salvar as imagens (certifique-se de que ela existe)
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Lista de extensões de arquivo permitidas
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Teste de rota (mantenha a sua)
@app.route("/api/mensagem")
def mensagem():
    return jsonify({"mensagem": "API rodando!"})

# Rota de cadastro (mantenha a sua)
@app.route("/api/registro", methods=["POST"])
def registrar_usuario():
    # ... (seu código de registro)
    pass

# Rota de login (mantenha a sua)
@app.route("/api/login", methods=["POST"])
def login_usuario():
    # ... (seu código de login)
    pass

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
        imagem = request.files.get('imagem')
        nome_arquivo = None
        nome_seguro = None  # Inicialize nome_seguro com None

        if imagem and allowed_file(imagem.filename):
            nome_seguro = secure_filename(imagem.filename)
            nome_arquivo = os.path.join(app.config['UPLOAD_FOLDER'], nome_seguro)
            imagem.save(nome_arquivo)

        # Combine data e hora no formato 'YYYY-MM-DD HH:MM:SS'
        data_hora_evento = f"{data} {hora}:00"  # Adiciona segundos (opcional)

        sql = """
        INSERT INTO EVENTO (titulo, organizador, endereco, data_hora, descricao, foto)
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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)