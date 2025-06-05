import jwt
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify, send_from_directory
from functools import wraps
import datetime

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
            request.insignia_selecionada_id = dados.get('insignia_selecionada_id', None)
            request.insignia_icone_url = dados.get('insignia_icone_url', None)
        except jwt.ExpiredSignatureError:
            return jsonify({'erro': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'erro': 'Token inválido'}), 401
        except Exception as e:
            app.logger.error(f"Erro na decodificação do token: {str(e)}")
            return jsonify({'erro': 'Erro interno na autenticação'}), 500
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

@app.route('/uploads/<path:filename>')
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
    conn = None # Definido para garantir o escopo
    cursor = None # Definido para garantir o escopo
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # SQL modificado para incluir dados da insígnia selecionada
        sql = """
            SELECT
                u.Id_USUARIO AS id, u.nome, u.sobrenome, u.usuario, u.senha, u.foto_perfil,
                u.insignia_selecionada_id,
                i.icone_url AS insignia_icone_url_db
            FROM USUARIO u
            LEFT JOIN INSIGNIA i ON u.insignia_selecionada_id = i.ID_INSIGNIA
            WHERE u.usuario = %s
        """
        cursor.execute(sql, (data['usuario'],))
        user = cursor.fetchone()

        if user and check_password_hash(user["senha"], data["senha"]):
            foto_url_completa = None
            if user.get("foto_perfil"):
                foto_url_completa = f"http://localhost:5000/uploads/{user['foto_perfil']}" # Mantém seu padrão

            insignia_icone_url_completa = None
            if user.get("insignia_icone_url_db"):
                # Assumindo que insignia_icone_url_db é algo como "insignias/nome_icone.png"
                # e será servido pela rota /uploads/<path:filename>
                insignia_icone_url_completa = f"http://localhost:5000/uploads/{user['insignia_icone_url_db']}"

            token_payload = {
                'id': user["id"],
                'usuario': user["usuario"],
                'nome': user["nome"],
                'sobrenome': user["sobrenome"],
                'foto_url': foto_url_completa, # URL completa
                'insignia_selecionada_id': user.get('insignia_selecionada_id'), # Adicionado
                'insignia_icone_url': insignia_icone_url_completa, # Adicionado URL completa
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1) # Mantém 1 hora como no seu código
            }
            # Remove chaves com valor None se desejar, para um token mais limpo
            token_payload_final = {k: v for k, v in token_payload.items() if v is not None}

            token = jwt.encode(token_payload_final, SECRET_KEY, algorithm="HS256")

            return jsonify({
                "mensagem": "Login bem-sucedido",
                "usuario": user["usuario"], # Mantido
                "nome": user["nome"],       # Mantido
                "token": token,
                "foto_url": foto_url_completa, # Mantido
                "insignia_selecionada_id": user.get('insignia_selecionada_id'), # Adicionado
                "insignia_icone_url": insignia_icone_url_completa # Adicionado
            }), 200
        else:
            return jsonify({"erro": "Usuário ou senha inválidos"}), 401

    except Exception as e:
        # Adicionar um log do erro pode ser útil para debug
        # app.logger.error(f"Erro no login: {str(e)}")
        return jsonify({"erro": "Erro interno ao tentar fazer login: " + str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected(): # Boa prática verificar se a conexão está ativa
            conn.close()

#Rota que retorna o XP do usuário logado
@app.route('/api/usuario_xp', methods=['GET'])
@token_obrigatorio
def get_usuario_xp():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        usuario_id = request.usuario_id

        cursor.execute("SELECT xp_usuario FROM USUARIO WHERE id_usuario = %s", (usuario_id,))
        xp = cursor.fetchone()

        if xp:
            return jsonify({'xp': xp[0] or 0}), 200
        return jsonify({'erro': 'Usuário não encontrado'}), 404

    except Exception as e:
        return jsonify({'erro': str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
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

        # CORREÇÃO: Adicionado o campo Status na query
        sql = """
        SELECT 
            ID_EVENTO, 
            titulo, 
            organizador, 
            endereco, 
            DATE_FORMAT(data_hora, '%d/%m/%Y às %H:%i') AS data_hora,
            data_hora as data_hora_original,
            descricao, 
            foto,
            Status
        FROM EVENTO
        ORDER BY data_hora DESC
        """
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

#Rota para finalizar evento e distribuir XP
@app.route("/api/finalizar_evento/<int:evento_id>", methods=["POST"])
@token_obrigatorio
def finalizar_evento_e_verificar_insignias(evento_id):
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True) # Você está usando dictionary=True

        id_usuario_logado = request.usuario_id # Vem do token, geralmente é int

        # Busca dados do evento
        cursor.execute("SELECT ID_USUARIO_CRIADOR, Status, data_hora FROM EVENTO WHERE ID_EVENTO = %s", (evento_id,))
        evento = cursor.fetchone()

        if not evento:
            return jsonify({"erro": "Evento não encontrado."}), 404

        # CORREÇÃO AQUI: Acessar como dicionário
        criador_id_db = evento['ID_USUARIO_CRIADOR'] # ID_USUARIO_CRIADOR é int no DB
        status_db = evento['Status']
        data_hora_evento_db = evento['data_hora']

        # Debug: Imprimir os IDs e seus tipos para verificar
        print(f"ID do Usuário Logado (token): {id_usuario_logado}, Tipo: {type(id_usuario_logado)}")
        print(f"ID do Criador do Evento (DB): {criador_id_db}, Tipo: {type(criador_id_db)}")

        # Verifica se é o criador
        if criador_id_db != id_usuario_logado:
            return jsonify({"erro": "Você não é o criador deste evento."}), 403

        if status_db == "finalizado": # Use a variável corrigida
            return jsonify({"erro": "Evento já foi finalizado."}), 400

        data_evento = data_hora_evento_db.date() # Use a variável corrigida
        data_hoje = datetime.datetime.utcnow().date()

        if data_hoje < data_evento:
            return jsonify({"erro": "O evento só pode ser finalizado na data agendada."}), 400

        cursor.execute("UPDATE EVENTO SET Status = 'finalizado' WHERE ID_EVENTO = %s", (evento_id,))

        cursor.execute("SELECT ID_USUARIO FROM HISTORICO_EVENTO WHERE ID_EVENTO = %s", (evento_id,))
        inscritos_dicts = cursor.fetchall() # Retorna uma lista de dicionários

        xp_evento = 100
        usuarios_que_ganharam_xp_e_precisam_verificar_insignias = set()

        # CORREÇÃO AQUI: Iterar sobre lista de dicionários
        for inscrito_dict in inscritos_dicts:
            id_inscrito = inscrito_dict['ID_USUARIO']
            cursor.execute(
                "UPDATE USUARIO SET xp_usuario = IFNULL(xp_usuario, 0) + %s WHERE ID_USUARIO = %s",
                (xp_evento, id_inscrito)
            )
            usuarios_que_ganharam_xp_e_precisam_verificar_insignias.add(id_inscrito)

        conn.commit()
        
        print(f"[Integração] Evento {evento_id} finalizado. Verificando insígnias para participantes.")
        for id_usr_participante in usuarios_que_ganharam_xp_e_precisam_verificar_insignias:
            print(f"[Integração] Verificando insígnias para participante ID: {id_usr_participante} do evento {evento_id}")
            verificar_e_conceder_insignias(id_usr_participante)

        return jsonify({"mensagem": f"Evento finalizado, XP distribuído e insígnias verificadas para {len(inscritos_dicts)} usuários."}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        # É uma boa ideia logar o erro completo para debug:
        # import traceback
        # print(traceback.format_exc())
        return jsonify({"erro": f"Erro em finalizar_evento: {str(e)}"}), 500
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
        SELECT ID_DESAFIO, nome_usuario, Titulo, Descricao, XP, foto, finalizado
        FROM DESAFIOS
        WHERE Status = 'ativo' 
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

#Rota que retorna os nomes e sobrenomes dos participantes de um evento específico(talvez usaremos em um futuro)
@app.route("/api/inscritos_evento/<int:evento_id>", methods=["GET"])
@token_obrigatorio
def inscritos_evento(evento_id):
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT U.NOME, U.SOBRENOME
        FROM HISTORICO_EVENTO H
        JOIN USUARIO U ON H.ID_USUARIO = U.ID_USUARIO
        WHERE H.ID_EVENTO = %s
        """
        cursor.execute(query, (evento_id,))
        inscritos = cursor.fetchall()

        return jsonify(inscritos), 200

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

        user_id = request.usuario_id

        sql = """
        SELECT E.*, E.ID_USUARIO_CRIADOR = %s AS eCriador
        FROM EVENTO E
        JOIN HISTORICO_EVENTO H ON E.ID_EVENTO = H.ID_EVENTO
        WHERE H.ID_USUARIO = %s
        """
        cursor.execute(sql, (user_id, user_id))
        eventos = cursor.fetchall()

        return jsonify(eventos), 200

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
        SELECT d.ID_DESAFIO, d.Titulo, d.Descricao, d.XP, d.foto, d.finalizado,
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
        SELECT d.ID_DESAFIO, d.Titulo, d.Descricao, d.XP, d.foto, d.finalizado,
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

#Rota para finalizar desafio e distribuir XP
@app.route("/api/finalizar_desafio_post/<int:desafio_id>", methods=["POST"])
@token_obrigatorio
def finalizar_desafio_e_verificar_insignias(desafio_id):
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True) # Você está usando dictionary=True

        id_usuario_logado = request.usuario_id # Vem do token, geralmente é int

        cursor.execute("SELECT ID_USUARIO, XP, Status FROM DESAFIOS WHERE ID_DESAFIO = %s", (desafio_id,))
        desafio = cursor.fetchone()
        if not desafio:
            return jsonify({"erro": "Desafio não encontrado."}), 404

        # CORREÇÃO AQUI: Acessar como dicionário
        criador_id_db = desafio['ID_USUARIO'] # ID_USUARIO é int no DB
        xp_desafio_db = desafio['XP']
        status_db = desafio['Status']

        # Debug: Imprimir os IDs e seus tipos para verificar
        print(f"ID do Usuário Logado (token): {id_usuario_logado}, Tipo: {type(id_usuario_logado)}")
        print(f"ID do Criador do Desafio (DB): {criador_id_db}, Tipo: {type(criador_id_db)}")

        if criador_id_db != id_usuario_logado:
            return jsonify({"erro": "Você não é o criador deste desafio."}), 403

        if status_db == "finalizado": # Use a variável corrigida
            return jsonify({"erro": "Desafio já está finalizado."}), 400

        cursor.execute("UPDATE DESAFIOS SET Status = 'finalizado', finalizado = 1 WHERE ID_DESAFIO = %s", (desafio_id,))

        cursor.execute("SELECT ID_USUARIO FROM HISTORICO_DESAFIO WHERE ID_DESAFIO = %s", (desafio_id,))
        inscritos_dicts = cursor.fetchall() # Retorna uma lista de dicionários

        usuarios_que_ganharam_xp_e_precisam_verificar_insignias = set()

        # CORREÇÃO AQUI: Iterar sobre lista de dicionários
        for inscrito_dict in inscritos_dicts:
            id_usuario_inscrito = inscrito_dict['ID_USUARIO']
            cursor.execute(
                "UPDATE USUARIO SET xp_usuario = IFNULL(xp_usuario, 0) + %s WHERE ID_USUARIO = %s",
                (xp_desafio_db, id_usuario_inscrito) # Use a variável corrigida
            )
            usuarios_que_ganharam_xp_e_precisam_verificar_insignias.add(id_usuario_inscrito)

        conn.commit()

        print(f"[Integração] Desafio {desafio_id} finalizado. Verificando insígnias para participantes.")
        for id_usr_participante in usuarios_que_ganharam_xp_e_precisam_verificar_insignias:
            print(f"[Integração] Verificando insígnias para participante ID: {id_usr_participante} do desafio {desafio_id}")
            verificar_e_conceder_insignias(id_usr_participante)

        return jsonify({"mensagem": f"Desafio finalizado, XP distribuído e insígnias verificadas para {len(inscritos_dicts)} usuários."}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        # import traceback
        # print(traceback.format_exc())
        return jsonify({"erro": f"Erro em finalizar_desafio: {str(e)}"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

# Rota para finalizar um desafio
@app.route("/api/finalizar_desafio_put/<int:desafio_id>", methods=["PUT"])
@token_obrigatorio
def finalizar_desafio_put(desafio_id):
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        id_usuario = request.usuario_id

        # 1. Verificar se o desafio existe e se o usuário logado é o criador
        cursor.execute("SELECT ID_USUARIO FROM DESAFIOS WHERE ID_DESAFIO = %s", (desafio_id,))
        criador = cursor.fetchone()

        if not criador:
            return jsonify({"erro": "Desafio não encontrado."}), 404
        if criador[0] != id_usuario:
            return jsonify({"erro": "Você não tem permissão para finalizar este desafio."}), 403

        # 2. Atualizar o status 'finalizado' para TRUE
        sql = """
        UPDATE DESAFIOS
        SET finalizado = TRUE
        WHERE ID_DESAFIO = %s
        """
        cursor.execute(sql, (desafio_id,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"erro": "Desafio não encontrado ou já finalizado."}), 404

        return jsonify({"mensagem": "Desafio finalizado com sucesso!"}), 200

    except Exception as e:
        print(f"Erro ao finalizar desafio: {e}")
        return jsonify({"erro": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

# Rota para criar um relato (MODIFICADO E CORRIGIDO)
@app.route("/api/criar_relato", methods=["POST"])
@token_obrigatorio # <<< ADICIONAR DECORADOR PARA SEGURANÇA E CONSISTÊNCIA
def criar_relato_corrigido(): # Renomeei para clareza, pode manter o nome original
    conn = None
    cursor = None
    try:
        # AGORA PEGAMOS O ID DO USUÁRIO DO TOKEN, COMO NAS OUTRAS ROTAS
        id_usuario_criador = request.usuario_id 

        # O frontend não precisa mais enviar user_id no corpo
        titulo = request.json.get('titulo')
        relato_texto = request.json.get('relato') # Manteve 'relato' como chave para o texto

        if not all([titulo, relato_texto]): # Não precisamos mais verificar user_id aqui, pois vem do token
            return jsonify({"erro": "Título e relato são obrigatórios."}), 400

        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor() # Não precisa de dictionary=True para INSERTs simples

        sql = """
        INSERT INTO RELATO (ID_USUARIO, titulo, texto, data_criacao) 
        VALUES (%s, %s, %s, NOW()) 
        """
        # Usar id_usuario_criador obtido do token
        values = (id_usuario_criador, titulo, relato_texto) 
        cursor.execute(sql, values)
        id_novo_relato = cursor.lastrowid # Para retornar o ID do relato criado
        conn.commit()
        
        print(f"[Integração] Relato criado. Verificando insígnias para usuário ID: {id_usuario_criador}")
        novas_insignias = verificar_e_conceder_insignias(id_usuario_criador)
        if novas_insignias:
            print(f"[Integração] Usuário ID {id_usuario_criador} ganhou novas insígnias por criar relato: {novas_insignias}")
        
        # Pode ser útil retornar as novas insígnias para o frontend
        return jsonify({
            "mensagem": "Relato criado com sucesso!",
            "id_relato": id_novo_relato,
            "novas_insignias_conquistadas": novas_insignias
        }), 201

    except Exception as e:
        if conn: conn.rollback() # Adicionado rollback em caso de erro
        # import traceback
        # print(traceback.format_exc())
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

# Rota para obter APENAS os IDs dos desafios em que o usuário está inscrito
@app.route("/api/meus_desafios_ids", methods=["GET"]) # Certifique-se que esta rota existe e está correta
@token_obrigatorio
def meus_desafios_ids():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True) # Retorna dicionários

        id_usuario = request.usuario_id

        sql = """
        SELECT ID_DESAFIO
        FROM HISTORICO_DESAFIO
        WHERE ID_USUARIO = %s
        """
        cursor.execute(sql, (id_usuario,))
        inscricoes = cursor.fetchall()

        # Extrai apenas os IDs dos dicionários
        desafios_inscritos_ids = [item['ID_DESAFIO'] for item in inscricoes]

        return jsonify(desafios_inscritos_ids), 200

    except Exception as e:
        print(f"Erro ao buscar IDs de desafios inscritos: {e}")
        return jsonify({"erro": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

#Rota para Mural de Insígnias

@app.route('/api/mural-insignias', methods=['GET'])
@token_obrigatorio
def get_mural_insignias():
    id_usuario_logado = request.usuario_id
    conn = None
    cursor = None

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # 1. Buscar todas as insígnias cadastradas no sistema
        cursor.execute("SELECT ID_INSIGNIA, nome, descricao, icone_url FROM INSIGNIA")
        todas_insignias_db = cursor.fetchall()

        if not todas_insignias_db:
            return jsonify([]), 200 # Retorna lista vazia se não houver insígnias

        # 2. Buscar as IDs das insígnias conquistadas pelo usuário logado
        sql_conquistadas = "SELECT ID_INSIGNIA FROM USUARIO_INSIGNIA WHERE ID_USUARIO = %s"
        cursor.execute(sql_conquistadas, (id_usuario_logado,))
        insignias_conquistadas_raw = cursor.fetchall()
        # Criar um conjunto de IDs para busca rápida
        set_conquistadas_ids = {item['ID_INSIGNIA'] for item in insignias_conquistadas_raw}

        # 3. Obter a ID da insígnia atualmente selecionada pelo usuário
        # Podemos pegar do request (que foi populado pelo token) ou buscar no DB para garantir a info mais recente.
        # Vamos buscar no DB para garantir consistência, caso o token esteja um pouco defasado (improvável com exp de 1h, mas mais robusto).
        sql_usuario_info = "SELECT insignia_selecionada_id FROM USUARIO WHERE Id_USUARIO = %s"
        cursor.execute(sql_usuario_info, (id_usuario_logado,))
        usuario_db_info = cursor.fetchone()
        id_insignia_selecionada_pelo_usuario = usuario_db_info['insignia_selecionada_id'] if usuario_db_info else None
        # Alternativamente, você poderia usar:
        # id_insignia_selecionada_pelo_usuario = request.insignia_selecionada_id

        # 4. Montar o resultado final
        resultado_mural = []
        for insignia_db in todas_insignias_db:
            icone_url_final = None
            if insignia_db.get('icone_url'):
                # Constrói a URL completa para o ícone
                # Ex: se icone_url for "insignias/pioneiro.png", a URL será "http://localhost:5000/uploads/insignias/pioneiro.png"
                icone_url_final = f"http://localhost:5000/uploads/{insignia_db['icone_url']}"

            resultado_mural.append({
                'ID_INSIGNIA': insignia_db['ID_INSIGNIA'],
                'nome': insignia_db['nome'],
                'descricao': insignia_db['descricao'],
                'icone_url': icone_url_final, # URL completa para o frontend
                'conquistada': insignia_db['ID_INSIGNIA'] in set_conquistadas_ids,
                'selecionada': insignia_db['ID_INSIGNIA'] == id_insignia_selecionada_pelo_usuario
            })

        return jsonify(resultado_mural), 200

    except mysql.connector.Error as err_db:
        app.logger.error(f"Erro de banco de dados em /api/mural-insignias: {err_db}")
        return jsonify({'erro': f'Erro de banco de dados: {str(err_db)}'}), 500
    except Exception as e_geral:
        app.logger.error(f"Erro inesperado em /api/mural-insignias: {e_geral}")
        return jsonify({'erro': f'Erro inesperado no servidor: {str(e_geral)}'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

@app.route('/api/usuario/insignia-selecionada', methods=['PUT'])
@token_obrigatorio
def selecionar_insignia_para_usuario():
    id_usuario_logado = request.usuario_id
    dados_requisicao = request.get_json()

    if dados_requisicao is None:
        return jsonify({'erro': 'Corpo da requisição não pode ser vazio. Forneça "id_insignia".'}), 400

    # O frontend pode enviar null para desmarcar a insígnia
    id_insignia_para_selecionar = dados_requisicao.get('id_insignia') # Pode ser um int ou None

    conn = None
    cursor = None

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        nova_insignia_icone_url = None # Para retornar ao frontend

        if id_insignia_para_selecionar is not None:
            # Verificar se o ID da insígnia é um inteiro válido
            try:
                id_insignia_para_selecionar = int(id_insignia_para_selecionar)
            except ValueError:
                return jsonify({'erro': 'ID da insígnia inválido.'}), 400

            # 1. Verificar se a insígnia existe
            cursor.execute("SELECT icone_url FROM INSIGNIA WHERE ID_INSIGNIA = %s", (id_insignia_para_selecionar,))
            insignia_info = cursor.fetchone()
            if not insignia_info:
                return jsonify({'erro': 'Insígnia não encontrada no sistema.'}), 404

            # 2. Verificar se o usuário conquistou esta insígnia
            sql_check_conquista = """
                SELECT 1 FROM USUARIO_INSIGNIA
                WHERE ID_USUARIO = %s AND ID_INSIGNIA = %s
            """
            cursor.execute(sql_check_conquista, (id_usuario_logado, id_insignia_para_selecionar))
            usuario_possui_insignia = cursor.fetchone()

            if not usuario_possui_insignia:
                return jsonify({'erro': 'Você não conquistou esta insígnia para selecioná-la.'}), 403 # Forbidden

            # 3. Atualizar a insígnia selecionada do usuário
            sql_update_usuario = "UPDATE USUARIO SET insignia_selecionada_id = %s WHERE Id_USUARIO = %s"
            cursor.execute(sql_update_usuario, (id_insignia_para_selecionar, id_usuario_logado))
            
            if insignia_info.get('icone_url'):
                nova_insignia_icone_url = f"http://localhost:5000/uploads/{insignia_info['icone_url']}"
            mensagem_sucesso = "Insígnia selecionada com sucesso!"

        else:
            # Usuário quer desmarcar a insígnia (enviou id_insignia: null)
            sql_update_usuario = "UPDATE USUARIO SET insignia_selecionada_id = NULL WHERE Id_USUARIO = %s"
            cursor.execute(sql_update_usuario, (id_usuario_logado,))
            mensagem_sucesso = "Insígnia desmarcada com sucesso!"
            id_insignia_para_selecionar = None # Garante que o valor retornado seja null

        conn.commit()

        # Para atualizar o token no frontend, seria ideal que o frontend
        # fizesse um novo request de login silencioso ou atualizasse
        # o token localmente. Retornar os dados aqui ajuda o frontend
        # a atualizar o estado visual imediatamente.
        return jsonify({
            'mensagem': mensagem_sucesso,
            'insignia_selecionada_id': id_insignia_para_selecionar, # Retorna o ID ou null
            'insignia_icone_url': nova_insignia_icone_url # Retorna a URL do ícone ou null
        }), 200

    except mysql.connector.Error as err_db:
        if conn:
            conn.rollback()
        # app.logger.error(f"Erro de DB em /api/usuario/insignia-selecionada: {err_db}")
        return jsonify({'erro': f'Erro de banco de dados: {str(err_db)}'}), 500
    except Exception as e_geral:
        if conn:
            conn.rollback()
        # app.logger.error(f"Erro inesperado em /api/usuario/insignia-selecionada: {e_geral}")
        return jsonify({'erro': f'Erro inesperado no servidor: {str(e_geral)}'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

def verificar_e_conceder_insignias(id_usuario):
    conn = None
    cursor = None
    novas_insignias_conquistadas_nomes = [] # Para log ou notificação

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # 1. Obter estatísticas do usuário
        # Eventos participados
        cursor.execute("SELECT COUNT(*) AS total_eventos FROM HISTORICO_EVENTO WHERE ID_USUARIO = %s", (id_usuario,))
        stats_eventos = cursor.fetchone()['total_eventos'] or 0

        # Desafios participados/completados
        # Assumindo que HISTORICO_DESAFIO registra participação em desafios finalizados pelo usuário
        cursor.execute("SELECT COUNT(hd.ID_DESAFIO) AS total_desafios FROM HISTORICO_DESAFIO hd JOIN DESAFIOS d ON hd.ID_DESAFIO = d.ID_DESAFIO WHERE hd.ID_USUARIO = %s AND d.finalizado = TRUE", (id_usuario,))
        # Ou se 'finalizado' na tabela DESAFIOS é global e você quer contar apenas a participação:
        # cursor.execute("SELECT COUNT(*) AS total_desafios FROM HISTORICO_DESAFIO WHERE ID_USUARIO = %s", (id_usuario,))
        stats_desafios = cursor.fetchone()['total_desafios'] or 0
        
        # Relatos criados
        # Verifique se a tabela é COMUNIDADE ou RELATO para os relatos que contam para insígnias
        # Vou usar RELATO conforme seu schema inicial, ajuste se necessário.
        cursor.execute("SELECT COUNT(*) AS total_relatos FROM RELATO WHERE ID_USUARIO = %s", (id_usuario,))
        stats_relatos = cursor.fetchone()['total_relatos'] or 0

        # XP do usuário
        cursor.execute("SELECT xp_usuario FROM USUARIO WHERE Id_USUARIO = %s", (id_usuario,))
        usuario_data = cursor.fetchone()
        stats_xp = usuario_data['xp_usuario'] if usuario_data and usuario_data['xp_usuario'] is not None else 0

        # Montar um dicionário de estatísticas para usar no eval()
        estatisticas_usuario = {
            'eventos': stats_eventos,
            'desafios': stats_desafios,
            'relatos': stats_relatos,
            'xp_usuario': stats_xp
            # Adicione outras estatísticas que suas insígnias possam precisar
        }
        print(f"[Insígnias] Estatísticas para Usuário ID {id_usuario}: {estatisticas_usuario}") # Log para debug

        # 2. Buscar insígnias que o usuário ainda NÃO possui
        sql_insignias_elegiveis = """
            SELECT i.ID_INSIGNIA, i.nome, i.condicao
            FROM INSIGNIA i
            LEFT JOIN USUARIO_INSIGNIA ui ON i.ID_INSIGNIA = ui.ID_INSIGNIA AND ui.ID_USUARIO = %s
            WHERE ui.ID_INSIGNIA IS NULL AND i.condicao IS NOT NULL AND i.condicao != ''
        """
        cursor.execute(sql_insignias_elegiveis, (id_usuario,))
        insignias_elegiveis = cursor.fetchall()

        if not insignias_elegiveis:
            print(f"[Insígnias] Nenhuma nova insígnia elegível encontrada ou todas já foram conquistadas pelo usuário ID {id_usuario}.")
            return # Nenhuma nova insígnia para verificar

        # 3. Avaliar condições e conceder insígnias
        for insignia in insignias_elegiveis:
            condicao_str = insignia['condicao']
            try:
                # ATENÇÃO: eval() pode ser perigoso se a string 'condicao_str' vier de fontes não confiáveis.
                # Aqui, assumimos que as condições são definidas por administradores e são seguras.
                # O segundo argumento de eval ({}) é o escopo global (vazio para segurança).
                # O terceiro argumento (estatisticas_usuario) são as variáveis locais disponíveis para a expressão.
                if eval(condicao_str, {}, estatisticas_usuario):
                    # Condição atendida! Conceder a insígnia.
                    print(f"[Insígnias] Usuário ID {id_usuario} atendeu à condição '{condicao_str}' para a insígnia '{insignia['nome']}'.")
                    sql_insert_conquista = "INSERT INTO USUARIO_INSIGNIA (ID_USUARIO, ID_INSIGNIA) VALUES (%s, %s)"
                    cursor.execute(sql_insert_conquista, (id_usuario, insignia['ID_INSIGNIA']))
                    novas_insignias_conquistadas_nomes.append(insignia['nome'])
            except NameError as ne:
                # Ocorre se uma variável na string de condição não existir em 'estatisticas_usuario'
                print(f"[Insígnias Aviso] Erro ao avaliar condição '{condicao_str}' para insígnia ID {insignia['ID_INSIGNIA']}: Variável não definida - {ne}. Verifique a string de condição e o dict 'estatisticas_usuario'.")
            except SyntaxError as se:
                print(f"[Insígnias Aviso] Erro de sintaxe na condição '{condicao_str}' para insígnia ID {insignia['ID_INSIGNIA']}: {se}.")
            except Exception as e:
                # Outros erros durante a avaliação da condição
                print(f"[Insígnias Erro] Erro inesperado ao avaliar condição '{condicao_str}' para insígnia ID {insignia['ID_INSIGNIA']}: {e}")
                # Considere logar o erro `e` de forma mais robusta

        if novas_insignias_conquistadas_nomes:
            conn.commit()
            print(f"[Insígnias] Usuário ID {id_usuario} conquistou novas insígnias: {', '.join(novas_insignias_conquistadas_nomes)}")
        else:
            conn.rollback() # Ou apenas não fazer commit se nada mudou
            print(f"[Insígnias] Nenhuma nova insígnia concedida ao usuário ID {id_usuario} nesta verificação.")

    except mysql.connector.Error as err_db:
        if conn:
            conn.rollback()
        print(f"[Insígnias Erro DB] Erro de banco de dados ao verificar insígnias para usuário ID {id_usuario}: {err_db}")
    except Exception as e_geral:
        if conn:
            conn.rollback()
        print(f"[Insígnias Erro Geral] Erro inesperado ao verificar insígnias para usuário ID {id_usuario}: {e_geral}")
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

    # Você pode retornar novas_insignias_conquistadas_nomes se quiser notificar o usuário no frontend
    return novas_insignias_conquistadas_nomes

# CORREÇÃO PARA ELASTIC BEANSTALK
application = app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)