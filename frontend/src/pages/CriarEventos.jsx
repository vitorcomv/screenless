import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CriarEventos.css";
import imagemcard from '../assets/imagemcard.png';

export default function CriarEvento() {
  const [form, setForm] = useState({
    titulo: "",
    organizador: "",
    endereco: "",
    data: "",
    hora: "",
    descricao: "",
    imagem: null,
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImagemChange = (e) => {
    setForm({ ...form, imagem: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("titulo", form.titulo);
    formData.append("organizador", form.organizador);
    formData.append("endereco", form.endereco);
    formData.append("data", form.data);
    formData.append("hora", form.hora);
    formData.append("descricao", form.descricao);
    if (form.imagem) {
      formData.append("foto", form.imagem); // Use 'foto' para corresponder ao backend
    }

    try {
      const response = await fetch("http://localhost:5000/api/criar_evento", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.mensagem);
        navigate("/eventos"); // Redirecione para a página de eventos
      } else {
        alert(data.erro);
      }
    } catch (error) {
      alert("Erro ao criar o evento: " + error.message);
    }
  };

  return (
    <div className="pagina-criar-evento criar-evento-container-identico">
      <div className="conteudo-criar-evento">

        {/* CARD DESTAQUE À ESQUERDA */}
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

        {/* FORMULÁRIO À DIREITA */}
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
              />
            </div>
            <div className="form-group-identico">
              <label htmlFor="organizador">Nome do organizador</label>
              <input
                type="text"
                id="organizador"
                name="organizador"
                placeholder="Nome do organizador"
                value={form.organizador}
                onChange={handleChange}
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