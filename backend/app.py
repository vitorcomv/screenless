import jwt
import datetime
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify, send_from_directory
from functools import wraps

SECRET_KEY = 'screenlesskey'

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
            request.foto_url = dados.get('foto_url', None)
        except jwt.ExpiredSignatureError:
            return jsonify({'erro': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'erro': 'Token inválido'}), 401
        return f(*args, **kwargs)
    return decorator

app = Flask(__name__)
CORS(app)

app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')

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

        sql = "SELECT Id_USUARIO AS id, nome, sobrenome, usuario, senha, foto_perfil FROM USUARIO WHERE usuario = %s"
        cursor.execute(sql, (data['usuario'],))
        user = cursor.fetchone()

        if user and check_password_hash(user["senha"], data["senha"]):
            # Construir URL completa da foto se existir
            foto_url = None
            if user.get("foto_perfil"):
                foto_url = f"http://localhost:5000/uploads/{user['foto_perfil']}"
            
            token = jwt.encode({
                'id': user["id"],
                'usuario': user["usuario"],
                'nome': user["nome"],
                'sobrenome': user["sobrenome"],
                'foto_url': foto_url,  # Mudança aqui: usar foto_url em vez de foto_perfil
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
            }, SECRET_KEY, algorithm="HS256")
            
            return jsonify({
                "mensagem": "Login bem-sucedido",
                "usuario": user["usuario"],
                "nome": user["nome"],
                "token": token,
                "foto_url": foto_url  # Mudança aqui: usar foto_url
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

@app.route('/api/excluir_evento/<int:evento_id>', methods=['DELETE'])
@token_obrigatorio
def excluir_evento(evento_id):
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        user_id = request.usuario_id

        # Primeiro, exclui registros relacionados ao evento na tabela HISTORICO_EVENTO
        cursor.execute("""
            DELETE FROM HISTORICO_EVENTO
            WHERE ID_EVENTO = %s
        """, (evento_id,))

        # Depois, exclui o evento apenas se o usuário for o criador
        cursor.execute("""
            DELETE FROM EVENTO
            WHERE ID_EVENTO = %s AND ID_USUARIO_CRIADOR = %s
        """, (evento_id, user_id))

        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"erro": "Evento não encontrado ou sem permissão"}), 404

        return jsonify({"mensagem": "Evento excluído com sucesso"}), 200

    except Exception as e:
        print("Erro ao excluir evento:", e)
        return jsonify({"erro": "Erro interno"}), 500

    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

# Rota para inscrever o usuário em um desafio
@app.route("/api/inscrever_desafio", methods=["POST"])
@token_obrigatorio
def inscrever_desafio():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        id_usuario = request.usuario_id 
        desafio_id = request.form.get('desafio_id')

        if not desafio_id:
            return jsonify({"erro": "ID do desafio é obrigatório"}), 400

        sql = """
        INSERT INTO HISTORICO_DESAFIO (ID_USUARIO, ID_DESAFIO)
        VALUES (%s, %s)
        """
        cursor.execute(sql, (id_usuario, desafio_id))
        conn.commit()

        return jsonify({"mensagem": "Inscrição no desafio realizada com sucesso!"}), 201

    except mysql.connector.IntegrityError as e:
        if e.errno == 1062:
            return jsonify({"erro": "Você já está inscrito neste desafio."}), 409
        return jsonify({"erro": "Erro de integridade ao tentar se inscrever no desafio.", "detalhes": str(e)}), 400

    except Exception as e:
        return jsonify({"erro": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()


@app.route("/api/desafios_criados", methods=["GET"])
@token_obrigatorio
def desafios_criados():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True) # Retorna dicionários para fácil acesso aos nomes das colunas

        id_usuario = request.usuario_id

        # Adapte a query para a sua estrutura de tabela de desafios
        # Certifique-se de selecionar as colunas Titulo, Descricao, XP, foto, ID_DESAFIO
        sql = """
        SELECT d.ID_DESAFIO, d.Titulo, d.Descricao, d.XP, d.foto,
       (SELECT Nome FROM USUARIO WHERE ID_USUARIO = d.ID_USUARIO) AS nome_usuario -- MUDANÇA AQUI: d.ID_USUARIO
        FROM DESAFIOS d
        WHERE d.ID_USUARIO = %s -- MUDANÇA AQUI: d.ID_USUARIO
        ORDER BY d.ID_DESAFIO DESC;
        """
        cursor.execute(sql, (id_usuario,))
        desafios = cursor.fetchall()

        return jsonify(desafios), 200

    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

# Rota para buscar desafios em que o usuário está inscrito
@app.route("/api/desafios_inscritos", methods=["GET"])
@token_obrigatorio
def desafios_inscritos():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True) # Retorna dicionários

        id_usuario = request.usuario_id

        sql = """
        SELECT d.ID_DESAFIO, d.Titulo, d.Descricao, d.XP, d.foto,
       (SELECT Nome FROM USUARIO WHERE ID_USUARIO = d.ID_USUARIO) AS nome_usuario -- MUDANÇA AQUI: d.ID_USUARIO
        FROM DESAFIOS d
        JOIN HISTORICO_DESAFIO hd ON d.ID_DESAFIO = hd.ID_DESAFIO
        WHERE hd.ID_USUARIO = %s
        ORDER BY d.ID_DESAFIO DESC;
        """
        cursor.execute(sql, (id_usuario,))
        desafios = cursor.fetchall()

        return jsonify(desafios), 200

    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

