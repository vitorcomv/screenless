import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CriarEventos.css"; // Importe o arquivo CSS

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
      formData.append("imagem", form.imagem);
    }

    try {
      const response = await fetch("http://localhost:5000/api/criar_evento", { // Crie esta rota no seu backend
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.mensagem);
        navigate("/eventos"); // Redirecione para a página de eventos após a criação
      } else {
        alert(data.erro);
      }
    } catch (error) {
      alert("Erro ao criar o evento: " + error.message);
    }
  };

  return (
    <div className="criar-evento-container">
      <div className="criar-evento-form-wrapper">
        <h2>Criar Evento <span role="img" aria-label="footprints">👣👣</span></h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
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
          <div className="form-group">
            <label htmlFor="organizador">Organizador</label>
            <input
              type="text"
              id="organizador"
              name="organizador"
              placeholder="Nome do organizador"
              value={form.organizador}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="endereco">Endereço do Evento</label>
            <input
              type="text"
              id="endereco"
              name="endereco"
              placeholder="Local do evento"
              value={form.endereco}
              onChange={handleChange}
            />
          </div>
          <div className="form-group inline-fields">
            <div>
              <label htmlFor="data">Data</label>
              <input
                type="date"
                id="data"
                name="data"
                value={form.data}
                onChange={handleChange}
              />
            </div>
            <div>
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
          <div className="form-group">
            <label htmlFor="descricao">Descrição do Evento</label>
            <textarea
              id="descricao"
              name="descricao"
              placeholder="Detalhes sobre o evento"
              value={form.descricao}
              onChange={handleChange}
            />
          </div>
          <div className="form-group upload-image">
            <label htmlFor="imagem">Carregue uma imagem</label>
            <div className="upload-button">
              <span>+ nome_do_arquivo</span>
              <input
                type="file"
                id="imagem"
                name="imagem"
                onChange={handleImagemChange}
                accept="image/*"
              />
            </div>
          </div>
          <button type="submit" className="criar-evento-button">
            Enviar
          </button>
        </form>
      </div>
      <div className="cadastro-evento-lateral">
        <h3>Cadastre seu evento também !</h3>
        <div className="evento-destaque">
          <img src="https://via.placeholder.com/200x150" alt="Evento Destaque" /> {/* Substitua pela sua imagem */}
          <div className="evento-info">
            <h4>Circo Alegria</h4>
            <p className="local">Prefeitura da Cidade</p>
            <p className="endereco">Rua Amelia Curbelo, 2245 - Graças</p>
            <p className="data-hora">03/05/2025 às 14:30</p>
            <p className="ingressos">Ingressos: 85/100</p>
          </div>
          <div className="pontos">80 pontos</div>
        </div>
      </div>
    </div>
  );
}