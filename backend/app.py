import jwt
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from functools import wraps
import datetime


import cloudinary
import cloudinary.uploader
import cloudinary.api

SECRET_KEY = 'screenlesskey'

# ADIÇÃO DA CONFIGURAÇÃO DO CLOUDINARY

cloudinary.config(
  cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"),
  api_key = os.getenv("CLOUDINARY_API_KEY"),
  api_secret = os.getenv("CLOUDINARY_API_SECRET"),
  secure = True
)

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

def nivel_requerido(nivel_minimo):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            niveis_xp = {
                'bronze': 0,
                'prata': 1000,
                'ouro': 2000
            }
            xp_necessario = niveis_xp.get(nivel_minimo.lower())
            if xp_necessario is None:
                return jsonify({'erro': 'Nível de permissão interna inválido'}), 500
            conn_check = None
            cursor_check = None
            try:
                usuario_id = request.usuario_id
                conn_check = mysql.connector.connect(**db_config)
                cursor_check = conn_check.cursor(dictionary=True)
                cursor_check.execute("SELECT xp_usuario FROM USUARIO WHERE id_usuario = %s", (usuario_id,))
                usuario = cursor_check.fetchone()
                if not usuario or usuario['xp_usuario'] < xp_necessario:
                    return jsonify({'erro': f'Acesso negado. Você precisa ser nível {nivel_minimo} ou superior.'}), 403
            except Exception as e:
                return jsonify({'erro': f'Erro ao verificar permissão: {str(e)}'}), 500
            finally:
                if cursor_check: cursor_check.close()
                if conn_check and conn_check.is_connected(): conn_check.close()
            return f(*args, **kwargs)
        return wrapper
    return decorator

app = Flask(__name__)
CORS(app)

db_config = {
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT")),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASS"),
    "database": os.getenv("DB_NAME")
}
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# MANTIDO: Rota para servir arquivos locais (usado pelas insígnias)
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route("/api/mensagem")
def mensagem():
    return jsonify({"mensagem": "API rodando!"})

@app.route("/api/registro", methods=["POST"])
def registrar_usuario():
    data = request.json
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        hashed_password = generate_password_hash(data['senha'])
        sql = "INSERT INTO USUARIO (nome, sobrenome, CPF, telefone, usuario, senha, email) VALUES (%s, %s, %s, %s, %s, %s, %s)"
        values = (data['nome'], data['sobrenome'], data['cpf'], data['telefone'], data['usuario'], hashed_password, data['email'])
        cursor.execute(sql, values)
        conn.commit()
        return jsonify({"mensagem": "Usuário registrado com sucesso!"}), 201
    except mysql.connector.IntegrityError as e:
        error_message = str(e).lower()
        if "for key 'usuario.cpf'" in error_message: return jsonify({"erro": "CPF já cadastrado"}), 400
        elif "for key 'usuario.usuario'" in error_message: return jsonify({"erro": "Nome de usuário já está em uso"}), 400
        elif "for key 'usuario.email'" in error_message: return jsonify({"erro": "Email já cadastrado"}), 400
        elif "for key 'usuario.telefone'" in error_message: return jsonify({"erro": "Telefone já cadastrado"}), 400
        else: return jsonify({"erro": "Erro ao registrar usuário: " + str(e)}), 400
    except Exception as e:
        return jsonify({"erro": "Erro no servidor: " + str(e)}), 500
    finally:
        if 'cursor' in locals() and cursor: cursor.close()
        if 'conn' in locals() and conn and conn.is_connected(): conn.close()

