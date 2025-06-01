import React, { useEffect, useState } from "react";
import "./MeusEventos.css";
import { useNavigate } from "react-router-dom";

export default function MeusEventos() {
  const [eventosCriados, setEventosCriados] = useState([]);
  const [eventosInscritos, setEventosInscritos] = useState([]);
  const [eventoEditando, setEventoEditando] = useState(null); // Evento em edição
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    endereco: "",
    data_hora: "",
    foto: null
  });

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEventosCriados = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/eventos_criados", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setEventosCriados(data);
      } catch (err) {
        console.error("Erro ao buscar eventos criados", err);
      }
    };

    const fetchEventosInscritos = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/eventos_inscritos", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setEventosInscritos(data);
      } catch (err) {
        console.error("Erro ao buscar eventos inscritos", err);
      }
    };

    fetchEventosCriados();
    fetchEventosInscritos();
  }, [token]);

  const iniciarEdicao = (evento) => {
  const dataFormatada = new Date(evento.data_hora)
    .toISOString()
    .slice(0, 16); // yyyy-MM-ddTHH:mm

  setEventoEditando(evento.ID_EVENTO);
  setFormData({
    titulo: evento.titulo,
    descricao: evento.descricao,
    endereco: evento.endereco,
    data_hora: dataFormatada,
    foto: null
  });
};

  const cancelarEdicao = () => {
    setEventoEditando(null);
    setFormData({
      titulo: "",
      descricao: "",
      endereco: "",
      data_hora: "",
      foto: null  
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const salvarEdicao = async () => {
  const form = new FormData();
  form.append("titulo", formData.titulo);
  form.append("descricao", formData.descricao);
  form.append("endereco", formData.endereco);
  form.append("data_hora", formData.data_hora);
  if (formData.foto) form.append("foto", formData.foto); // só se nova foto for enviada

  try {
    const res = await fetch(`http://localhost:5000/api/editar_evento/${eventoEditando}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: form,
    });

    const data = await res.json();

    if (res.ok) {
      alert("Evento atualizado com sucesso.");
      setEventoEditando(null);
      setEventosCriados((prev) =>
        prev.map((e) =>
          e.ID_EVENTO === eventoEditando ? { ...e, ...formData } : e
        )
      );
    } else {
      alert(data.erro || "Erro ao atualizar evento.");
    }
  } catch (err) {
    console.error("Erro ao salvar edição:", err);
    alert("Erro na requisição.");
  }
};

  const cancelarInscricao = async (eventoId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/cancelar_inscricao?evento_id=${eventoId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert("Inscrição cancelada com sucesso.");
        setEventosInscritos(eventosInscritos.filter(e => e.ID_EVENTO !== eventoId));
      } else {
        const data = await res.json();
        alert(data.erro || "Erro ao cancelar inscrição.");
      }
    } catch (err) {
      alert("Erro na requisição.");
    }
  };

  const excluirEvento = async (eventoId) => {
    const confirmar = window.confirm("Tem certeza que deseja excluir este evento?");
    if (!confirmar) return;

    try {
      const res = await fetch(`http://localhost:5000/api/excluir_evento/${eventoId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        },
      });

      const data = await res.json();

      if (res.ok) {
        alert("Evento excluído com sucesso.");
        setEventosCriados(eventosCriados.filter(e => e.ID_EVENTO !== eventoId));
      } else {
        alert(data.erro || "Erro ao excluir evento.");
      }
    } catch (err) {
      console.error("Erro ao excluir evento:", err);
      alert("Erro na requisição.");
    }
  };

  const renderCard = (evento, isCriado = false) => (
    <div className="meus-evento-card" key={evento.ID_EVENTO}>
      {evento.foto && (
        <img
          className="meus-evento-imagem"
          src={`http://localhost:5000/uploads/${evento.foto}`}
          alt={evento.titulo}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/placeholder.png"; // certifique-se de ter esse arquivo em /public
          }}
        />
      )}

      <div className="meus-evento-info">
        <h3>{evento.titulo}</h3>
        <p className="organizador">{evento.organizador}</p>
        <p>{evento.endereco}</p>
        <p>{evento.data_hora}</p>
        {evento.descricao && <p className="descricao">{evento.descricao}</p>}
        {isCriado ? (
          <>
            <button className="evento-btn editar" onClick={() => iniciarEdicao(evento)}>
              Editar Evento
            </button>
            <button className="evento-btn excluir" onClick={() => excluirEvento(evento.ID_EVENTO)}>
              Excluir Evento
            </button>
          </>
        ) : (
          <button className="evento-btn cancelar" onClick={() => cancelarInscricao(evento.ID_EVENTO)}>
            Cancelar Inscrição
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="meus-eventos-container">
      <h2>Meus Eventos</h2>

      {eventoEditando && (
        <div className="editar-form-container">
          <h3>Editar Evento</h3>
          <input
            type="text"
            name="titulo"
            placeholder="Título"
            value={formData.titulo}
            onChange={handleInputChange}
          />
          <textarea
            name="descricao"
            placeholder="Descrição"
            value={formData.descricao}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="endereco"
            placeholder="Endereço"
            value={formData.endereco}
            onChange={handleInputChange}
          />
          <input
            type="datetime-local"
            name="data_hora"
            value={formData.data_hora}
            onChange={handleInputChange}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, foto: e.target.files[0] }))
            }
          />
          <div className="editar-form-buttons">
            <button className="evento-btn editar" onClick={salvarEdicao}>Salvar</button>
            <button className="evento-btn cancelar" onClick={cancelarEdicao}>Cancelar</button>
          </div>
        </div>
      )}

      <section>
        <h3>Eventos Criados</h3>
        {eventosCriados.length === 0 ? (
          <p className="mensagem-vazia">Você ainda não criou nenhum evento.</p>
        ) : (
          <div className="meus-eventos-grid">
            {eventosCriados.map((evento) => renderCard(evento, true))}
          </div>
        )}
      </section>

      <section>
        <h3>Eventos Inscritos</h3>
        {eventosInscritos.length === 0 ? (
          <p className="mensagem-vazia">Você ainda não está inscrito em nenhum evento.</p>
        ) : (
          <div className="meus-eventos-grid">
            {eventosInscritos.map((evento) => renderCard(evento, false))}
          </div>
        )}
      </section>
    </div>
  );
}
