import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./CriarEventos.css";
import imagemcard from '../assets/imagemcard.png';
import { AuthContext } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext"; // 1. IMPORTAR O HOOK

export default function CriarEvento() {
  const [form, setForm] = useState({
    titulo: "",
    endereco: "",
    data: "",
    hora: "",
    descricao: "",
    imagem: null,
  });

  const navigate = useNavigate();
  const { token, nivelUsuario, loadingAuth } = useContext(AuthContext);
  const { showAlert } = useAlert(); // 2. OBTER A FUNÇÃO DO CONTEXTO

  useEffect(() => {
    if (!loadingAuth) {
      if (nivelUsuario !== 'ouro') {
        // 3. SUBSTITUIR O ALERTA DE PERMISSÃO
        showAlert({
          title: "Acesso Negado",
          message: "Você precisa ser nível Ouro para criar um evento.",
          type: "error"
        });
        navigate('/eventos');
      }
    }
  }, [nivelUsuario, loadingAuth, navigate, showAlert]); // Adicionar showAlert às dependências

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImagemChange = (e) => {
    setForm({ ...form, imagem: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      // 4. SUBSTITUIR OS ALERTAS NO SUBMIT
      showAlert({
        title: "Acesso Requerido",
        message: "Você precisa estar logado para criar um evento.",
        type: "warning"
      });
      return;
    }

    const formData = new FormData();
    formData.append("titulo", form.titulo);
    formData.append("endereco", form.endereco);
    formData.append("data", form.data);
    formData.append("hora", form.hora);
    formData.append("descricao", form.descricao);
    if (form.imagem) {
      formData.append("foto", form.imagem);
    }
    
    // NOTA: A linha abaixo tentava adicionar um campo 'organizador' que não existe no seu estado 'form'.
    // Removi para evitar o envio de um valor 'undefined'.
    // formData.append("organizador", form.organizador);

    try {
      const response = await fetch("https://screenless-8k2p.onrender.com/api/criar_evento", {
        method: "POST",
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        showAlert({
          title: "Sucesso!",
          message: data.mensagem || "Evento criado com sucesso.",
          type: "success"
        });
        navigate("/eventos");
      } else {
        showAlert({
          title: "Erro na Criação",
          message: data.erro || "Não foi possível criar o evento.",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Erro ao criar evento:", error);
      showAlert({
        title: "Erro de Conexão",
        message: "Falha ao comunicar com o servidor. Tente novamente.",
        type: "error"
      });
    }
  };

  if (loadingAuth) {
    return <div className="loading-auth-check">Verificando permissões...</div>;
  }

  // O JSX do seu formulário permanece o mesmo
  return (
    <div className="pagina-criar-evento criar-evento-container-identico">
        <div className="conteudo-criar-evento">
            <div className="card-evento-destaque cadastro-evento-lateral-identico">
                <h3>Cadastre seu evento também !</h3>
                <div className="evento-destaque evento-destaque-identico">
                    <img src={imagemcard} alt="Evento Destaque" />
                    <div className="evento-info evento-info-identico">
                        <h4>Circo Alegria</h4>
                        <p className="local local-identico"><em>Prefeitura da Cidade</em></p>
                        <p className="endereco-identico">Rua Amélia Curbelo, 2245 - Graças</p>
                        <p className="data-hora-identico">03/05/2025 às 14:30</p>
                        <p className="ingressos-identico">Ingressos: 85/100</p>
                    </div>
                    <div className="pontos pontos-identico">80 pontos</div>
                </div>
            </div>

            <div className="formulario-criar-evento criar-evento-form-wrapper-identico">
                <h2>Criar Evento</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group-identico">
                        <label htmlFor="titulo">Título do Evento</label>
                        <input
                            type="text"
                            id="titulo"
                            name="titulo"
                            placeholder="Digite o título do evento"
                            value={form.titulo}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group-identico">
                        <label htmlFor="endereco">Local do evento</label>
                        <input
                            type="text"
                            id="endereco"
                            name="endereco"
                            placeholder="Local do evento"
                            value={form.endereco}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="data-hora inline-fields-identico">
                        <div className="form-group-identico">
                            <label htmlFor="data">Data</label>
                            <input
                                type="date"
                                id="data"
                                name="data"
                                value={form.data}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group-identico">
                            <label htmlFor="hora">Hora</label>
                            <input
                                type="time"
                                id="hora"
                                name="hora"
                                value={form.hora}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group-identico">
                        <label htmlFor="descricao">Detalhes sobre o evento</label>
                        <textarea
                            id="descricao"
                            name="descricao"
                            placeholder="Detalhes sobre o evento"
                            value={form.descricao}
                            onChange={handleChange}
                            rows="4"
                            required
                        />
                    </div>
                    <div className="form-group-identico upload-image-identico">
                        <label htmlFor="imagem">Carregue uma imagem</label>
                        <div className="upload-button-identico">
                            <input
                                type="file"
                                id="imagem"
                                name="imagem"
                                onChange={handleImagemChange}
                                accept="image/*"
                            />
                        </div>
                    </div>
                    <button type="submit" className="criar-evento-button-identico">
                        Enviar
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
}