@app.route("/api/login", methods=["POST"])
def login_usuario():
    data = request.json
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
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
            # ALTERADO: URL da foto de perfil vem direto do DB (já é a URL completa do Cloudinary)
            foto_url_completa = user.get("foto_perfil")

            # MANTIDO: A lógica para a URL da insígnia permanece a mesma
            insignia_icone_url_completa = None
            if user.get("insignia_icone_url_db"):
                insignia_icone_url_completa = f"https://screenless-8k2p.onrender.com/uploads/{user['insignia_icone_url_db']}"
            
            token_payload = {
                'id': user["id"], 'usuario': user["usuario"], 'nome': user["nome"], 'sobrenome': user["sobrenome"],
                'foto_url': foto_url_completa, 'insignia_selecionada_id': user.get('insignia_selecionada_id'),
                'insignia_icone_url': insignia_icone_url_completa, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
            }
            token = jwt.encode({k: v for k, v in token_payload.items() if v is not None}, SECRET_KEY, algorithm="HS256")
            
            return jsonify({
                "mensagem": "Login bem-sucedido", "token": token, "usuario": user["usuario"], "nome": user["nome"],
                "foto_url": foto_url_completa, "insignia_selecionada_id": user.get('insignia_selecionada_id'),
                "insignia_icone_url": insignia_icone_url_completa
            }), 200
        else:
            return jsonify({"erro": "Usuário ou senha inválidos"}), 401
    except Exception as e:
        return jsonify({"erro": f"Erro interno ao tentar fazer login: {e}"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

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
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/criar_evento", methods=["POST"])
@token_obrigatorio
@nivel_requerido('ouro')
def criar_evento():
    conn = None
    cursor = None
    try:
        id_usuario = request.usuario_id
        titulo = request.form['titulo']
        organizador = f"{request.nome} {request.sobrenome}"
        endereco = request.form['endereco']
        data_hora_evento = f"{request.form['data']} {request.form['hora']}:00"
        descricao = request.form['descricao']
        
        foto = request.files.get('foto')
        foto_url = None
        if foto and allowed_file(foto.filename):
            upload_result = cloudinary.uploader.upload(foto)
            foto_url = upload_result.get('secure_url')

        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        sql = "INSERT INTO EVENTO (titulo, organizador, endereco, data_hora, descricao, foto, ID_USUARIO_CRIADOR) VALUES (%s, %s, %s, %s, %s, %s, %s)"
        values = (titulo, organizador, endereco, data_hora_evento, descricao, foto_url, id_usuario)
        cursor.execute(sql, values)
        conn.commit()
        verificar_e_conceder_insignias(id_usuario)
        return jsonify({"mensagem": "Evento criado com sucesso!"}), 201
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/eventos", methods=["GET"])
def obter_eventos():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        sql = """
            SELECT e.ID_EVENTO, e.titulo, e.endereco, e.descricao, e.Status,
                   DATE_FORMAT(e.data_hora, '%d/%m/%Y às %H:%i') AS data_hora,
                   e.data_hora AS data_hora_original, e.foto,
                   u.nome AS autor_nome, i.icone_url AS autor_insignia_url
            FROM EVENTO e
            JOIN USUARIO u ON e.ID_USUARIO_CRIADOR = u.Id_USUARIO
            LEFT JOIN INSIGNIA i ON u.insignia_selecionada_id = i.ID_INSIGNIA
            ORDER BY e.data_hora DESC
        """
        cursor.execute(sql)
        eventos = cursor.fetchall()
        for evento in eventos:
            # ALTERADO: A foto do evento já é a URL completa do Cloudinary
            evento['foto_url'] = evento.get('foto')
            # MANTIDO: A lógica para a URL da insígnia do autor permanece
            if evento.get('autor_insignia_url'):
                evento['autor_insignia_url'] = f"https://screenless-8k2p.onrender.com/uploads/{evento['autor_insignia_url']}"
        return jsonify(eventos), 200
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/finalizar_evento/<int:evento_id>", methods=["POST"])
@token_obrigatorio
def finalizar_evento_e_verificar_insignias(evento_id):
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        id_usuario_logado = request.usuario_id
        cursor.execute("SELECT ID_USUARIO_CRIADOR, Status, data_hora FROM EVENTO WHERE ID_EVENTO = %s", (evento_id,))
        evento = cursor.fetchone()
        if not evento:
            return jsonify({"erro": "Evento não encontrado."}), 404
        
        criador_id_db = evento['ID_USUARIO_CRIADOR']
        status_db = evento['Status']
        data_hora_evento_db = evento['data_hora']
        
        if criador_id_db != id_usuario_logado:
            return jsonify({"erro": "Você não é o criador deste evento."}), 403
        if status_db == "finalizado":
            return jsonify({"erro": "Evento já foi finalizado."}), 400
        
        data_evento = data_hora_evento_db.date()
        data_hoje = datetime.datetime.utcnow().date()
        if data_hoje < data_evento:
            return jsonify({"erro": "O evento só pode ser finalizado na data agendada."}), 400
        
        cursor.execute("UPDATE EVENTO SET Status = 'finalizado' WHERE ID_EVENTO = %s", (evento_id,))
        cursor.execute("SELECT ID_USUARIO FROM HISTORICO_EVENTO WHERE ID_EVENTO = %s", (evento_id,))
        inscritos_dicts = cursor.fetchall()
        xp_evento = 100
        usuarios_que_ganharam_xp_e_precisam_verificar_insignias = set()
        for inscrito_dict in inscritos_dicts:
            id_inscrito = inscrito_dict['ID_USUARIO']
            cursor.execute("UPDATE USUARIO SET xp_usuario = IFNULL(xp_usuario, 0) + %s WHERE ID_USUARIO = %s", (xp_evento, id_inscrito))
            usuarios_que_ganharam_xp_e_precisam_verificar_insignias.add(id_inscrito)
        
        conn.commit()
        for id_usr_participante in usuarios_que_ganharam_xp_e_precisam_verificar_insignias:
            verificar_e_conceder_insignias(id_usr_participante)
            
        return jsonify({"mensagem": f"Evento finalizado, XP distribuído para {len(inscritos_dicts)} usuários."}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"erro": f"Erro em finalizar_evento: {str(e)}"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/criar_desafio", methods=["POST"])
@token_obrigatorio
@nivel_requerido('prata')
def criar_desafio():
    conn = None
    cursor = None
    try:
        foto = request.files.get('foto')
        foto_url = None
        if foto and allowed_file(foto.filename):
            # ALTERADO: Upload para Cloudinary
            upload_result = cloudinary.uploader.upload(foto)
            foto_url = upload_result.get('secure_url')

        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        sql = "INSERT INTO DESAFIOS (ID_USUARIO, nome_usuario, Titulo, Descricao, XP, foto) VALUES (%s, %s, %s, %s, %s, %s)"
        values = (request.usuario_id, request.usuario_nome, request.form['titulo'], request.form['descricao'], int(request.form['xp']), foto_url)
        cursor.execute(sql, values)
        conn.commit()
        verificar_e_conceder_insignias(request.usuario_id)
        return jsonify({"mensagem": "Desafio criado com sucesso!"}), 201
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/desafios", methods=["GET"])
def obter_desafios():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        sql = """
            SELECT d.ID_DESAFIO, d.Titulo, d.Descricao, d.XP, d.foto, d.finalizado, d.ID_USUARIO,
                   u.nome AS autor_nome, i.icone_url AS autor_insignia_url
            FROM DESAFIOS d
            JOIN USUARIO u ON d.ID_USUARIO = u.Id_USUARIO
            LEFT JOIN INSIGNIA i ON u.insignia_selecionada_id = i.ID_INSIGNIA
            WHERE d.Status = 'ativo'
        """
        cursor.execute(sql)
        desafios = cursor.fetchall()
        for desafio in desafios:
            # ALTERADO: Foto do desafio já é URL completa
            desafio['foto_url'] = desafio.get('foto')
            # MANTIDO: Lógica para URL da insígnia
            if desafio.get('autor_insignia_url'):
                desafio['autor_insignia_url'] = f"https://screenless-8k2p.onrender.com/uploads/{desafio['autor_insignia_url']}"
        return jsonify(desafios), 200
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/inscrever_evento", methods=["POST"])
@token_obrigatorio
def inscrever_evento():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        id_usuario = request.usuario_id
        evento_id = request.form.get('evento_id')
        if not evento_id:
            return jsonify({"erro": "ID do evento é obrigatório"}), 400
        sql = "INSERT INTO HISTORICO_EVENTO (ID_USUARIO, ID_EVENTO) VALUES (%s, %s)"
        cursor.execute(sql, (id_usuario, evento_id))
        conn.commit()
        return jsonify({"mensagem": "Inscrição realizada com sucesso!"}), 201
    except mysql.connector.IntegrityError as e:
        if e.errno == 1062:
            return jsonify({"erro": "Você já está inscrito neste evento."}), 409
        return jsonify({"erro": "Erro de integridade ao tentar se inscrever."}), 400
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/meus_eventos", methods=["GET"])
@token_obrigatorio
def meus_eventos():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        id_usuario = request.usuario_id
        query = "SELECT ID_EVENTO FROM HISTORICO_EVENTO WHERE ID_USUARIO = %s"
        cursor.execute(query, (id_usuario,))
        inscritos = cursor.fetchall()
        eventos_ids = [item["ID_EVENTO"] for item in inscritos]
        return jsonify(eventos_ids)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/inscritos_evento/<int:evento_id>", methods=["GET"])
@token_obrigatorio
def inscritos_evento(evento_id):
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        query = "SELECT U.NOME, U.SOBRENOME FROM HISTORICO_EVENTO H JOIN USUARIO U ON H.ID_USUARIO = U.ID_USUARIO WHERE H.ID_EVENTO = %s"
        cursor.execute(query, (evento_id,))
        inscritos = cursor.fetchall()
        return jsonify(inscritos), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/eventos_criados", methods=["GET"])
@token_obrigatorio
def eventos_criados():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        sql = "SELECT e.*, e.foto as foto_url, u.nome AS organizador_nome FROM EVENTO e JOIN USUARIO u ON e.ID_USUARIO_CRIADOR = u.ID_USUARIO WHERE e.ID_USUARIO_CRIADOR = %s"
        cursor.execute(sql, (request.usuario_id,))
        eventos = cursor.fetchall()
        return jsonify(eventos)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/eventos_inscritos", methods=["GET"])
@token_obrigatorio
def eventos_inscritos():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        user_id = request.usuario_id
        sql = "SELECT E.*, E.foto as foto_url, E.ID_USUARIO_CRIADOR = %s AS eCriador FROM EVENTO E JOIN HISTORICO_EVENTO H ON E.ID_EVENTO = H.ID_EVENTO WHERE H.ID_USUARIO = %s"
        cursor.execute(sql, (user_id, user_id))
        eventos = cursor.fetchall()
        return jsonify(eventos), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

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
        return jsonify({"erro": "Erro interno"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

@app.route('/api/editar_evento/<int:evento_id>', methods=['PUT'])
@token_obrigatorio
def editar_evento(evento_id):
    conn = None
    try:
        user_id = request.usuario_id 
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT 1 FROM EVENTO WHERE ID_EVENTO = %s AND ID_USUARIO_CRIADOR = %s", (evento_id, user_id))
        if not cursor.fetchone():
            return jsonify({"erro": "Evento não encontrado ou você não tem permissão para editar."}), 404
        
        updates = []
        params = []
        if "titulo" in request.form: updates.append("TITULO = %s"); params.append(request.form['titulo'])
        if "descricao" in request.form: updates.append("DESCRICAO = %s"); params.append(request.form['descricao'])
        if "endereco" in request.form: updates.append("ENDERECO = %s"); params.append(request.form['endereco'])
        if "data_hora" in request.form: updates.append("DATA_HORA = %s"); params.append(request.form['data_hora'])
        
        foto = request.files.get("foto")
        if foto and allowed_file(foto.filename):
            # ALTERADO: Upload para Cloudinary
            upload_result = cloudinary.uploader.upload(foto)
            foto_url = upload_result.get('secure_url')
            updates.append("FOTO = %s")
            params.append(foto_url)

        if not updates:
            return jsonify({"erro": "Nenhum dado para atualizar"}), 400

        update_query = f"UPDATE EVENTO SET {', '.join(updates)} WHERE ID_EVENTO = %s AND ID_USUARIO_CRIADOR = %s"
        params.extend([evento_id, user_id])
        
        # Usar um novo cursor para o UPDATE para evitar conflitos
        update_cursor = conn.cursor()
        update_cursor.execute(update_query, tuple(params))
        conn.commit()
        update_cursor.close()

        # Retorna o evento atualizado para o frontend
        cursor.execute("SELECT e.*, e.foto as foto_url FROM EVENTO e JOIN USUARIO u ON e.ID_USUARIO_CRIADOR = u.Id_USUARIO WHERE e.ID_EVENTO = %s", (evento_id,))
        evento_atualizado = cursor.fetchone()
        return jsonify({"evento": evento_atualizado}), 200
    except Exception as e:
        return jsonify({"erro": "Erro interno do servidor ao tentar editar o evento"}), 500
    finally:
        if 'cursor' in locals() and cursor: cursor.close()
        if 'conn' in locals() and conn and conn.is_connected(): conn.close()

@app.route('/api/excluir_evento/<int:evento_id>', methods=['DELETE'])
@token_obrigatorio
def excluir_evento(evento_id):
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        user_id = request.usuario_id
        cursor.execute("DELETE FROM HISTORICO_EVENTO WHERE ID_EVENTO = %s", (evento_id,))
        cursor.execute("DELETE FROM EVENTO WHERE ID_EVENTO = %s AND ID_USUARIO_CRIADOR = %s", (evento_id, user_id))
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({"erro": "Evento não encontrado ou sem permissão"}), 404
        return jsonify({"mensagem": "Evento excluído com sucesso"}), 200
    except Exception as e:
        return jsonify({"erro": "Erro interno"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

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
        sql = "INSERT INTO HISTORICO_DESAFIO (ID_USUARIO, ID_DESAFIO) VALUES (%s, %s)"
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
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/desafios_criados", methods=["GET"])
@token_obrigatorio
def desafios_criados():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        id_usuario = request.usuario_id
        sql = """
        SELECT d.ID_DESAFIO, d.Titulo, d.Descricao, d.XP, d.foto as foto_url, d.finalizado,
               (SELECT Nome FROM USUARIO WHERE ID_USUARIO = d.ID_USUARIO) AS nome_usuario
        FROM DESAFIOS d
        WHERE d.ID_USUARIO = %s ORDER BY d.ID_DESAFIO DESC;
        """
        cursor.execute(sql, (id_usuario,))
        desafios = cursor.fetchall()
        return jsonify(desafios), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/desafios_inscritos", methods=["GET"])
@token_obrigatorio
def desafios_inscritos():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        id_usuario = request.usuario_id
        sql = """
        SELECT d.ID_DESAFIO, d.Titulo, d.Descricao, d.XP, d.foto as foto_url, d.finalizado,
               (SELECT Nome FROM USUARIO WHERE ID_USUARIO = d.ID_USUARIO) AS nome_usuario
        FROM DESAFIOS d
        JOIN HISTORICO_DESAFIO hd ON d.ID_DESAFIO = hd.ID_DESAFIO
        WHERE hd.ID_USUARIO = %s ORDER BY d.ID_DESAFIO DESC;
        """
        cursor.execute(sql, (id_usuario,))
        desafios = cursor.fetchall()
        return jsonify(desafios), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/cancelar_inscricao_desafio/<int:desafio_id>", methods=["DELETE"])
@token_obrigatorio
def cancelar_inscricao_desafio_por_id(desafio_id):
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        id_usuario = request.usuario_id
        sql = "DELETE FROM HISTORICO_DESAFIO WHERE ID_USUARIO = %s AND ID_DESAFIO = %s"
        cursor.execute(sql, (id_usuario, desafio_id))
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({"erro": "Inscrição não encontrada ou já cancelada."}), 404
        return jsonify({"mensagem": "Inscrição cancelada com sucesso!"}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"erro": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

@app.route('/api/desafio/<int:desafio_id>', methods=['GET'])
@token_obrigatorio
def obter_desafio_para_edicao(desafio_id):
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        sql = "SELECT *, foto as foto_url FROM DESAFIOS WHERE ID_DESAFIO = %s AND ID_USUARIO = %s"
        cursor.execute(sql, (desafio_id, request.usuario_id))
        desafio = cursor.fetchone()
        if desafio:
            return jsonify(desafio), 200
        else:
            return jsonify({'erro': 'Desafio não encontrado ou você não tem permissão para acessá-lo.'}), 404
    except Exception as e:
        return jsonify({'erro': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/editar_desafio/<int:desafio_id>", methods=["PUT"])
@token_obrigatorio
def editar_desafio(desafio_id):
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        id_usuario = request.usuario_id
        cursor.execute("SELECT ID_USUARIO FROM DESAFIOS WHERE ID_DESAFIO = %s", (desafio_id,))
        criador = cursor.fetchone()
        if not criador or criador[0] != id_usuario:
            return jsonify({"erro": "Você não tem permissão para editar este desafio."}), 403
        
        updates = []
        params = []
        if "titulo" in request.form: updates.append("Titulo = %s"); params.append(request.form["titulo"])
        if "descricao" in request.form: updates.append("Descricao = %s"); params.append(request.form["descricao"])
        if "xp" in request.form: updates.append("XP = %s"); params.append(request.form["xp"])

        foto_file = request.files.get("foto")
        if foto_file:
            # ALTERADO: Upload para Cloudinary
            upload_result = cloudinary.uploader.upload(foto_file)
            foto_url = upload_result.get('secure_url')
            updates.append("foto = %s")
            params.append(foto_url)

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
        return jsonify({"erro": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/excluir_desafio/<int:desafio_id>", methods=["DELETE"])
@token_obrigatorio
def excluir_desafio(desafio_id):
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        id_usuario = request.usuario_id
        cursor.execute("SELECT ID_USUARIO FROM DESAFIOS WHERE ID_DESAFIO = %s", (desafio_id,))
        criador = cursor.fetchone()
        if not criador or criador[0] != id_usuario:
            return jsonify({"erro": "Você não tem permissão para excluir este desafio."}), 403
        
        cursor.execute("DELETE FROM HISTORICO_DESAFIO WHERE ID_DESAFIO = %s", (desafio_id,))
        cursor.execute("DELETE FROM DESAFIOS WHERE ID_DESAFIO = %s", (desafio_id,))
        conn.commit()
        return jsonify({"mensagem": "Desafio excluído com sucesso!"}), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/finalizar_desafio_post/<int:desafio_id>", methods=["POST"])
@token_obrigatorio
def finalizar_desafio_e_verificar_insignias(desafio_id):
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        id_usuario_logado = request.usuario_id
        cursor.execute("SELECT ID_USUARIO, XP, Status FROM DESAFIOS WHERE ID_DESAFIO = %s", (desafio_id,))
        desafio = cursor.fetchone()
        if not desafio:
            return jsonify({"erro": "Desafio não encontrado."}), 404

        criador_id_db = desafio['ID_USUARIO']
        xp_desafio_db = desafio['XP']
        status_db = desafio['Status']

        if criador_id_db != id_usuario_logado:
            return jsonify({"erro": "Você não é o criador deste desafio."}), 403
        if status_db == "finalizado":
            return jsonify({"erro": "Desafio já está finalizado."}), 400

        cursor.execute("UPDATE DESAFIOS SET Status = 'finalizado', finalizado = 1 WHERE ID_DESAFIO = %s", (desafio_id,))
        cursor.execute("SELECT ID_USUARIO FROM HISTORICO_DESAFIO WHERE ID_DESAFIO = %s", (desafio_id,))
        inscritos_dicts = cursor.fetchall()
        
        usuarios_que_ganharam_xp_e_precisam_verificar_insignias = set()
        for inscrito_dict in inscritos_dicts:
            id_usuario_inscrito = inscrito_dict['ID_USUARIO']
            cursor.execute("UPDATE USUARIO SET xp_usuario = IFNULL(xp_usuario, 0) + %s WHERE ID_USUARIO = %s", (xp_desafio_db, id_usuario_inscrito))
            usuarios_que_ganharam_xp_e_precisam_verificar_insignias.add(id_usuario_inscrito)
        conn.commit()

        for id_usr_participante in usuarios_que_ganharam_xp_e_precisam_verificar_insignias:
            verificar_e_conceder_insignias(id_usr_participante)

        return jsonify({"mensagem": f"Desafio finalizado, XP distribuído para {len(inscritos_dicts)} usuários."}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"erro": f"Erro em finalizar_desafio: {str(e)}"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/finalizar_desafio_put/<int:desafio_id>", methods=["PUT"])
@token_obrigatorio
def finalizar_desafio_put(desafio_id):
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        id_usuario = request.usuario_id
        cursor.execute("SELECT ID_USUARIO FROM DESAFIOS WHERE ID_DESAFIO = %s", (desafio_id,))
        criador = cursor.fetchone()
        if not criador or criador[0] != id_usuario:
            return jsonify({"erro": "Você não tem permissão para finalizar este desafio."}), 403
        
        sql = "UPDATE DESAFIOS SET finalizado = TRUE WHERE ID_DESAFIO = %s"
        cursor.execute(sql, (desafio_id,))
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({"erro": "Desafio não encontrado ou já finalizado."}), 404
        return jsonify({"mensagem": "Desafio finalizado com sucesso!"}), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/criar_relato", methods=["POST"])
@token_obrigatorio
def criar_relato_corrigido():
    conn = None
    cursor = None
    try:
        id_usuario_logado = request.usuario_id 
        titulo = request.json.get('titulo')
        relato_texto = request.json.get('relato')
        if not all([titulo, relato_texto]):
            return jsonify({"erro": "Título e relato são obrigatórios."}), 400

        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        sql = "INSERT INTO RELATO (ID_USUARIO, titulo, texto, data_criacao) VALUES (%s, %s, %s, NOW())"
        values = (id_usuario_logado, titulo, relato_texto) 
        cursor.execute(sql, values)
        id_novo_relato = cursor.lastrowid
        conn.commit()
        
        novas_insignias = verificar_e_conceder_insignias(id_usuario_logado)
        return jsonify({
            "mensagem": "Relato criado com sucesso!",
            "id_relato": id_novo_relato,
            "novas_insignias_conquistadas": novas_insignias
        }), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"erro": "Erro ao criar relato: " + str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/relatos", methods=["GET"])
def obter_relatos():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        sql = """
            SELECT r.ID_RELATO, r.titulo, r.texto, r.data_criacao, 
                   u.nome AS autor_nome, i.icone_url AS autor_insignia_url
            FROM RELATO r
            JOIN USUARIO u ON r.ID_USUARIO = u.Id_USUARIO
            LEFT JOIN INSIGNIA i ON u.insignia_selecionada_id = i.ID_INSIGNIA
            ORDER BY r.data_criacao DESC
        """
        cursor.execute(sql)
        relatos = cursor.fetchall()
        for relato in relatos:
            if relato.get('data_criacao'):
                relato['data_criacao_formatada'] = relato['data_criacao'].strftime('%d/%m/%Y')
            if relato.get('autor_insignia_url'):
                relato['autor_insignia_url'] = f"https://screenless-8k2p.onrender.com/uploads/{relato['autor_insignia_url']}"
        return jsonify(relatos), 200
    except Exception as e:
        return jsonify({"erro": "Erro ao obter relatos: " + str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

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
        usuario["CPF"] = f"{cpf[:3]}.***.***-{cpf[9:]}"
        # ALTERADO: URL da foto de perfil já vem completa do DB
        usuario["foto_url"] = usuario.get("foto_perfil")
        return jsonify(usuario), 200
    except Exception as e:
        return jsonify({"erro": "Erro interno"}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()
        
@app.route('/api/perfil', methods=['PUT'])
@token_obrigatorio
def atualizar_perfil():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        usuario_id = request.usuario_id

        # Dicionários para construir a query dinamicamente
        updates = []
        params = []
        
        # Coleta os campos de texto do formulário
        for field in ['nome', 'sobrenome', 'email', 'telefone', 'usuario']:
            if field in request.form:
                updates.append(f"{field}=%s")
                params.append(request.form[field])

        # Verifica se uma nova foto foi enviada
        foto = request.files.get("foto_perfil")
        foto_url = None # Variável para guardar a URL do Cloudinary
        
        if foto and allowed_file(foto.filename):
            # Faz o upload para o Cloudinary
            upload_result = cloudinary.uploader.upload(foto)
            foto_url = upload_result.get('secure_url')
            
            # Adiciona a atualização da foto na query
            updates.append("foto_perfil=%s")
            params.append(foto_url)
        
        # Se não houver nada para atualizar, retorna um erro
        if not updates:
            return jsonify({"erro": "Nenhum dado para atualizar"}), 400

        # Monta a query SQL final
        sql = f"UPDATE USUARIO SET {', '.join(updates)} WHERE Id_USUARIO=%s"
        params.append(usuario_id)
        
        cursor.execute(sql, tuple(params))
        conn.commit()

        # Prepara a resposta para o frontend
        resposta = {"mensagem": "Perfil atualizado com sucesso"}
        if foto_url:
            # Se uma nova foto foi enviada, retorna a URL dela
            resposta["foto_url"] = foto_url

        return jsonify(resposta), 200

    except mysql.connector.IntegrityError as e:
        # Tratamento de erros de duplicação (email, usuário, etc.)
        error_message = str(e).lower()
        if "for key 'usuario.email'" in error_message:
            return jsonify({"erro": "Email já cadastrado"}), 400
        elif "for key 'usuario.usuario'" in error_message:
            return jsonify({"erro": "Nome de usuário já está em uso"}), 400
        elif "for key 'usuario.telefone'" in error_message:
            return jsonify({"erro": "Telefone já cadastrado"}), 400
        else:
            return jsonify({"erro": f"Erro de integridade de dados: {e}"}), 400
    except Exception as e:
        return jsonify({"erro": f"Erro interno: {e}"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

@app.route("/api/meus_desafios_ids", methods=["GET"])
@token_obrigatorio
def meus_desafios_ids():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        id_usuario = request.usuario_id
        sql = "SELECT ID_DESAFIO FROM HISTORICO_DESAFIO WHERE ID_USUARIO = %s"
        cursor.execute(sql, (id_usuario,))
        inscricoes = cursor.fetchall()
        desafios_inscritos_ids = [item['ID_DESAFIO'] for item in inscricoes]
        return jsonify(desafios_inscritos_ids), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

@app.route('/api/mural-insignias', methods=['GET'])
@token_obrigatorio
def get_mural_insignias():
    id_usuario_logado = request.usuario_id
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT ID_INSIGNIA, nome, descricao, icone_url FROM INSIGNIA")
        todas_insignias_db = cursor.fetchall()
        if not todas_insignias_db:
            return jsonify([]), 200

        cursor.execute("SELECT ID_INSIGNIA FROM USUARIO_INSIGNIA WHERE ID_USUARIO = %s", (id_usuario_logado,))
        insignias_conquistadas_raw = cursor.fetchall()
        set_conquistadas_ids = {item['ID_INSIGNIA'] for item in insignias_conquistadas_raw}

        cursor.execute("SELECT insignia_selecionada_id FROM USUARIO WHERE Id_USUARIO = %s", (id_usuario_logado,))
        usuario_db_info = cursor.fetchone()
        id_insignia_selecionada_pelo_usuario = usuario_db_info['insignia_selecionada_id'] if usuario_db_info else None
        
        resultado_mural = []
        for insignia_db in todas_insignias_db:
            # MANTIDO: Lógica para montar URL da insígnia
            icone_url_final = None
            if insignia_db.get('icone_url'):
                icone_url_final = f"https://screenless-8k2p.onrender.com/uploads/{insignia_db['icone_url']}"
            resultado_mural.append({
                'ID_INSIGNIA': insignia_db['ID_INSIGNIA'], 'nome': insignia_db['nome'],
                'descricao': insignia_db['descricao'], 'icone_url': icone_url_final,
                'conquistada': insignia_db['ID_INSIGNIA'] in set_conquistadas_ids,
                'selecionada': insignia_db['ID_INSIGNIA'] == id_insignia_selecionada_pelo_usuario
            })
        return jsonify(resultado_mural), 200
    except Exception as e:
        return jsonify({'erro': f'Erro inesperado no servidor: {str(e)}'}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

@app.route('/api/usuario/insignia-selecionada', methods=['PUT'])
@token_obrigatorio
def selecionar_insignia_para_usuario():
    id_usuario_logado = request.usuario_id
    dados_requisicao = request.get_json()
    if dados_requisicao is None:
        return jsonify({'erro': 'Corpo da requisição não pode ser vazio.'}), 400

    id_insignia_para_selecionar = dados_requisicao.get('id_insignia')
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        nova_insignia_icone_url = None
        if id_insignia_para_selecionar is not None:
            try:
                id_insignia_para_selecionar = int(id_insignia_para_selecionar)
            except ValueError:
                return jsonify({'erro': 'ID da insígnia inválido.'}), 400
            
            cursor.execute("SELECT icone_url FROM INSIGNIA WHERE ID_INSIGNIA = %s", (id_insignia_para_selecionar,))
            insignia_info = cursor.fetchone()
            if not insignia_info:
                return jsonify({'erro': 'Insígnia não encontrada no sistema.'}), 404
            
            cursor.execute("SELECT 1 FROM USUARIO_INSIGNIA WHERE ID_USUARIO = %s AND ID_INSIGNIA = %s", (id_usuario_logado, id_insignia_para_selecionar))
            if not cursor.fetchone():
                return jsonify({'erro': 'Você não conquistou esta insígnia para selecioná-la.'}), 403
            
            cursor.execute("UPDATE USUARIO SET insignia_selecionada_id = %s WHERE Id_USUARIO = %s", (id_insignia_para_selecionar, id_usuario_logado))
            # MANTIDO: Lógica para montar URL da insígnia
            if insignia_info.get('icone_url'):
                nova_insignia_icone_url = f"https://screenless-8k2p.onrender.com/uploads/{insignia_info['icone_url']}"
            mensagem_sucesso = "Insígnia selecionada com sucesso!"
        else:
            cursor.execute("UPDATE USUARIO SET insignia_selecionada_id = NULL WHERE Id_USUARIO = %s", (id_usuario_logado,))
            mensagem_sucesso = "Insígnia desmarcada com sucesso!"
            id_insignia_para_selecionar = None
        
        conn.commit()
        return jsonify({
            'mensagem': mensagem_sucesso,
            'insignia_selecionada_id': id_insignia_para_selecionar,
            'insignia_icone_url': nova_insignia_icone_url
        }), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'erro': f'Erro inesperado no servidor: {str(e)}'}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

def verificar_e_conceder_insignias(id_usuario):
    conn = None
    cursor = None
    novas_insignias_conquistadas_nomes = []
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        # 1. Obter estatísticas
        cursor.execute("SELECT xp_usuario FROM USUARIO WHERE Id_USUARIO = %s", (id_usuario,))
        usuario_data = cursor.fetchone()
        stats_xp = usuario_data['xp_usuario'] if usuario_data else 0
        cursor.execute("SELECT COUNT(*) AS total FROM DESAFIOS WHERE ID_USUARIO = %s", (id_usuario,))
        stats_desafios_criados = cursor.fetchone()['total'] or 0
        cursor.execute("SELECT COUNT(*) AS total FROM EVENTO WHERE ID_USUARIO_CRIADOR = %s", (id_usuario,))
        stats_eventos_criados = cursor.fetchone()['total'] or 0
        cursor.execute("SELECT COUNT(*) AS total FROM HISTORICO_EVENTO WHERE ID_USUARIO = %s", (id_usuario,))
        stats_eventos_participados = cursor.fetchone()['total'] or 0
        cursor.execute("SELECT COUNT(*) AS total FROM RELATO WHERE ID_USUARIO = %s", (id_usuario,))
        stats_relatos = cursor.fetchone()['total'] or 0
        estatisticas_usuario = {
            'XP': stats_xp, 'DESAFIOS_CRIADOS': stats_desafios_criados,
            'EVENTOS_CRIADOS': stats_eventos_criados, 'EVENTOS_PARTICIPADOS': stats_eventos_participados,
            'COMENTARIOS': stats_relatos
        }
        # 2. Buscar insígnias elegíveis
        sql_insignias_elegiveis = """
            SELECT i.ID_INSIGNIA, i.nome, i.condicao FROM INSIGNIA i
            LEFT JOIN USUARIO_INSIGNIA ui ON i.ID_INSIGNIA = ui.ID_INSIGNIA AND ui.ID_USUARIO = %s
            WHERE ui.ID_INSIGNIA IS NULL AND i.condicao IS NOT NULL AND i.condicao != ''
        """
        cursor.execute(sql_insignias_elegiveis, (id_usuario,))
        insignias_elegiveis = cursor.fetchall()
        # 3. Avaliar e conceder
        for insignia in insignias_elegiveis:
            condicao_str = insignia['condicao']
            try:
                if eval(condicao_str, {}, estatisticas_usuario):
                    sql_insert = "INSERT INTO USUARIO_INSIGNIA (ID_USUARIO, ID_INSIGNIA) VALUES (%s, %s)"
                    cursor.execute(sql_insert, (id_usuario, insignia['ID_INSIGNIA']))
                    novas_insignias_conquistadas_nomes.append(insignia['nome'])
            except Exception as e:
                print(f"[Insígnias Erro] Falha ao avaliar condição '{condicao_str}': {e}")
        if novas_insignias_conquistadas_nomes:
            conn.commit()
    except Exception as e_geral:
        if conn: conn.rollback()
        print(f"[Insígnias Erro Fatal] {e_geral}")
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()
    return novas_insignias_conquistadas_nomes

application = app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)