# Rota para cancelar inscrição em desafio
@app.route("/api/cancelar_inscricao_desafio", methods=["DELETE"])
@token_obrigatorio
def cancelar_inscricao_desafio():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        id_usuario = request.usuario_id
        desafio_id = request.args.get('desafio_id') # Recebe via query parameter

        if not desafio_id:
            return jsonify({"erro": "ID do desafio é obrigatório"}), 400

        sql = """
        DELETE FROM HISTORICO_DESAFIO
        WHERE ID_USUARIO = %s AND ID_DESAFIO = %s
        """
        cursor.execute(sql, (id_usuario, desafio_id))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"erro": "Inscrição não encontrada ou já cancelada."}), 404

        return jsonify({"mensagem": "Inscrição cancelada com sucesso!"}), 200

    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

# Rota para editar um desafio (PUT)
@app.route("/api/editar_desafio/<int:desafio_id>", methods=["PUT"])
@token_obrigatorio
def editar_desafio(desafio_id):
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        id_usuario = request.usuario_id

        # Verifica se o usuário logado é o criador do desafio
        cursor.execute("SELECT ID_USUARIO FROM DESAFIOS WHERE ID_DESAFIO = %s", (desafio_id,))
        criador = cursor.fetchone()
        if not criador or criador[0] != id_usuario:
            return jsonify({"erro": "Você não tem permissão para editar este desafio."}), 403

        titulo = request.form.get("titulo")
        descricao = request.form.get("descricao")
        xp = request.form.get("xp")
        foto_file = request.files.get("foto") # Se for enviado um novo arquivo de foto

        updates = []
        params = []

        if titulo:
            updates.append("Titulo = %s")
            params.append(titulo)
        if descricao:
            updates.append("Descricao = %s")
            params.append(descricao)
        if xp is not None: # xp pode ser 0, então verifique por None
            updates.append("XP = %s")
            params.append(xp)

        if foto_file:
            # Lógica para salvar a nova foto no servidor e obter o nome do arquivo
            # Certifique-se de ter uma pasta 'uploads' e a lógica para salvar arquivos
            filename = secure_filename(foto_file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            foto_file.save(filepath)
            updates.append("foto = %s")
            params.append(filename)

        if not updates:
            return jsonify({"erro": "Nenhum dado para atualizar."}), 400

        sql = f"UPDATE DESAFIOS SET {', '.join(updates)} WHERE ID_DESAFIO = %s"
        params.append(desafio_id)

        cursor.execute(sql, tuple(params))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"erro": "Desafio não encontrado ou nenhum dado alterado."}), 404

        return jsonify({"mensagem": "Desafio atualizado com sucesso!"}), 200

    except Exception as e:
        print(f"Erro ao editar desafio: {e}") # Adicione um log mais detalhado para depuração
        return jsonify({"erro": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# Rota para excluir um desafio (DELETE)
@app.route("/api/excluir_desafio/<int:desafio_id>", methods=["DELETE"])
@token_obrigatorio
def excluir_desafio(desafio_id):
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        id_usuario = request.usuario_id

        # Primeiro, verifica se o usuário logado é o criador do desafio
        cursor.execute("SELECT ID_USUARIO FROM DESAFIOS WHERE ID_DESAFIO = %s", (desafio_id,))
        criador = cursor.fetchone()
        if not criador or criador[0] != id_usuario:
            return jsonify({"erro": "Você não tem permissão para excluir este desafio."}), 403

        # Excluir entradas relacionadas em HISTORICO_DESAFIO primeiro (devido à chave estrangeira)
        cursor.execute("DELETE FROM HISTORICO_DESAFIO WHERE ID_DESAFIO = %s", (desafio_id,))
        conn.commit() # Commit das exclusões do histórico

        # Em seguida, exclui o desafio principal
        cursor.execute("DELETE FROM DESAFIOS WHERE ID_DESAFIO = %s", (desafio_id,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"erro": "Desafio não encontrado ou já excluído."}), 404

        return jsonify({"mensagem": "Desafio excluído com sucesso!"}), 200

    except Exception as e:
        print(f"Erro ao excluir desafio: {e}") # Adicione um log para depuração
        return jsonify({"erro": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

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

# Rota para Meu Perfil
@app.route('/api/perfil', methods=['GET'])
@token_obrigatorio
def obter_perfil():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        usuario_id = request.usuario_id

        cursor.execute("SELECT nome, sobrenome, email, telefone, usuario, CPF, foto_perfil FROM USUARIO WHERE Id_USUARIO = %s", (usuario_id,))
        usuario = cursor.fetchone()

        if not usuario:
            return jsonify({"erro": "Usuário não encontrado"}), 404

        cpf = usuario["CPF"]
        cpf_mascarado = f"{'*'*3}.{ '*'*3 }.{cpf[6]}{cpf[7]}-{cpf[9:11]}"
        usuario["CPF"] = cpf_mascarado
        
        # Adicionar URL completa da foto
        if usuario["foto_perfil"]:
            usuario["foto_url"] = f"http://localhost:5000/uploads/{usuario['foto_perfil']}"
        else:
            usuario["foto_url"] = None

        return jsonify(usuario), 200

    except Exception as e:
        print("Erro ao buscar perfil:", e)
        return jsonify({"erro": "Erro interno"}), 500

    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

@app.route('/api/perfil', methods=['PUT'])
@token_obrigatorio
def atualizar_perfil():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        usuario_id = request.usuario_id

        nome = request.form.get("nome")
        sobrenome = request.form.get("sobrenome")
        email = request.form.get("email")
        telefone = request.form.get("telefone")
        usuario_nome = request.form.get("usuario")
        foto = request.files.get("foto_perfil")
        nome_foto = None

        if foto and allowed_file(foto.filename):
            nome_seguro = secure_filename(foto.filename)
            nome_foto = os.path.join(app.config['UPLOAD_FOLDER'], nome_seguro)
            foto.save(nome_foto)
            nome_foto = nome_seguro

        if nome_foto:
            sql = """
                UPDATE USUARIO SET nome=%s, sobrenome=%s, email=%s, telefone=%s, usuario=%s, foto_perfil=%s
                WHERE Id_USUARIO=%s
            """
            values = (nome, sobrenome, email, telefone, usuario_nome, nome_foto, usuario_id)
        else:
            sql = """
                UPDATE USUARIO SET nome=%s, sobrenome=%s, email=%s, telefone=%s, usuario=%s
                WHERE Id_USUARIO=%s
            """
            values = (nome, sobrenome, email, telefone, usuario_nome, usuario_id)

        cursor.execute(sql, values)
        conn.commit()

        resposta = {"mensagem": "Perfil atualizado com sucesso"}
        if nome_foto:
            resposta["foto_url"] = f"http://localhost:5000/uploads/{nome_foto}"  # URL completa

        return jsonify(resposta), 200

    except mysql.connector.IntegrityError as e:
        error_message = str(e).lower()

        if "for key 'usuario.email'" in error_message:
            return jsonify({"erro": "Email já cadastrado"}), 400
        elif "for key 'usuario.usuario'" in error_message:
            return jsonify({"erro": "Nome de usuário já está em uso"}), 400
        elif "for key 'usuario.telefone'" in error_message:
            return jsonify({"erro": "Telefone já cadastrado"}), 400
        else:
            return jsonify({"erro": "Erro ao atualizar perfil: " + str(e)}), 400

    except Exception as e:
        print("Erro ao atualizar perfil:", e)
        return jsonify({"erro": "Erro interno"}), 500

    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

# CORREÇÃO PARA ELASTIC BEANSTALK
application = app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)