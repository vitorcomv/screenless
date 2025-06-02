import React, { useState, useEffect } from "react";
import "./Eventos.css";
import proximaImagem from '../assets/imagemfundo.png';
import { Link } from "react-router-dom";

export default function ListaEventos() {
  const [eventos, setEventos] = useState([]);
  const [inscritos, setInscritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/eventos");
        const data = await response.json();
        const lastThreeEventos = data.slice(-3);
        setEventos(lastThreeEventos);
        setLoading(false);
      } catch (e) {
        setError(e);
        setLoading(false);
      }
    };

    const fetchInscricoes = async () => {
      try {
        if (!token) return;
        const response = await fetch("http://localhost:5000/api/meus_eventos", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        setInscritos(data);
      } catch (e) {
        console.error("Erro ao buscar inscrições:", e);
      }
    };

    fetchEventos();
    fetchInscricoes();
  }, [token]);

  const inscreverEmEvento = async (eventoId) => {
    if (!token) {
      alert("Você precisa estar logado para se inscrever.");
      return;
    }

    const formData = new FormData();
    formData.append("evento_id", eventoId);

    try {
      const response = await fetch("http://localhost:5000/api/inscrever_evento", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.status === 201) {
        alert(data.mensagem);
        // Atualiza a lista de inscritos
        setInscritos([...inscritos, eventoId]);
      } else {
        alert(data.erro || "Erro ao se inscrever no evento.");
      }
    } catch (error) {
      alert("Erro na requisição.");
    }
  };

  if (loading) return <div>Carregando eventos...</div>;
  if (error) return <div>Erro ao carregar eventos: {error.message}</div>;

  return (
    <div>
      <div className="lista-eventos-container">
        <h2>Próximos Eventos</h2>
        <div className="eventos-grid">
          {eventos.map((evento) => {
            const jaInscrito = inscritos.includes(evento.ID_EVENTO);
            const eventoFinalizado = evento.Status === "finalizado";

            return (
              <div className="evento-card" key={evento.ID_EVENTO}>
                {evento.foto && (
                  <img
                    src={`http://localhost:5000/uploads/${evento.foto}`}
                    alt={evento.titulo}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/200x150";
                    }}
                  />
                )}
                <div className="evento-info">
                  <h3>{evento.titulo}</h3>
                  <p className="organizador">{evento.organizador}</p>
                  <p className="endereco">{evento.endereco}</p>
                  <p className="data-hora">{evento.data_hora}</p>

                  {eventoFinalizado ? (
                    <p className="evento-status-finalizado">Evento Finalizado!</p>
                  ) : (
                    <button
                      className="inscrever-button"
                      onClick={() => inscreverEmEvento(evento.ID_EVENTO)}
                      disabled={jaInscrito}
                    >
                      {jaInscrito ? "Inscrito" : "Inscrever-se"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="proxima-imagem">
        <img
          className="imagem-fundo"
          src={proximaImagem}
          alt="Imagem de fundo"
          style={{ width: "100%", display: "block" }}
        />
        <Link to="/criar-eventos">
          <button className="criar-seu-evento-button">CRIE SEU EVENTO</button>
        </Link>
      </div>
    </div>
  );
}